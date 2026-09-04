import ts from 'typescript'
import { extractDoc, formatDocBlock, isExcluded, findTypeAlias, findMixinClassExpression, findDefaultExportClass, findFunctionDeclarations, findObjectLiteralConst } from './ast'
import { MIXINS, CONCRETE_CLASSES, GAME_OBJECT_FILE, SET_TYPE_OVERRIDES, OBJECT_LITERALS, FREE_FUNCTIONS } from './sources'

const INDENT = '    '

export function createProgram(): { program: ts.Program; checker: ts.TypeChecker } {
    const rootFiles = [
        ...CONCRETE_CLASSES.map((c) => c.file),
        ...OBJECT_LITERALS.map((o) => o.file),
        ...FREE_FUNCTIONS.map((f) => f.file),
    ]
    const program = ts.createProgram(rootFiles, {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        strict: false,
        skipLibCheck: true,
    })
    return { program, checker: program.getTypeChecker() }
}

function getSourceFile(program: ts.Program, file: string): ts.SourceFile {
    const sourceFile = program.getSourceFile(file)
    if (!sourceFile) throw new Error(`Could not load source file: ${file}`)
    return sourceFile
}

/**
 * Renders one `*Props` type's own fields as already-indented, doc-commented
 * lines. Handles both a plain type literal (the 6 mixins' own `*Props`) and an
 * intersection whose last member is the type's own fields (every concrete
 * class's `type XProps = GameObjectProps & {...}` / `RotatableProps & ViewableProps & {...}`)
 * — only that last member's fields belong to this type; the rest are inherited.
 */
export function extractPropsFields(typeAlias: ts.TypeAliasDeclaration): string[] {
    let typeLiteral: ts.TypeLiteralNode | undefined
    if (ts.isTypeLiteralNode(typeAlias.type)) {
        typeLiteral = typeAlias.type
    } else if (ts.isIntersectionTypeNode(typeAlias.type)) {
        const last = typeAlias.type.types[typeAlias.type.types.length - 1]
        if (last && ts.isTypeLiteralNode(last)) typeLiteral = last
    }
    if (!typeLiteral) return []
    const sourceFile = typeAlias.getSourceFile()

    const lines: string[] = []
    for (const member of typeLiteral.members) {
        if (!ts.isPropertySignature(member) || !member.type) continue
        const name = member.name.getText(sourceFile)
        const optional = member.questionToken ? '?' : ''
        const type = member.type.getText(sourceFile)
        const doc = extractDoc(member)
        lines.push(`${formatDocBlock(doc, INDENT)}${INDENT}${name}${optional}: ${type}`)
    }
    return lines
}

/**
 * Real getters/properties in this codebase often carry no explicit return
 * type annotation — TS infers it instead. `.getText()` on an absent type node
 * isn't an option, so this asks the checker for the accessor's/method's real
 * inferred return type whenever there's no explicit annotation to read verbatim.
 */
function returnTypeText(node: ts.GetAccessorDeclaration | ts.MethodDeclaration | ts.FunctionDeclaration, checker: ts.TypeChecker, sourceFile: ts.SourceFile): string {
    if (node.type) return node.type.getText(sourceFile)
    const signature = checker.getSignatureFromDeclaration(node)
    if (!signature) return 'any'
    return checker.typeToString(checker.getReturnTypeOfSignature(signature))
}

/** The single `return {...}` statement's object literal, if `fn` has no explicit return-type annotation and its body is exactly that — used by {@link functionReturnTypeText} to keep a returned object's own JSDoc'd methods (e.g. `repeat(...).then(...)`) instead of losing them to a flat checker-derived type string. */
function objectLiteralReturnStatement(fn: ts.FunctionDeclaration): ts.ObjectLiteralExpression | undefined {
    if (fn.type || !fn.body) return undefined
    for (const statement of fn.body.statements) {
        if (ts.isReturnStatement(statement) && statement.expression && ts.isObjectLiteralExpression(statement.expression)) {
            return statement.expression
        }
    }
    return undefined
}

/**
 * Like {@link returnTypeText}, but for a free function whose real (inferred)
 * return value is an object literal with its own documented methods — the
 * `repeat`/`repeatUntil`/`repeatWhile` family, whose `.then(...)` would
 * otherwise render as a bare, undocumented `{ then(...): void }` via
 * `checker.typeToString`, which only knows structural types and drops
 * comments entirely.
 */
function functionReturnTypeText(checker: ts.TypeChecker, fn: ts.FunctionDeclaration, sourceFile: ts.SourceFile): string {
    if (fn.type) return fn.type.getText(sourceFile)

    const literal = objectLiteralReturnStatement(fn)
    if (literal) {
        const members = [...extractObjectLiteralMembers(checker, literal).values()]
        return `{\n${members.join('\n\n')}\n}`
    }

    return returnTypeText(fn, checker, sourceFile)
}

/** Same idea as {@link returnTypeText}, for a declaration whose own type (not a return type) may be inferred. */
function declaredTypeText(typeNode: ts.TypeNode | undefined, valueNode: ts.Node, checker: ts.TypeChecker, sourceFile: ts.SourceFile): string {
    if (typeNode) return typeNode.getText(sourceFile)
    return checker.typeToString(checker.getTypeAtLocation(valueNode))
}

type AccessorGroup = { kind: 'accessor'; getter: ts.GetAccessorDeclaration; setter?: ts.SetAccessorDeclaration; isStatic: boolean }
// FunctionDeclaration alongside MethodDeclaration lets renderMethod double as the renderer for a plain
// object literal's property-assigned-to-a-function-identifier members (see extractObjectLiteralMembers) —
// both node kinds expose the same `.parameters`/`.type`/`.body` shape renderMethod actually touches.
type MethodGroup = { kind: 'method'; signatures: (ts.MethodDeclaration | ts.FunctionDeclaration)[]; isStatic: boolean }
type PropertyGroup = { kind: 'property'; decl: ts.PropertyDeclaration; isStatic: boolean }

/** True for `static` class members — irrelevant to every existing GameObject-family class (none has any), but real for e.g. Vector2's `static from(...)`/`static ZERO`/`static ONE`. */
function isStaticMember(member: ts.ClassElement): boolean {
    return (ts.getCombinedModifierFlags(member as ts.Declaration) & ts.ModifierFlags.Static) !== 0
}

function groupMembers(members: ts.NodeArray<ts.ClassElement>): Map<string, AccessorGroup | MethodGroup | PropertyGroup> {
    const groups = new Map<string, AccessorGroup | MethodGroup | PropertyGroup>()

    for (const member of members) {
        const name = member.name?.getText()
        if (!name || isExcluded(name)) continue

        if (ts.isGetAccessor(member)) {
            const existing = groups.get(name)
            if (existing?.kind === 'accessor') existing.getter = member
            else groups.set(name, { kind: 'accessor', getter: member, isStatic: isStaticMember(member) })
        } else if (ts.isSetAccessor(member)) {
            const existing = groups.get(name)
            if (existing?.kind === 'accessor') existing.setter = member
            // A setter with no getter yet (declaration order) shouldn't happen in this
            // codebase's real source, and a setter alone isn't renderable — skip until
            // its getter is found; if it never is, it's silently omitted.
        } else if (ts.isMethodDeclaration(member)) {
            const existing = groups.get(name)
            if (existing?.kind === 'method') existing.signatures.push(member)
            else groups.set(name, { kind: 'method', signatures: [member], isStatic: isStaticMember(member) })
        } else if (ts.isPropertyDeclaration(member)) {
            groups.set(name, { kind: 'property', decl: member, isStatic: isStaticMember(member) })
        }
    }
    return groups
}

function renderAccessor(name: string, group: AccessorGroup, overrideKey: string, checker: ts.TypeChecker): string {
    const sourceFile = group.getter.getSourceFile()
    const doc = extractDoc(group.getter)
    const getType = returnTypeText(group.getter, checker, sourceFile)
    const staticPrefix = group.isStatic ? 'static ' : ''

    if (!group.setter) {
        return `${formatDocBlock(doc, INDENT)}${INDENT}${staticPrefix}readonly ${name}: ${getType}`
    }

    const param = group.setter.parameters[0]
    const rawSetType = param ? declaredTypeText(param.type, param, checker, sourceFile) : getType
    const setType = SET_TYPE_OVERRIDES[overrideKey] ?? rawSetType

    if (setType === getType) {
        return `${formatDocBlock(doc, INDENT)}${INDENT}${staticPrefix}${name}: ${getType}`
    }

    const paramName = param?.name.getText(sourceFile) ?? name
    return `${formatDocBlock(doc, INDENT)}${INDENT}${staticPrefix}get ${name}(): ${getType}\n${INDENT}${staticPrefix}set ${name}(${paramName}: ${setType})`
}

/** Renders one signature's parameter list, e.g. `a: number, b?: string, ...rest: any[]`. */
function renderParams(parameters: readonly ts.ParameterDeclaration[], checker: ts.TypeChecker, sourceFile: ts.SourceFile): string {
    return parameters
        .map((p) => {
            const rest = p.dotDotDotToken ? '...' : ''
            const optional = p.questionToken || p.initializer ? '?' : ''
            const type = declaredTypeText(p.type, p, checker, sourceFile)
            return `${rest}${p.name.getText(sourceFile)}${optional}: ${type}`
        })
        .join(', ')
}

function renderMethod(name: string, group: MethodGroup, checker: ts.TypeChecker): string {
    const sourceFile = group.signatures[0]!.getSourceFile()
    // A pure signature (no body) is an overload declaration; if any exist, render
    // only those. Otherwise there's a single real method — render its own signature.
    const overloads = group.signatures.filter((s) => s.body === undefined)
    const toRender = overloads.length > 0 ? overloads : [group.signatures[0]!]
    const staticPrefix = group.isStatic ? 'static ' : ''

    return toRender
        .map((sig) => {
            const doc = extractDoc(sig)
            const params = renderParams(sig.parameters, checker, sourceFile)
            const returnType = returnTypeText(sig, checker, sourceFile)
            return `${formatDocBlock(doc, INDENT)}${INDENT}${staticPrefix}${name}(${params}): ${returnType}`
        })
        .join('\n\n')
}

function renderProperty(name: string, group: PropertyGroup, checker: ts.TypeChecker): string {
    const sourceFile = group.decl.getSourceFile()
    const doc = extractDoc(group.decl)
    const type = declaredTypeText(group.decl.type, group.decl, checker, sourceFile)
    const staticPrefix = group.isStatic ? 'static ' : ''
    const optional = group.decl.questionToken ? '?' : ''
    return `${formatDocBlock(doc, INDENT)}${INDENT}${staticPrefix}${name}${optional}: ${type}`
}

/** Renders a class body's own (non-`_`-prefixed) members as an ordered map of name -> line(s). */
function extractOwnMembers(classNode: ts.ClassDeclaration | ts.ClassExpression, ownerName: string, checker: ts.TypeChecker): Map<string, string> {
    const result = new Map<string, string>()
    const groups = groupMembers(classNode.members)

    for (const [name, group] of groups) {
        const overrideKey = `${ownerName}.${name}`
        if (group.kind === 'accessor') result.set(name, renderAccessor(name, group, overrideKey, checker))
        else if (group.kind === 'method') result.set(name, renderMethod(name, group, checker))
        else result.set(name, renderProperty(name, group, checker))
    }
    return result
}

/**
 * Renders a plain object literal's own (non-`_`-prefixed) properties, the
 * same way extractOwnMembers does for a class body — used for Random (a
 * `const Random = {...}` value, not a class) and for a free function's
 * inferred `return {...}` type (see functionReturnTypeText). Three property
 * shapes: a method-shorthand property (`coinFlip() { ... }`) renders like a
 * class method; a property assigned to a bare function identifier (Random's
 * `number: randomNumber`) resolves to that function's own declaration(s) —
 * picking up its real signature and JSDoc, including overloads, rather than
 * whatever comment (if any) sits on the property itself; anything else
 * renders as a plain value property via the checker's inferred type.
 */
function extractObjectLiteralMembers(checker: ts.TypeChecker, node: ts.ObjectLiteralExpression): Map<string, string> {
    const result = new Map<string, string>()
    const sourceFile = node.getSourceFile()

    for (const prop of node.properties) {
        const name = prop.name?.getText(sourceFile)
        if (!name || isExcluded(name)) continue

        if (ts.isMethodDeclaration(prop)) {
            result.set(name, renderMethod(name, { kind: 'method', signatures: [prop], isStatic: false }, checker))
            continue
        }

        if (!ts.isPropertyAssignment(prop)) continue // shorthand/spread properties aren't used in these object literals today

        if (ts.isIdentifier(prop.initializer)) {
            let symbol = checker.getSymbolAtLocation(prop.initializer)
            if (symbol && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol)
            const signatures = symbol?.declarations?.filter(ts.isFunctionDeclaration) ?? []
            if (signatures.length > 0) {
                result.set(name, renderMethod(name, { kind: 'method', signatures, isStatic: false }, checker))
                continue
            }
        }

        const doc = extractDoc(prop)
        const type = declaredTypeText(undefined, prop.initializer, checker, sourceFile)
        result.set(name, `${formatDocBlock(doc, INDENT)}${INDENT}${name}: ${type}`)
    }
    return result
}

interface MixinBundle {
    propsFields: string[]
    propsTypeDef: string
    api: string
    apiLines: string[]
}

/** Extracts one mixin's Props type + class members directly from its own file. */
export function extractMixin(program: ts.Program, checker: ts.TypeChecker, mixin: (typeof MIXINS)[number]): MixinBundle {
    const sourceFile = getSourceFile(program, mixin.file)

    let propsFields: string[] = []
    let propsTypeDef = ''
    if (mixin.typeName) {
        const typeAlias = findTypeAlias(sourceFile, mixin.typeName)
        if (!typeAlias) throw new Error(`Could not find type ${mixin.typeName} in ${mixin.file}`)
        propsFields = extractPropsFields(typeAlias)
        propsTypeDef = `\ndeclare type ${mixin.typeName} = {\n${propsFields.join('\n\n')}\n}`
    }

    const classExpr = findMixinClassExpression(sourceFile, mixin.functionName)
    if (!classExpr) throw new Error(`Could not find mixin class body for ${mixin.functionName} in ${mixin.file}`)

    const members = extractOwnMembers(classExpr, mixin.functionName, checker)
    const apiLines = [...members.values()]

    return { propsFields, propsTypeDef, api: apiLines.join('\n\n'), apiLines }
}

/**
 * Resolves a class's full composed member set by walking its real heritage —
 * either a mixin call chain (`Rotatable(Viewable(Timeable(class {...})))`) or
 * `extends GameObject` (resolved via the checker, recursing into GameObject's
 * own heritage) — rather than a hand-maintained interpolation list. Later
 * entries win on name collisions (e.g. Circle's own `alpha` override replaces
 * Viewable's), matching real inheritance/override semantics.
 */
export function resolveComposedMembers(
    program: ts.Program,
    checker: ts.TypeChecker,
    sourceFile: ts.SourceFile,
    classNode: ts.ClassDeclaration | ts.ClassExpression,
    ownerName: string,
    mixinCache: Map<string, Map<string, string>>
): Map<string, string> {
    const result = new Map<string, string>()
    const heritage = classNode.heritageClauses?.[0]?.types[0]?.expression

    if (heritage && ts.isCallExpression(heritage)) {
        // Mixin chain: collect each called mixin name from outermost to innermost,
        // then apply their members outer-first so the innermost (base-most) mixin's
        // members are naturally overridable by outer ones, matching real precedence.
        const chain: string[] = []
        let current: ts.Expression = heritage
        while (ts.isCallExpression(current)) {
            const callee = current.expression
            if (ts.isIdentifier(callee)) chain.push(callee.text)
            const arg = current.arguments[0]
            if (!arg) break
            current = arg
        }

        for (const mixinName of [...chain].reverse()) {
            const mixin = MIXINS.find((m) => m.functionName === mixinName)
            if (!mixin) continue // not a known mixin (e.g. the innermost `class {...}` base)

            let members = mixinCache.get(mixinName)
            if (!members) {
                const mixinSourceFile = getSourceFile(program, mixin.file)
                const classExpr = findMixinClassExpression(mixinSourceFile, mixin.functionName)
                members = classExpr ? extractOwnMembers(classExpr, mixinName, checker) : new Map()
                mixinCache.set(mixinName, members)
            }
            for (const [name, line] of members) result.set(name, line)
        }
    } else if (heritage && ts.isIdentifier(heritage)) {
        // `extends GameObject`: resolve the identifier to its real class declaration
        // and recurse into its own heritage first, then layer its own members on top.
        // `GameObject` here is a default-imported binding, so the symbol at this
        // location is an import alias — `.declarations` on it points at the import
        // clause, not the class, until resolved through to the real symbol it aliases.
        let symbol = checker.getSymbolAtLocation(heritage)
        if (symbol && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol)
        const decl = symbol?.declarations?.find(ts.isClassDeclaration)
        if (decl) {
            const parentSource = decl.getSourceFile()
            // The recursive call's own trailing step already layers the parent's
            // own members on top of whatever it inherits — no need to repeat that here.
            const parentComposed = resolveComposedMembers(program, checker, parentSource, decl, heritage.text, mixinCache)
            for (const [name, line] of parentComposed) result.set(name, line)
        }
    }

    // Finally, layer the class's own directly-declared members on top.
    for (const [name, line] of extractOwnMembers(classNode, ownerName, checker)) result.set(name, line)

    return result
}

interface ConcreteClassBundle {
    propsFields: string[]
    members: string[]
}

export function extractConcreteClass(
    program: ts.Program,
    checker: ts.TypeChecker,
    concrete: (typeof CONCRETE_CLASSES)[number],
    mixinCache: Map<string, Map<string, string>>
): ConcreteClassBundle {
    const sourceFile = getSourceFile(program, concrete.file)

    const typeAlias = concrete.typeName ? findTypeAlias(sourceFile, concrete.typeName) : undefined
    const propsFields = typeAlias ? extractPropsFields(typeAlias) : []

    const classDecl = findDefaultExportClass(sourceFile)
    if (!classDecl) throw new Error(`Could not find default export class in ${concrete.file}`)

    const composed = resolveComposedMembers(program, checker, sourceFile, classDecl, concrete.className, mixinCache)
    return { propsFields, members: [...composed.values()] }
}

/**
 * Extracts a plain `const <exportName> = {...}` object literal's own members
 * (Random, not a class — see extractObjectLiteralMembers). Returns the same
 * shape extractConcreteClass does (`propsFields` always empty — an object
 * literal has no options-object constructor to speak of) so it slots into
 * render.ts's existing concreteClasses output with no changes there.
 */
export function extractObjectLiteral(
    program: ts.Program,
    checker: ts.TypeChecker,
    entry: (typeof OBJECT_LITERALS)[number]
): ConcreteClassBundle {
    const sourceFile = getSourceFile(program, entry.file)
    const literal = findObjectLiteralConst(sourceFile, entry.exportName)
    if (!literal) throw new Error(`Could not find "const ${entry.exportName} = {...}" in ${entry.file}`)

    const members = extractObjectLiteralMembers(checker, literal)
    return { propsFields: [], members: [...members.values()] }
}

/**
 * Extracts one free function (or its overload set, like watch's two
 * signatures) as a complete, standalone `declare function name(...): T`
 * statement — unlike a class/object member, this needs no wrapper to splice
 * directly into apiLib's `declare global` block.
 */
export function extractFreeFunction(
    checker: ts.TypeChecker,
    program: ts.Program,
    entry: (typeof FREE_FUNCTIONS)[number]
): string {
    const sourceFile = getSourceFile(program, entry.file)
    const signatures = findFunctionDeclarations(sourceFile, entry.name)
    if (signatures.length === 0) throw new Error(`Could not find function "${entry.name}" in ${entry.file}`)

    const overloads = signatures.filter((s) => s.body === undefined)
    const toRender = overloads.length > 0 ? overloads : [signatures[0]!]

    return toRender
        .map((sig) => {
            const doc = extractDoc(sig)
            const params = renderParams(sig.parameters, checker, sourceFile)
            const returnType = functionReturnTypeText(checker, sig, sourceFile)
            return `${formatDocBlock(doc, '')}declare function ${entry.name}(${params}): ${returnType}`
        })
        .join('\n\n')
}
