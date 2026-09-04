import ts from 'typescript'

export interface ParamDoc {
    name: string
    doc: string
}

export interface ExtractedDoc {
    summary: string
    params: ParamDoc[]
}

/** Pulls the summary comment and any @param tags off a node's leading JSDoc. */
export function extractDoc(node: ts.Node): ExtractedDoc {
    const jsDocs = ts.getJSDocCommentsAndTags(node).filter(ts.isJSDoc)
    const doc = jsDocs[0]
    const summary = doc ? (ts.getTextOfJSDocComment(doc.comment) ?? '').trim() : ''

    const params: ParamDoc[] = []
    if (doc?.tags) {
        for (const tag of doc.tags) {
            if (ts.isJSDocParameterTag(tag)) {
                params.push({
                    name: tag.name.getText(),
                    doc: (ts.getTextOfJSDocComment(tag.comment) ?? '').trim(),
                })
            }
        }
    }
    return { summary, params }
}

/** Formats a doc comment block: single-line when there's just a summary, multi-line with @param tags otherwise. */
export function formatDocBlock(doc: ExtractedDoc, indent: string): string {
    if (!doc.summary && doc.params.length === 0) return ''
    if (doc.params.length === 0) return `${indent}/** ${doc.summary} */\n`

    const lines = [`${indent}/**`]
    if (doc.summary) lines.push(`${indent} * ${doc.summary}`)
    for (const p of doc.params) {
        lines.push(`${indent} * @param ${p.name} ${p.doc}`)
    }
    lines.push(`${indent} */`)
    return lines.join('\n') + '\n'
}

/** Internal wiring is excluded from the generated declarations by a single, already-established convention. */
export function isExcluded(name: string): boolean {
    return name.startsWith('_')
}

/** Finds a top-level exported (or local) type alias by name in a source file. */
export function findTypeAlias(sourceFile: ts.SourceFile, name: string): ts.TypeAliasDeclaration | undefined {
    for (const statement of sourceFile.statements) {
        if (ts.isTypeAliasDeclaration(statement) && statement.name.text === name) return statement
    }
    return undefined
}

/** Finds `export function Name<...>(base) { return class Name extends base {...} }` and returns the inner class expression. */
export function findMixinClassExpression(sourceFile: ts.SourceFile, functionName: string): ts.ClassExpression | undefined {
    for (const statement of sourceFile.statements) {
        if (!ts.isFunctionDeclaration(statement) || statement.name?.text !== functionName) continue
        const body = statement.body
        if (!body) continue

        for (const inner of body.statements) {
            if (ts.isReturnStatement(inner) && inner.expression && ts.isClassExpression(inner.expression)) {
                return inner.expression
            }
        }
    }
    return undefined
}

/** Finds `export default class Name extends ... {...}`. */
export function findDefaultExportClass(sourceFile: ts.SourceFile): ts.ClassDeclaration | undefined {
    for (const statement of sourceFile.statements) {
        if (!ts.isClassDeclaration(statement)) continue
        const isDefault = statement.modifiers?.some(
            (m) => m.kind === ts.SyntaxKind.ExportKeyword || m.kind === ts.SyntaxKind.DefaultKeyword
        )
        if (isDefault) return statement
    }
    return undefined
}

/**
 * All top-level `function name(...)` declarations matching `name`, in source
 * order — a real signature (no body) is an overload; a real implementation
 * has one. Doesn't care whether `name` is `export`ed: some of core.ts's own
 * free functions (e.g. `onMouse`) are only closure-visible to its `api`
 * object, not exported, but are just as real a part of the runtime surface.
 */
export function findFunctionDeclarations(sourceFile: ts.SourceFile, name: string): ts.FunctionDeclaration[] {
    return sourceFile.statements.filter(
        (s): s is ts.FunctionDeclaration => ts.isFunctionDeclaration(s) && s.name?.text === name
    )
}

/** Finds a top-level `const name = {...}` (or `let`/`var`) object literal by name. */
export function findObjectLiteralConst(sourceFile: ts.SourceFile, name: string): ts.ObjectLiteralExpression | undefined {
    for (const statement of sourceFile.statements) {
        if (!ts.isVariableStatement(statement)) continue
        for (const decl of statement.declarationList.declarations) {
            if (
                ts.isIdentifier(decl.name) &&
                decl.name.text === name &&
                decl.initializer &&
                ts.isObjectLiteralExpression(decl.initializer)
            ) {
                return decl.initializer
            }
        }
    }
    return undefined
}
