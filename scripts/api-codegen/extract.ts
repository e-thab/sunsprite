import ts from 'typescript'
import { extractDoc, formatDocBlock, isExcluded, findTypeAlias, findMixinClassExpression, findExportedClass, findFunctionDeclarations, findObjectLiteralConst, unwrapExpression, type ExtractedDoc } from './ast'
import { MIXINS, CONCRETE_CLASSES, TYPE_ONLY_CLASSES, GAME_OBJECT_FILE, OBJECT_LITERALS, FREE_FUNCTIONS, TYPE_ALIASES, ENUMS, COLORS_FILE } from './sources'
import { REPO_ROOT, TS_PATHS } from '../aliases'

const INDENT = '    '

export function createProgram(): { program: ts.Program; checker: ts.TypeChecker } {
    const rootFiles = [
        ...CONCRETE_CLASSES.map((c) => c.file),
        ...TYPE_ONLY_CLASSES.map((c) => c.file),
        ...OBJECT_LITERALS.map((o) => o.file),
        ...FREE_FUNCTIONS.map((f) => f.file),
        ...TYPE_ALIASES.map((t) => t.file),
        ...ENUMS.map((e) => e.file),
        COLORS_FILE,
    ]
    const program = ts.createProgram(rootFiles, {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        strict: false,
        skipLibCheck: true,
        baseUrl: REPO_ROOT,
        paths: TS_PATHS,
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
        if (ts.isPropertySignature(member) && member.type) {
            lines.push(renderPropsField(member, member.type, extractDoc(member)))
        } else if (ts.isGetAccessor(member)) {
            // A get/set pair (AlignableScreenSpace's Vector2 properties, which read back a
            // Vector2 but accept any Vector2Like) stays together under the getter's doc.
            // A lone setter is skipped, as in groupMembers.
            const name = member.name.getText(sourceFile)
            const setter = typeLiteral.members.find(
                (m): m is ts.SetAccessorDeclaration => ts.isSetAccessor(m) && m.name.getText(sourceFile) === name
            )
            const setterLine = setter ? `\n${INDENT}${setter.getText(sourceFile)}` : ''
            lines.push(`${formatDocBlock(extractDoc(member), INDENT)}${INDENT}${member.getText(sourceFile)}${setterLine}`)
        }
    }
    return lines
}

/** One `*Props` field as a doc-commented line, `doc` standing in for the field's own (see extractConcreteClass's class-level defaults). */
function renderPropsField(member: ts.PropertySignature, type: ts.TypeNode, doc: ExtractedDoc): string {
    const sourceFile = member.getSourceFile()
    const name = member.name.getText(sourceFile)
    const optional = member.questionToken ? '?' : ''
    return `${formatDocBlock(doc, INDENT)}${INDENT}${name}${optional}: ${type.getText(sourceFile)}`
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

const STATIC_KEY_PREFIX = 'static '

/**
 * Static and instance members can share a name (Sound's static `volume` for the
 * master bus and each sound's own `volume`), so they're keyed apart — keyed by
 * bare name, whichever came second merged into or replaced the first.
 */
function memberKey(name: string, isStatic: boolean): string {
    return isStatic ? STATIC_KEY_PREFIX + name : name
}

/** Groups a class body's members by {@link memberKey}. */
function groupMembers(members: ts.NodeArray<ts.ClassElement>): Map<string, AccessorGroup | MethodGroup | PropertyGroup> {
    const groups = new Map<string, AccessorGroup | MethodGroup | PropertyGroup>()

    for (const member of members) {
        const name = member.name?.getText()
        if (!name || isExcluded(name)) continue
        const isStatic = isStaticMember(member)
        const key = memberKey(name, isStatic)

        if (ts.isGetAccessor(member)) {
            const existing = groups.get(key)
            if (existing?.kind === 'accessor') existing.getter = member
            else groups.set(key, { kind: 'accessor', getter: member, isStatic })
        } else if (ts.isSetAccessor(member)) {
            const existing = groups.get(key)
            if (existing?.kind === 'accessor') existing.setter = member
            // A setter with no getter yet (declaration order) shouldn't happen in this
            // codebase's real source, and a setter alone isn't renderable — skip until
            // its getter is found; if it never is, it's silently omitted.
        } else if (ts.isMethodDeclaration(member)) {
            const existing = groups.get(key)
            if (existing?.kind === 'method') existing.signatures.push(member)
            else groups.set(key, { kind: 'method', signatures: [member], isStatic })
        } else if (ts.isPropertyDeclaration(member)) {
            groups.set(key, { kind: 'property', decl: member, isStatic })
        }
    }
    return groups
}

/**
 * The object literal behind a getter written as `get X() { return SomeConst }`,
 * where SomeConst is a module-level `const SomeConst = {...}` (typically
 * `as const`, the enum-like pattern behind Background.Styles). Only for
 * unannotated getters — an explicit return type is always read verbatim.
 */
function returnedConstObjectLiteral(getter: ts.GetAccessorDeclaration, checker: ts.TypeChecker): ts.ObjectLiteralExpression | undefined {
    if (getter.type || !getter.body) return undefined
    const [statement] = getter.body.statements
    if (getter.body.statements.length !== 1 || !statement || !ts.isReturnStatement(statement) || !statement.expression) return undefined

    const returned = unwrapExpression(statement.expression)
    if (!ts.isIdentifier(returned)) return undefined

    const decl = checker.getSymbolAtLocation(returned)?.valueDeclaration
    if (!decl || !ts.isVariableDeclaration(decl) || !decl.initializer) return undefined
    if (!(ts.getCombinedNodeFlags(decl) & ts.NodeFlags.Const)) return undefined

    const initializer = unwrapExpression(decl.initializer)
    return ts.isObjectLiteralExpression(initializer) ? initializer : undefined
}

/**
 * Renders a returned const object as an inline, multi-line type literal —
 * like functionReturnTypeText does for `repeat(...).then`, so each value keeps
 * its own JSDoc (Background.Styles.Fit's description in autocomplete) instead
 * of collapsing into the checker's flat, comment-less `{ readonly Fit: "fit"; ... }`.
 * Members are readonly (they're a shared constant, not something to assign
 * into) and indented one level deeper than the member that owns them.
 */
function renderConstObjectType(checker: ts.TypeChecker, literal: ts.ObjectLiteralExpression): string {
    const members = [...extractObjectLiteralMembers(checker, literal, true).values()]
    const indented = members.map((member) => member.replace(/^/gm, INDENT))
    return `{\n${indented.join('\n\n')}\n${INDENT}}`
}

function renderAccessor(name: string, group: AccessorGroup, checker: ts.TypeChecker, doc = extractDoc(group.getter)): string {
    const sourceFile = group.getter.getSourceFile()
    const constObject = group.setter ? undefined : returnedConstObjectLiteral(group.getter, checker)
    const getType = constObject ? renderConstObjectType(checker, constObject) : returnTypeText(group.getter, checker, sourceFile)
    const staticPrefix = group.isStatic ? 'static ' : ''

    if (!group.setter) {
        return `${formatDocBlock(doc, INDENT)}${INDENT}${staticPrefix}readonly ${name}: ${getType}`
    }

    const param = group.setter.parameters[0]
    const setType = param ? declaredTypeText(param.type, param, checker, sourceFile) : getType

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

function renderProperty(name: string, group: PropertyGroup, checker: ts.TypeChecker, doc = extractDoc(group.decl)): string {
    const sourceFile = group.decl.getSourceFile()
    const type = declaredTypeText(group.decl.type, group.decl, checker, sourceFile)
    const staticPrefix = group.isStatic ? 'static ' : ''
    const optional = group.decl.questionToken ? '?' : ''
    return `${formatDocBlock(doc, INDENT)}${INDENT}${staticPrefix}${name}${optional}: ${type}`
}

const DEFAULT_TAG = 'default'

/**
 * The text of a doc comment's `@default` tag, whitespace collapsed so a value
 * wrapped across comment lines reads as one. Written as it should show in the
 * docs' Default column: code in backticks (`` `0` ``, `` `'#fff'` ``), anything
 * else plain text — so a value with no literal to give ("the image's width")
 * can still be stated.
 */
function defaultTagText(doc: ExtractedDoc): string | undefined {
    const tag = doc.tags.find((t) => t.tag === DEFAULT_TAG)
    return tag ? tag.doc.replace(/\s+/g, ' ') : undefined
}

/** `doc` with its `@default` (if any) swapped for `value`. */
function withDefault(doc: ExtractedDoc, value: string): ExtractedDoc {
    return { ...doc, tags: [...doc.tags.filter((t) => t.tag !== DEFAULT_TAG), { tag: DEFAULT_TAG, doc: value }] }
}

/**
 * A class body's rendered members, plus the `@default` each one documents —
 * both keyed by {@link memberKey}. Kept side by side so composition (see
 * resolveComposedMembers) layers a default exactly as it layers the member
 * it belongs to.
 */
export interface MemberSet {
    members: Map<string, string>
    defaults: Map<string, string>
    /**
     * Renders a property again with a different `@default`, for a class that
     * inherits it and documents its own (Sprite's `width`). Methods have none —
     * there's no default to give one.
     */
    withDefault: Map<string, (value: string) => string>
}

/**
 * Lays `layer` over `target`, later layers winning. A member the layer
 * redeclares takes the layer's default along with it — or loses the one it
 * inherited, if the redeclaration has none: an override is free to start
 * from a different value (Circle's own `alpha`), and reporting the base's
 * would be a guess.
 */
function layerMembers(target: MemberSet, layer: MemberSet) {
    for (const [key, line] of layer.members) {
        target.members.set(key, line)
        const value = layer.defaults.get(key)
        if (value !== undefined) target.defaults.set(key, value)
        else target.defaults.delete(key)
        const rerender = layer.withDefault.get(key)
        if (rerender) target.withDefault.set(key, rerender)
        else target.withDefault.delete(key)
    }
}

/** Renders a class body's own (non-`_`-prefixed) members as an ordered map of {@link memberKey} -> line(s), with their defaults. */
function extractOwnMembers(classNode: ts.ClassDeclaration | ts.ClassExpression, checker: ts.TypeChecker): MemberSet {
    const members = new Map<string, string>()
    const defaults = new Map<string, string>()
    const rerenders = new Map<string, (value: string) => string>()
    const groups = groupMembers(classNode.members)

    for (const [key, group] of groups) {
        const name = group.isStatic ? key.slice(STATIC_KEY_PREFIX.length) : key
        if (group.kind === 'accessor') members.set(key, renderAccessor(name, group, checker))
        else if (group.kind === 'method') members.set(key, renderMethod(name, group, checker))
        else members.set(key, renderProperty(name, group, checker))

        if (group.kind === 'method') continue
        const doc = extractDoc(group.kind === 'accessor' ? group.getter : group.decl)
        const value = defaultTagText(doc)
        if (value !== undefined) defaults.set(key, value)
        rerenders.set(key, group.kind === 'accessor'
            ? (v) => renderAccessor(name, group, checker, withDefault(doc, v))
            : (v) => renderProperty(name, group, checker, withDefault(doc, v)))
    }
    return { members, defaults, withDefault: rerenders }
}

/**
 * Splits a class's `@default <property> <value>` tags off its doc comment.
 * They name a default the class gives a member it inherits rather than
 * declares — Sprite's `width` comes from its image, not Sizable's `0` — so
 * they belong on that member (and its props field) rather than in anything
 * said when hovering the class itself, and are left out of the doc that's
 * rendered for it. See extractConcreteClass.
 */
function splitClassDefaults(doc: ExtractedDoc, className: string): { doc: ExtractedDoc; overrides: Map<string, string> } {
    const overrides = new Map<string, string>()
    for (const tag of doc.tags) {
        if (tag.tag !== DEFAULT_TAG) continue
        const match = tag.doc.match(/^(\S+)\s+(\S[\s\S]*)$/)
        if (!match) throw new Error(`${className}: class-level "@default ${tag.doc}" needs a property name and then its value.`)
        overrides.set(match[1]!, match[2]!.replace(/\s+/g, ' '))
    }
    return { doc: { ...doc, tags: doc.tags.filter((t) => t.tag !== DEFAULT_TAG) }, overrides }
}

/** A {@link MemberSet}'s defaults as plain data, static members left out — a docs row names an instance property. */
function instanceDefaults(defaults: Map<string, string>): Record<string, string> {
    return Object.fromEntries([...defaults].filter(([key]) => !key.startsWith(STATIC_KEY_PREFIX)))
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
function extractObjectLiteralMembers(checker: ts.TypeChecker, node: ts.ObjectLiteralExpression, readonlyValues = false): Map<string, string> {
    const result = new Map<string, string>()
    const sourceFile = node.getSourceFile()

    for (const prop of node.properties) {
        const name = prop.name?.getText(sourceFile)
        if (!name || isExcluded(name)) continue

        if (ts.isMethodDeclaration(prop)) {
            result.set(name, renderMethod(name, { kind: 'method', signatures: [prop], isStatic: false }, checker))
            continue
        }

        // get/set pairs (Background.image) render the same way a class accessor does.
        // The setter is picked up alongside its getter; a lone setter is skipped, as in groupMembers.
        if (ts.isGetAccessor(prop)) {
            const setter = node.properties.find(
                (p): p is ts.SetAccessorDeclaration => ts.isSetAccessor(p) && p.name.getText(sourceFile) === name
            )
            result.set(name, renderAccessor(name, { kind: 'accessor', getter: prop, setter, isStatic: false }, checker))
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
        const readonlyPrefix = readonlyValues ? 'readonly ' : ''
        result.set(name, `${formatDocBlock(doc, INDENT)}${INDENT}${readonlyPrefix}${name}: ${type}`)
    }
    return result
}

interface MixinBundle {
    propsFields: string[]
    propsTypeDef: string
    api: string
    apiLines: string[]
    /** The mixin's own properties' `@default` text, by property name. */
    defaults: Record<string, string>
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

    const { members, defaults } = extractOwnMembers(classExpr, checker)
    const apiLines = [...members.values()]

    return { propsFields, propsTypeDef, api: apiLines.join('\n\n'), apiLines, defaults: instanceDefaults(defaults) }
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
    mixinCache: Map<string, MemberSet>
): MemberSet {
    const result: MemberSet = { members: new Map(), defaults: new Map(), withDefault: new Map() }
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
                members = classExpr ? extractOwnMembers(classExpr, checker) : { members: new Map(), defaults: new Map(), withDefault: new Map() }
                mixinCache.set(mixinName, members)
            }
            layerMembers(result, members)
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
            const parentComposed = resolveComposedMembers(program, checker, parentSource, decl, mixinCache)
            layerMembers(result, parentComposed)
        }
    }

    // Finally, layer the class's own directly-declared members on top.
    layerMembers(result, extractOwnMembers(classNode, checker))

    return result
}

interface ConcreteClassBundle {
    /** The class's (or object literal's) own JSDoc as a formatted, unindented block — empty if it has none. */
    doc: string
    propsFields: string[]
    members: string[]
    /** Every property's `@default` text, inherited ones included, by property name. */
    defaults: Record<string, string>
    /**
     * Inherited props fields the class re-declares in `propsFields` with its
     * own class-level `@default`, to be left out of its props base
     * (`Omit<GameObjectProps, 'width' | 'height'> & {...}`) so the editor shows
     * only the class's default. Only for a class with a `*Props` type.
     */
    propsOmitted?: string[]
}

export function extractConcreteClass(
    program: ts.Program,
    checker: ts.TypeChecker,
    // A CONCRETE_CLASSES or TYPE_ONLY_CLASSES entry, the latter just never has a typeName
    concrete: { file: string; className: string; typeName?: string },
    mixinCache: Map<string, MemberSet>
): ConcreteClassBundle {
    const sourceFile = getSourceFile(program, concrete.file)
    const { className } = concrete

    const typeAlias = concrete.typeName ? findTypeAlias(sourceFile, concrete.typeName) : undefined
    const propsFields = typeAlias ? extractPropsFields(typeAlias) : []

    const classDecl = findExportedClass(sourceFile, className)
    if (!classDecl) throw new Error(`Could not find exported class ${className} in ${concrete.file}`)

    const composed = resolveComposedMembers(program, checker, sourceFile, classDecl, mixinCache)

    const { doc, overrides } = splitClassDefaults(extractDoc(classDecl), className)
    const ownKeys = new Set(groupMembers(classDecl.members).keys())
    // The props type's full field set, inherited fields included, to find each
    // overridden member's inherited props field by.
    const propsType = typeAlias ? checker.getTypeAtLocation(typeAlias.name) : undefined
    const overriddenPropsFields: string[] = []
    const propsOmitted: string[] = []
    for (const [name, value] of overrides) {
        if (!composed.members.has(name)) {
            throw new Error(`${className}: class-level @default names "${name}", but ${className} has no member by that name. Check the spelling.`)
        }
        if (ownKeys.has(name)) {
            throw new Error(`${className}: class-level @default names "${name}", which ${className} declares itself. Put the @default on that declaration instead.`)
        }
        const rerender = composed.withDefault.get(name)
        if (!rerender) throw new Error(`${className}: class-level @default names "${name}", which is a method — only properties have defaults.`)
        composed.defaults.set(name, value)
        composed.members.set(name, rerender(value))

        const field = propsType?.getProperty(name)?.declarations?.find(ts.isPropertySignature)
        if (field?.type) {
            overriddenPropsFields.push(renderPropsField(field, field.type, withDefault(extractDoc(field), value)))
            propsOmitted.push(name)
        }
    }

    return {
        doc: formatDocBlock(doc, ''),
        propsFields: [...overriddenPropsFields, ...propsFields],
        members: [...composed.members.values()],
        defaults: instanceDefaults(composed.defaults),
        ...(concrete.typeName ? { propsOmitted } : {}),
    }
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

    // The JSDoc sits on the `const X = ...` statement, not the literal itself —
    // walk up past any `as const`/parentheses to the variable declaration,
    // which extractDoc resolves to its statement's leading comment.
    let node: ts.Node = literal
    while (node.parent && !ts.isVariableDeclaration(node)) node = node.parent
    const doc = ts.isVariableDeclaration(node) ? formatDocBlock(extractDoc(node), '') : ''

    return { doc, propsFields: [], members: [...members.values()], defaults: {} }
}

export interface TypeAliasBundle {
    /** Already-formatted JSDoc block (possibly empty), unindented. */
    doc: string
    /** The alias's real type, fully expanded — e.g. `"center" | "fill" | ...`, not `typeof Styles[keyof typeof Styles]`. */
    type: string
}

/**
 * Extracts one TYPE_ALIASES entry. An object-shaped alias (BackgroundProps)
 * renders through extractPropsFields, exactly like a mixin's own `*Props`
 * type: the checker path below would flatten away every field's JSDoc (it
 * only ever prints structure) and expand `style: BackgroundStyle` back into
 * its raw string union, losing the reference to the alias the lib already
 * declares alongside it.
 *
 * Anything else goes to the checker, where InTypeAlias makes it print the
 * alias's structure rather than just its own name back (which is all a plain
 * typeToString gives for a named alias). Intersections deliberately stay on
 * that path too — extractPropsFields returns only an intersection's *last*
 * member's fields (the rest being inherited from the bases a caller splices
 * in itself), so rendering one that way here would silently drop its bases.
 */
export function extractTypeAlias(
    program: ts.Program,
    checker: ts.TypeChecker,
    entry: (typeof TYPE_ALIASES)[number]
): TypeAliasBundle {
    const sourceFile = getSourceFile(program, entry.file)
    const alias = findTypeAlias(sourceFile, entry.name)
    if (!alias) throw new Error(`Could not find type ${entry.name} in ${entry.file}`)

    const type = ts.isTypeLiteralNode(alias.type)
        ? `{\n${extractPropsFields(alias).join('\n\n')}\n}`
        : checker.typeToString(
            checker.getTypeFromTypeNode(alias.type),
            alias,
            ts.TypeFormatFlags.InTypeAlias | ts.TypeFormatFlags.NoTruncation
        )
    return { doc: formatDocBlock(extractDoc(alias), ''), type }
}

/** Extracts one ENUMS entry as a complete, standalone `declare enum Name {...}` statement, its members copied verbatim. */
export function extractEnum(program: ts.Program, entry: (typeof ENUMS)[number]): string {
    const sourceFile = getSourceFile(program, entry.file)
    const declaration = sourceFile.statements.find(
        (s): s is ts.EnumDeclaration => ts.isEnumDeclaration(s) && s.name.text === entry.name
    )
    if (!declaration) throw new Error(`Could not find enum ${entry.name} in ${entry.file}`)

    const members = declaration.members.map((member) => `${formatDocBlock(extractDoc(member), INDENT)}${INDENT}${member.getText(sourceFile)},`)
    return `${formatDocBlock(extractDoc(declaration), '')}declare enum ${entry.name} {\n${members.join('\n')}\n}`
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
            const typeParams = sig.typeParameters ? `<${sig.typeParameters.map((t) => t.getText(sourceFile)).join(', ')}>` : ''
            const params = renderParams(sig.parameters, checker, sourceFile)
            const returnType = functionReturnTypeText(checker, sig, sourceFile)
            return `${formatDocBlock(doc, '')}declare function ${entry.name}${typeParams}(${params}): ${returnType}`
        })
        .join('\n\n')
}

/**
 * Colors.ts's `Colors` object as a plain name -> hex table, read off its
 * `as const` type rather than by importing the module — Colors.ts imports
 * Phaser, which can't load under Node.
 */
export function extractColorTable(program: ts.Program, checker: ts.TypeChecker): Record<string, string> {
    const sourceFile = getSourceFile(program, COLORS_FILE)
    let declaration: ts.VariableDeclaration | undefined
    for (const statement of sourceFile.statements) {
        if (!ts.isVariableStatement(statement)) continue
        declaration ??= statement.declarationList.declarations.find((d) => ts.isIdentifier(d.name) && d.name.text === 'Colors')
    }
    if (!declaration) throw new Error(`Could not find "const Colors" in ${COLORS_FILE}`)

    const table: Record<string, string> = {}
    for (const property of checker.getTypeAtLocation(declaration.name).getProperties()) {
        const type = checker.getTypeOfSymbolAtLocation(property, declaration)
        if (!type.isStringLiteral()) throw new Error(`Colors.${property.name} isn't a string literal — is Colors still \`as const\`?`)
        table[property.name] = type.value
    }
    return table
}
