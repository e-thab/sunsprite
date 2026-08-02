import * as ts from 'typescript'
import { useFileStore } from '@/stores/fileStore'
import { getExampleCode } from './examples'
import { resolveSpecifierToName } from './scriptResolution'

// Lets project/guest scripts `import`/`export` between each other. Real ESM
// semantics (live bindings, default/named/namespace imports) via a Blob URL
// + dynamic import() per script, rather than a hand-rolled require() shim.
//
// Each script's `import` statements are textually rewritten (via the
// TypeScript parser, not regex) into calls against a runtime loader we
// control — the browser has no notion of "the other script in this
// project", so specifiers can't resolve on their own. `export` statements
// are left untouched; they're valid as-is once loaded as a real module.

const IMPORT_HELPER = '__sunspriteImport'
const API_GLOBAL = '__sunspriteApi'

function resolveScriptContent(name: string): string | undefined {
    const fileStore = useFileStore()
    const local = fileStore.getLocalCode(name)
    if (local !== undefined) return local
    // Guest (local) mode has default example content per file; project
    // scripts are fully user-defined, so a miss there is a real error.
    if (!fileStore.projectId) return getExampleCode(name)
    return undefined
}

// Splices each top-level `import` statement into a single-line
// `const { ... } = await __sunspriteImport('specifier')` call, keeping line
// numbers of everything else in the script stable.
function rewriteImports(source: string, label: string): string {
    const sourceFile = ts.createSourceFile(label, source, ts.ScriptTarget.ES2020, true, ts.ScriptKind.JS)
    const edits: { start: number, end: number, text: string }[] = []

    for (const statement of sourceFile.statements) {
        if (!ts.isImportDeclaration(statement)) continue
        if (!statement.moduleSpecifier || !ts.isStringLiteral(statement.moduleSpecifier)) continue

        const specifier = statement.moduleSpecifier.text
        const clause = statement.importClause
        const start = statement.getStart(sourceFile)
        const end = statement.getEnd()

        if (!clause) {
            // Side-effect only: `import './x.js'`
            edits.push({ start, end, text: `await ${IMPORT_HELPER}(${JSON.stringify(specifier)});` })
            continue
        }

        if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
            // `import * as ns from './x.js'`
            const nsName = clause.namedBindings.name.text
            edits.push({ start, end, text: `const ${nsName} = await ${IMPORT_HELPER}(${JSON.stringify(specifier)});` })
            continue
        }

        const bindings: string[] = []
        if (clause.name) bindings.push(`default: ${clause.name.text}`)
        if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
            for (const element of clause.namedBindings.elements) {
                const imported = element.propertyName ? element.propertyName.text : element.name.text
                bindings.push(imported === element.name.text ? imported : `${imported}: ${element.name.text}`)
            }
        }

        edits.push({ start, end, text: `const { ${bindings.join(', ')} } = await ${IMPORT_HELPER}(${JSON.stringify(specifier)});` })
    }

    let result = source
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
        result = result.slice(0, edit.start) + edit.text + result.slice(edit.end)
    }
    return result
}

// Prepends the game API as ambient bindings so existing scripts that never
// used import/export keep calling `Sprite(...)` etc. completely unchanged.
function compileScript(source: string, label: string, apiKeys: string[]): string {
    const prelude = apiKeys.length ? `const { ${apiKeys.join(', ')} } = globalThis.${API_GLOBAL};\n` : ''
    return prelude + rewriteImports(source, label)
}

function runAsModule(code: string): Promise<any> {
    const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }))
    return import(/* @vite-ignore */ url).finally(() => URL.revokeObjectURL(url))
}

export async function runEntryModule(entryCode: string, api: Record<string, unknown>): Promise<void> {
    (globalThis as any)[API_GLOBAL] = api
    const apiKeys = Object.keys(api)

    // Fresh per run: re-reads current file contents, and a script imported
    // from two different places in the same run only executes once.
    const cache = new Map<string, Promise<any>>()

    function importScript(specifier: string): Promise<any> {
        const name = resolveSpecifierToName(specifier)
        const cached = cache.get(name)
        if (cached) return cached

        const promise = (async () => {
            const content = resolveScriptContent(name)
            if (content === undefined) {
                throw new Error(`Cannot resolve import "${specifier}": no script named "${name}" in this project`)
            }
            return runAsModule(compileScript(content, name, apiKeys))
        })()

        cache.set(name, promise)
        return promise
    }

    ;(globalThis as any)[IMPORT_HELPER] = importScript

    await runAsModule(compileScript(entryCode, 'main.js', apiKeys))
}
