import * as ts from 'typescript'
import { resolveSpecifierToName } from '@api/scriptResolution'
import type { OutputLocation } from '@/sandbox/protocol'

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

// V8 defaults Error.stackTraceLimit to 10 — enough to capture *where* an
// error was thrown, but not necessarily far enough to reach the frame that
// matters here. locateError (below) needs to walk down the stack to
// whichever frame belongs to the user's own compiled script; a throw from an
// internal API file (a property setter, Vector2.from, etc.) reached through
// Phaser's own internal dispatch can easily sit more than 10 frames below
// that, silently truncating it off `.stack` before locateError ever sees
// it — not a wrong location, just none at all. A throw written directly in
// the user's own script never hit this, since it's only 1-2 frames deep,
// which is why the difference wasn't obvious until an internal file threw.
// Set once, here, since this module is the first thing the sandbox imports
// (see sandbox/main.ts).
Error.stackTraceLimit = 50

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
 *
 * The trailing `//# sourceURL=` comment gives the compiled Blob module the
 * script's own name in stack traces (`main.js:12:3`) instead of an opaque
 * `blob:...` URL — see locateError below, which depends on it.
 */
function compileScript(source: string, label: string, apiKeys: string[], apiUrl: string): string {
    checkSyntax(source, label)

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

    return parts.join(' ') + '\n' + rewriteImports(source, label) + `\n//# sourceURL=${label}`
}

// A location stashed directly on an Error we threw ourselves — see
// checkSyntax below — takes priority over stack-parsing in locateError,
// since the whole reason it exists is for cases where the stack has none.
interface LocatedError extends Error {
    __sunspriteLocation?: OutputLocation
}

function withLocation<T extends Error>(error: T, location: OutputLocation): T {
    (error as LocatedError).__sunspriteLocation = location
    return error
}

/**
 * Parses `source` with the same TS parser rewriteImports already depends on,
 * *before* any of the rewriting/prelude below, so a syntax error is caught
 * against exactly the line numbers the user's own editor shows — unlike a
 * syntax error from the compiled Blob module's own dynamic import(), which
 * V8 throws with no line/column at all (just "SyntaxError: Unexpected
 * token"), leaving locateError's stack-parsing nothing to recover.
 */
function checkSyntax(source: string, label: string): void {
    const { diagnostics } = ts.transpileModule(source, {
        fileName: label,
        reportDiagnostics: true,
        // Matches the target the editor's own TS worker checks against
        // (CodeEditor.vue) — otherwise perfectly valid modern syntax (e.g.
        // optional chaining) risks a false-positive "not supported" diagnostic
        // from whatever older default transpileModule would otherwise assume.
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
    })

    const diagnostic = diagnostics?.find((d) => d.category === ts.DiagnosticCategory.Error)
    if (diagnostic && diagnostic.start !== undefined && diagnostic.file) {
        const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
        const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')
        throw withLocation(new SyntaxError(message), { script: label, line: line + 1 })
    }

    checkGrammarRestrictions(source, label)
}

// Diagnostic codes TS only raises from a full semantic pass (the binder),
// not from parsing alone — but that are genuine grammar violations regardless
// of context, unlike the vast majority of what a semantic pass flags (e.g.
// "cannot find name 'Sprite'", which is only an error because this isolated
// single-file check has no idea the runtime prelude defines it). Restricted
// to a narrow, deliberately-curated allowlist so running the checker below
// can never fail a script for a reason that wouldn't have failed at runtime —
// each entry here was verified (see moduleRunner test notes) to both (a) be
// a genuine compile-time SyntaxError in real V8 and (b) never fire merely
// because this isolated single-file check can't see the runtime's ambient
// globals. `arguments`/`eval` restrictions are deliberately NOT here: TS only
// flags them via "cannot find name", the exact code every ordinary script
// trips on for Sprite/forever/print/etc., so there's no safe way to tell
// those apart here.
const GRAMMAR_RESTRICTION_CODES = new Set([
    1104,  // "A 'continue' statement can only be used within an enclosing iteration statement."
    1105,  // "A 'break' statement can only be used within an enclosing iteration or switch statement."
    1108,  // "A 'return' statement can only be used within a function body."
    1155,  // "'const' declarations must be initialized."
    1163,  // "A 'yield' expression is only allowed in a generator body."
    2300,  // "Duplicate identifier '...'." (e.g. two parameters with the same name)
    2410,  // "The 'with' statement is not supported."
    2451,  // "Cannot redeclare block-scoped variable '...'."
    2703,  // "The operand of a 'delete' operator must be a property reference."
    17013, // "Meta-property 'new.target' is only allowed in the body of a function..."
    18016, // "Private identifiers are not allowed outside class bodies."
])

/**
 * Catches constructs TS's own parser accepts but the actual runtime's
 * grammar doesn't — e.g. a stray `#name` outside a class, or a `continue`
 * outside a loop, are both valid enough to survive transpileModule's
 * syntax-only pass above, but V8 rejects them at parse time with a
 * SyntaxError that (like all of them) carries no location. Always runs
 * (rather than gating on some cheap substring check first, the way an
 * earlier version of this gated on the source containing '#'): the codes
 * above cover far too broad a set of ordinary-looking syntax for any single
 * cheap pre-filter to be worth the complexity.
 */
function checkGrammarRestrictions(source: string, label: string): void {
    const sourceFile = ts.createSourceFile(label, source, ts.ScriptTarget.ES2020, true, ts.ScriptKind.JS)
    const compilerOptions: ts.CompilerOptions = {
        allowJs: true,
        checkJs: true,
        noLib: true,
        noResolve: true,
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ESNext,
    }
    const host: ts.CompilerHost = {
        getSourceFile: (fileName) => fileName === label ? sourceFile : undefined,
        getDefaultLibFileName: () => 'lib.d.ts',
        writeFile: () => {},
        getCurrentDirectory: () => '',
        getDirectories: () => [],
        fileExists: (fileName) => fileName === label,
        readFile: () => undefined,
        getCanonicalFileName: (fileName) => fileName,
        useCaseSensitiveFileNames: () => true,
        getNewLine: () => '\n',
    }

    const program = ts.createProgram([label], compilerOptions, host)
    const diagnostic = program.getSemanticDiagnostics(sourceFile)
        .find((d) => GRAMMAR_RESTRICTION_CODES.has(d.code))
    if (!diagnostic || diagnostic.start === undefined || !diagnostic.file) return

    const { line } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')
    throw withLocation(new SyntaxError(message), { script: label, line: line + 1 })
}

// Matches a Chrome/V8-style stack frame line, e.g. `    at foo (main.js:12:3)`
// or `    at main.js:12:3`. Frames from real page/bundle code report a full
// URL (`http://...`) or an un-sourceURL'd blob (`blob:...`); only frames
// inside a compiled user script report a bare name, because that's exactly
// what the `//# sourceURL=` comment above gives them.
const STACK_FRAME_RE = /at\s+(?:.*?\s+\()?([^\s():]+):(\d+):(\d+)\)?\s*$/

/**
 * Best-effort recovery of "which script, which line" from a thrown error's
 * stack trace, for surfacing in the output panel. Returns undefined rather
 * than guessing wrong — e.g. for a stack format this doesn't recognize, or an
 * error with no useful stack at all (some resolution failures are just
 * `throw new Error(...)` from this module itself).
 */
export function locateError(error: unknown): OutputLocation | undefined {
    if (!(error instanceof Error)) return undefined

    const attached = (error as LocatedError).__sunspriteLocation
    if (attached) return attached

    if (!error.stack) return undefined

    for (const rawLine of error.stack.split('\n')) {
        const match = rawLine.match(STACK_FRAME_RE)
        if (!match) continue

        const [, file, lineStr] = match
        if (!file || !lineStr) continue
        if (file.includes('://') || file.startsWith('blob:')) continue

        // -1 undoes the single prelude line every compiled script is given above.
        return { script: file, line: Math.max(1, Number(lineStr) - 1) }
    }
    return undefined
}

/**
 * Same recovery as locateError, for internal API code (Vector2.from, a
 * property setter, etc.) that wants to point at whichever user script line
 * called into it *without* throwing — e.g. a warning that still returns a
 * usable value and shouldn't unwind the call like an actual throw would.
 * Captures a fresh Error purely for its stack trace; the message is never
 * shown, only its call site matters.
 */
export function currentLocation(): OutputLocation | undefined {
    return locateError(new Error())
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

export async function runEntryModule(entryCode: string, api: Record<string, unknown>, entryName: string): Promise<void> {
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
        await runAsModule(compileScript(entryCode, entryName, apiKeys, apiUrl))
    } finally {
        URL.revokeObjectURL(apiUrl)
    }
}
