import * as ts from 'typescript'
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
//
// This all runs inside the sandbox iframe (see src/sandbox/), which is where
// the actual isolation lives. Script *content* comes from the host, since only
// it has the file store, so resolution is an async round trip.

const API_GLOBAL = '__sunspriteApi'
const IMPORT_HELPER = '__sunspriteImport'
const BLOCK_HELPER = '__sunspriteBlocked'

/**
 * Names bound to a throwing stub in every user script's scope, so touching the
 * page from game code fails loudly and early instead of half-working.
 *
 * This is an ergonomic guardrail, *not* the security boundary — a script that
 * really wants the globals back can always reach them through a constructor
 * chain (`[].constructor.constructor('return this')()`), and no amount of
 * shadowing inside a realm prevents that. What makes it safe is *where* this
 * code runs: an `<iframe sandbox="allow-scripts">` with an opaque origin, so
 * the `document` a determined script digs out is the sandbox's own blank one,
 * not the editor's. See src/sandbox/hostBridge.ts.
 *
 * `eval` and `arguments` are deliberately absent: binding either is a
 * SyntaxError in a module (which is always strict mode). Language builtins like
 * Function are absent too — shadowing them buys nothing here and breaks
 * legitimate code.
 */
const BLOCKED_GLOBALS = [
    // Realm / frame access
    'globalThis', 'window', 'document', 'parent', 'top', 'self', 'frames', 'opener',
    // Page & navigation
    'location', 'history', 'navigator', 'screen', 'alert', 'confirm', 'prompt', 'open', 'print',
    // Storage
    'localStorage', 'sessionStorage', 'indexedDB', 'caches', 'cookieStore',
    // Network & background execution
    'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'Worker', 'SharedWorker', 'Notification',
    // Messaging
    'postMessage', 'BroadcastChannel',
]

export type ScriptResolver = (name: string) => Promise<string | undefined>

let resolveScriptContent: ScriptResolver = async () => undefined

/**
 * Installs the function used to fetch a script's source by name. In the sandbox
 * this asks the host over postMessage; tests or other embedders can supply
 * anything with the same shape.
 */
export function setScriptResolver(resolver: ScriptResolver) {
    resolveScriptContent = resolver
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

/**
 * Builds the per-run module every user script imports its API from.
 *
 * The API can't be handed to user scripts through `globalThis` any more: the
 * prelude shadows `globalThis` itself, and a `const globalThis` puts the whole
 * module scope in its temporal dead zone — including the prelude's own lookup.
 * Re-exporting through a module we generate sidesteps that (this module has no
 * shadowing of its own), and has the side benefit that the runner's internals
 * are no longer sitting on the global object where user code could swap them
 * out from under the next script to load.
 */
function buildApiModuleSource(apiKeys: string[]): string {
    const lines = [`const api = globalThis.${API_GLOBAL};`]

    for (const key of apiKeys) {
        lines.push(`export const ${key} = api[${JSON.stringify(key)}];`)
    }

    lines.push(`export const ${IMPORT_HELPER} = globalThis.${IMPORT_HELPER};`)
    lines.push(`export const ${BLOCK_HELPER} = globalThis.${BLOCK_HELPER};`)

    return lines.join('\n')
}

/**
 * Prepends the API import and the blocked-global stubs so existing scripts that
 * never used import/export keep calling `Sprite(...)` etc. completely unchanged.
 *
 * Everything goes on a single physical line so error line numbers reported
 * against the compiled module still line up with what the user sees in the
 * editor (offset by exactly the one prelude line, as before).
 */
function compileScript(source: string, label: string, apiKeys: string[], apiUrl: string): string {
    const imported = [...apiKeys, IMPORT_HELPER, BLOCK_HELPER]
    const parts = [`import { ${imported.join(', ')} } from ${JSON.stringify(apiUrl)};`]

    // An API name always wins over a blocked one: `print` is Sunsprite's, not
    // window.print, and the api object is the source of truth for that.
    const shadowed = BLOCKED_GLOBALS.filter((name) => !apiKeys.includes(name))
    if (shadowed.length) {
        const bindings = shadowed
            .map((name) => `${name} = ${BLOCK_HELPER}(${JSON.stringify(name)})`)
            .join(', ')
        parts.push(`const ${bindings};`)
    }

    return parts.join(' ') + '\n' + rewriteImports(source, label)
}

/**
 * Stand-in for a blocked global: any property read, call, or construction
 * throws with a message naming what was touched, rather than failing later as a
 * confusing `undefined is not an object`.
 */
function blockedGlobal(name: string): unknown {
    const fail = (): never => {
        throw new Error(`'${name}' is not available — Sunsprite games run in a sandbox with no access to the page.`)
    }

    return new Proxy(function () {} as object, {
        get(_target, property) {
            // Let engine-internal probes through, so a stub reaching an `await`
            // or a string coercion fails on its own terms instead of throwing a
            // misleading "not available" from inside the runtime.
            if (property === 'then' || typeof property === 'symbol') return undefined
            return fail()
        },
        set: fail,
        has: fail,
        apply: fail,
        construct: fail,
    })
}

function runAsModule(code: string): Promise<any> {
    const url = URL.createObjectURL(new Blob([code], { type: 'text/javascript' }))
    return import(/* @vite-ignore */ url).finally(() => URL.revokeObjectURL(url))
}

export async function runEntryModule(entryCode: string, api: Record<string, unknown>): Promise<void> {
    const apiKeys = Object.keys(api)

    // Held for the whole run: every script compiled below imports this exact
    // URL, and the module map only dedupes them while the entry is alive.
    const apiUrl = URL.createObjectURL(
        new Blob([buildApiModuleSource(apiKeys)], { type: 'text/javascript' })
    )

    // Fresh per run: re-reads current file contents, and a script imported
    // from two different places in the same run only executes once.
    const cache = new Map<string, Promise<any>>()

    function importScript(specifier: string): Promise<any> {
        const name = resolveSpecifierToName(specifier)
        const cached = cache.get(name)
        if (cached) return cached

        const promise = (async () => {
            const content = await resolveScriptContent(name)
            if (content === undefined) {
                throw new Error(`Cannot resolve import "${specifier}": no script named "${name}" in this project`)
            }
            return runAsModule(compileScript(content, name, apiKeys, apiUrl))
        })()

        cache.set(name, promise)
        return promise
    }

    ;(globalThis as any)[API_GLOBAL] = api
    ;(globalThis as any)[IMPORT_HELPER] = importScript
    ;(globalThis as any)[BLOCK_HELPER] = blockedGlobal

    try {
        await runAsModule(compileScript(entryCode, 'main.js', apiKeys, apiUrl))
    } finally {
        URL.revokeObjectURL(apiUrl)
    }
}
