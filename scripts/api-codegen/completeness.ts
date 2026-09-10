import ts from 'typescript'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { apiPath, REPO_ROOT } from './sources'

/**
 * The real runtime API surface exposed to user scripts: core.ts's own
 * `const api = {...}` object literal (passed to runEntryModule), not
 * anything derived from the codegen sources above — this is the ground
 * truth generate-api's output (and apiLib.ts's hand-written sections) are
 * supposed to fully cover. Parsed with a plain syntactic SourceFile, not a
 * type-checked Program — only property names are needed.
 */
function findApiObjectKeys(): string[] {
    const file = apiPath('core.ts')
    const sourceFile = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ES2020, true)

    let apiObject: ts.ObjectLiteralExpression | undefined
    const visit = (node: ts.Node) => {
        if (apiObject) return
        if (
            ts.isVariableDeclaration(node) &&
            ts.isIdentifier(node.name) &&
            node.name.text === 'api' &&
            node.initializer &&
            ts.isObjectLiteralExpression(node.initializer)
        ) {
            apiObject = node.initializer
            return
        }
        ts.forEachChild(node, visit)
    }
    visit(sourceFile)

    if (!apiObject) throw new Error(`completeness check: could not find "const api = {...}" in ${file}`)

    const keys: string[] = []
    for (const prop of apiObject.properties) {
        if (ts.isPropertyAssignment(prop) && (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name))) {
            keys.push(prop.name.text)
        } else if (ts.isShorthandPropertyAssignment(prop)) {
            keys.push(prop.name.text)
        }
        // Spread elements/computed keys aren't used in core.ts's api object today —
        // if one shows up, it's silently skipped here rather than handled, which
        // would just make this check permissive rather than wrong.
    }
    return keys
}

/** Collects VariableStatement/FunctionDeclaration/ClassDeclaration/EnumDeclaration names from a flat list of statements — never recurses into nested blocks (e.g. a namespace), whose members aren't themselves globals. */
function collectDeclaredNames(statements: readonly ts.Statement[], names: Set<string>): void {
    for (const statement of statements) {
        if (ts.isVariableStatement(statement)) {
            for (const decl of statement.declarationList.declarations) {
                if (ts.isIdentifier(decl.name)) names.add(decl.name.text)
            }
        } else if (ts.isFunctionDeclaration(statement) && statement.name) {
            names.add(statement.name.text)
        } else if (ts.isClassDeclaration(statement) && statement.name) {
            names.add(statement.name.text)
        } else if (ts.isEnumDeclaration(statement)) {
            names.add(statement.name.text)
        }
        // `type`/`interface`/`namespace` statements are deliberately ignored —
        // none of them can correspond to a runtime `api` object key.
    }
}

/**
 * Every identifier CodeEditor.vue actually hands to Monaco as an ambient
 * global — apiLib's `declare global {...}` block (see CodeEditor.vue's
 * `addExtraLib(apiLib, libUri)`) plus apiModel's own top-level declarations
 * (`addExtraLib(apiModel, modelUri)` — a separate model, not wrapped in
 * `declare global`, currently just `declare enum Colors {...}`, but not
 * assumed to stay that way).
 */
function findDeclaredGlobalNames(apiLibText: string, apiModelText: string): Set<string> {
    const names = new Set<string>()

    const libSourceFile = ts.createSourceFile('apiLib.d.ts', apiLibText, ts.ScriptTarget.ES2020, true)
    const globalBlock = libSourceFile.statements.find(
        (s): s is ts.ModuleDeclaration => ts.isModuleDeclaration(s) && (s.flags & ts.NodeFlags.GlobalAugmentation) !== 0
    )
    if (!globalBlock || !globalBlock.body || !ts.isModuleBlock(globalBlock.body)) {
        throw new Error('completeness check: could not find a `declare global { ... }` block in apiLib')
    }
    collectDeclaredNames(globalBlock.body.statements, names)

    const modelSourceFile = ts.createSourceFile('apiModel.d.ts', apiModelText, ts.ScriptTarget.ES2020, true)
    collectDeclaredNames(modelSourceFile.statements, names)

    return names
}

/**
 * Fails loudly (throws) if any key in core.ts's real `api` object has no
 * matching declared identifier anywhere in the live apiLib — the guardrail
 * against the exact drift that left Vector2/Camera silently stale for a long
 * time. Must run *after* apiDeclarations.generated.ts has already been
 * (re)written, since apiLib.ts imports from it.
 */
export async function checkApiCompleteness(): Promise<void> {
    const apiKeys = findApiObjectKeys()

    const apiLibUrl = pathToFileURL(path.join(REPO_ROOT, 'src', 'assets', 'api', 'apiLib.ts')).href
    const { apiLib, apiModel } = await import(apiLibUrl)
    const declaredNames = findDeclaredGlobalNames(apiLib, apiModel)

    const missing = apiKeys.filter((key) => !declaredNames.has(key))
    if (missing.length > 0) {
        throw new Error(
            `apiLib.ts is missing a Monaco declaration for: ${missing.join(', ')}\n` +
            `These are real keys in core.ts's "api" object (the actual runtime namespace handed to user scripts) ` +
            `but have no matching "declare const/function/class/enum" anywhere in apiLib.ts's declare-global block. ` +
            `Add one (generated or hand-written) before running generate-api again.`
        )
    }
}
