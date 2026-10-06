import ts from 'typescript'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { isAliasSpecifier, REPO_ROOT, TS_PATHS, unrewrittenAliasSpecifiers } from '../aliases'

export const SRC_ROOT = path.join(REPO_ROOT, 'src')

/** tsconfig.app.json's own `paths`, so resolution here matches what vue-tsc and Vite actually do. */
export const RESOLUTION_OPTIONS: ts.CompilerOptions = {
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    baseUrl: REPO_ROOT,
    paths: TS_PATHS,
    target: ts.ScriptTarget.ES2020,
    // Both real tsconfigs (tsconfig.app.json, tsconfig.node.json) pin `types`
    // explicitly for the same reason: leaving it unset makes TypeScript
    // auto-include *every* package under node_modules/@types as an implicit
    // type library, and some installed ones (companion-only packages like
    // @types/earcut or @types/estree — pulled in as someone else's
    // dependency, never meant to be a standalone entry point) fail that with
    // TS2688.
    //
    // `['node']` rather than `[]`: moduleRunner.ts — outside the copy set,
    // but still pulled into this program transitively (core.ts imports it
    // live, see rewriteFile above) — reads/writes Error.stackTraceLimit, a
    // V8 extension only @types/node's global.d.ts declares. tsconfig.app.json
    // itself never lists "node" either, yet the live app build accepts that
    // line anyway: @types/node rides in there by accident, via `vite`'s own
    // .d.ts (pulled in transitively by an unrelated dependency's types), not
    // because the app deliberately opted in. This program has no such
    // accidental path — nothing else here imports 'vite' — so it has to ask
    // for `node` outright to see what the live build already, if
    // incidentally, sees.
    types: ['node'],
}

// ts.resolveModuleName always returns forward-slash paths regardless of
// platform; path.join/resolve return backslash paths on Windows. Normalizing
// both sides before set-membership checks avoids every resolved path silently
// missing the copy set on Windows even when it's genuinely a member.
export function normalizeSlashes(p: string): string {
    return p.replace(/\\/g, '/')
}

/** Exported for vueCopy.ts, which needs the same resolution against the same alias config. */
export function resolveSpecifier(specifier: string, containingFile: string): string | undefined {
    const result = ts.resolveModuleName(specifier, containingFile, RESOLUTION_OPTIONS, ts.sys)
    const resolved = result.resolvedModule?.resolvedFileName
    return resolved ? normalizeSlashes(resolved) : undefined
}

/** Where a real source file's copy lives under a version's own src/ mirror. */
export function mirroredPath(outDir: string, realFile: string): string {
    return path.join(outDir, path.relative(SRC_ROOT, realFile))
}

export function toSpecifier(fromFile: string, toFile: string): string {
    let rel = path.relative(path.dirname(fromFile), toFile).replace(/\\/g, '/').replace(/\.tsx?$/, '')
    if (!rel.startsWith('.')) rel = './' + rel
    return rel
}

/**
 * The only real source files outside the copy set that a copied file may still
 * import — src-relative, the same spelling mirroredPath mirrors by. Everything
 * here is deliberate (see sources.ts's own notes on each): moduleRunner is the
 * generic, version-agnostic script-compilation engine, channel is the host
 * transport, and the other two are imported for their types alone.
 *
 * Anything *not* on this list that a copied file reaches for is the bug
 * verifyCopySetClosed exists to catch: the rewriter leaves an import it can't
 * find in the copy set pointing at the live original (see rewriteFile), so a
 * file missing from runtimeCopySet() doesn't fail the snapshot — it silently
 * welds live code into it. Shape.ts was missing exactly this way, which put
 * the *live* mixins (and so a second, never-initialized copy of core.ts's
 * module state) behind every frozen Rectangle and Circle.
 *
 * Adding an entry here is saying "this file is deliberately shared with the
 * live app, and changing it later is allowed to change this frozen version's
 * behavior". That's rarely what you want — the usual fix is adding the file to
 * SUPPORTING_API_FILES instead.
 */
const ALLOWED_EXTERNAL_IMPORTS: ReadonlySet<string> = new Set([
    'assets/api/moduleRunner.ts',
    'assets/theme/themes.ts',
    'sandbox/channel.ts',
    'sandbox/protocol.ts',
])

interface RewriteResult {
    copiedFile: string
    content: string
}

/**
 * Rewrites one file's import/export specifiers: specifiers resolving to
 * another file in the copy set point at that file's mirrored copy; specifiers
 * resolving outside the copy set (e.g. core.ts's `../theme/themes`) point back
 * at the live, unversioned original via a corrected relative path; bare
 * specifiers (`phaser`) are left untouched. Same edit-list-then-splice-in-
 * reverse technique moduleRunner.ts's own rewriteImports already uses.
 */
function rewriteFile(realFile: string, copySet: Set<string>, outDir: string): RewriteResult {
    const text = readFileSync(realFile, 'utf8')
    const sourceFile = ts.createSourceFile(realFile, text, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TS)
    const copiedFile = mirroredPath(outDir, realFile)

    const edits: { start: number; end: number; text: string }[] = []

    for (const statement of sourceFile.statements) {
        const hasSpecifier =
            (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) && statement.moduleSpecifier

        if (!hasSpecifier) continue
        const moduleSpecifier = (statement as ts.ImportDeclaration | ts.ExportDeclaration).moduleSpecifier
        if (!moduleSpecifier || !ts.isStringLiteral(moduleSpecifier)) continue

        const specifier = moduleSpecifier.text
        // Bare specifiers (npm packages) resolve the same regardless of the
        // importing file's location — nothing to rewrite.
        if (!specifier.startsWith('.') && !isAliasSpecifier(specifier)) continue

        const resolved = resolveSpecifier(specifier, realFile)
        if (!resolved) throw new Error(`Could not resolve "${specifier}" from ${realFile}`)

        const target = copySet.has(resolved) ? mirroredPath(outDir, resolved) : resolved
        const newSpecifier = toSpecifier(copiedFile, target)

        if (newSpecifier === specifier) continue
        edits.push({ start: moduleSpecifier.getStart(sourceFile), end: moduleSpecifier.getEnd(), text: JSON.stringify(newSpecifier) })
    }

    let result = text
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
        result = result.slice(0, edit.start) + edit.text + result.slice(edit.end)
    }

    return { copiedFile, content: result }
}

/** Copies and rewrites the given real source files into outDir, mirroring their src/-relative layout. Returns the written file paths. */
export function copyAndRewriteRuntime(realFiles: string[], outDir: string): string[] {
    const copySet = new Set(realFiles.map(normalizeSlashes))
    const written: string[] = []

    for (const realFile of realFiles) {
        const { copiedFile, content } = rewriteFile(realFile, copySet, outDir)
        mkdirSync(path.dirname(copiedFile), { recursive: true })
        writeFileSync(copiedFile, content, 'utf8')
        written.push(copiedFile)
    }

    return written
}

/**
 * Asserts the copy set is closed under its own imports: every relative import
 * in a copied file lands on another copied file, or on one of the few live
 * files ALLOWED_EXTERNAL_IMPORTS names outright.
 *
 * This runs against the rewritten output rather than the real sources, so it
 * catches a rewriter bug (a specifier pointed somewhere wrong) and a copy-set
 * gap (a file nobody listed) with the same pass. Neither is visible to the two
 * checks below: an escaping path is not an alias, and it type-checks perfectly
 * — the live file it reaches is real, valid source. The damage is at runtime,
 * where the frozen snapshot ends up sharing module instances with the live app.
 *
 * Only relative specifiers are examined. A bare one ('phaser') names a package
 * and resolves the same wherever the importing file sits, and an alias
 * specifier is already the subject of its own check. Dynamic `import()` isn't
 * walked — nothing in the copy set uses one — so this is a guard on static
 * imports, not a proof about every possible reference.
 */
function verifyCopySetClosed(copiedFiles: string[]): void {
    const absolute = (p: string) => normalizeSlashes(path.resolve(p))
    const copied = new Set(copiedFiles.map(absolute))

    for (const file of copiedFiles) {
        const sourceFile = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.ES2020, true, ts.ScriptKind.TS)

        for (const statement of sourceFile.statements) {
            if (!ts.isImportDeclaration(statement) && !ts.isExportDeclaration(statement)) continue

            const moduleSpecifier = statement.moduleSpecifier
            if (!moduleSpecifier || !ts.isStringLiteral(moduleSpecifier)) continue

            const specifier = moduleSpecifier.text
            if (!specifier.startsWith('.')) continue

            const resolved = resolveSpecifier(specifier, file)
            if (!resolved) {
                throw new Error(`Runtime snapshot has a dangling import: "${specifier}" in ${file} resolves to nothing.`)
            }
            if (copied.has(absolute(resolved))) continue

            const srcRelative = normalizeSlashes(path.relative(SRC_ROOT, resolved))
            if (ALLOWED_EXTERNAL_IMPORTS.has(srcRelative)) continue

            const { line } = sourceFile.getLineAndCharacterOfPosition(moduleSpecifier.getStart(sourceFile))
            const where = normalizeSlashes(path.relative(REPO_ROOT, file))
            throw new Error(
                `Runtime snapshot is not standalone: ${where}:${line + 1} imports "${specifier}", ` +
                `which resolves to ${normalizeSlashes(path.relative(REPO_ROOT, resolved))} — a live file this snapshot didn't copy.\n` +
                `The rewriter leaves an import it can't find in the copy set pointing at the live original, so this snapshot would ` +
                `run partly on live code (and on a second copy of any module state that code holds).\n` +
                `Fix: add src/${srcRelative} to SUPPORTING_API_FILES in scripts/api-codegen/sources.ts. ` +
                `If sharing it with the live app really is intended, add "${srcRelative}" to ALLOWED_EXTERNAL_IMPORTS instead.`
            )
        }
    }
}

/**
 * Three checks, together covering what actually matters — not "does the whole
 * transitive closure resolve with zero alias support" (files outside the copy
 * set, like moduleRunner.ts, are never touched and are *expected* to keep
 * using the real project's `@/` alias; that's correct, not a bug):
 *
 * 1. Closure: every relative import in a copied file lands inside the snapshot,
 *    or on a live file ALLOWED_EXTERNAL_IMPORTS names on purpose — see
 *    verifyCopySetClosed for why neither check below can see this one's failure.
 * 2. Completeness: no copy-set file still contains an unrewritten alias
 *    specifier (`@/…`, `@api/…`) — proves the rewriter didn't miss one (the exact failure mode
 *    hit during development: a Windows path-separator mismatch silently made
 *    every copy-set-internal reference look external).
 * 3. Correctness: the copy-set files, together with whatever they legitimately
 *    still reference outside it, actually type-check with zero errors, using
 *    this project's real resolution config (skipLibCheck: false, so — unlike
 *    the declaration snapshots — a genuinely broken reference can't hide
 *    behind that leniency).
 *
 * Closure runs first: it's the cheapest, and its failure explains an otherwise
 * baffling clean type-check on a snapshot that breaks at runtime.
 */
export function verifyStandalone(copiedFiles: string[]): void {
    verifyCopySetClosed(copiedFiles)

    for (const file of copiedFiles) {
        const text = readFileSync(file, 'utf8')
        const unrewritten = unrewrittenAliasSpecifiers(text, file)
        if (unrewritten.length > 0) {
            throw new Error(`Runtime snapshot incomplete: ${file} still has an unrewritten alias import ("${unrewritten[0]}").`)
        }
    }

    const program = ts.createProgram(copiedFiles, {
        ...RESOLUTION_OPTIONS,
        module: ts.ModuleKind.ESNext,
        strict: true,
        skipLibCheck: false,
        noEmit: true,
    })

    const diagnostics = ts.getPreEmitDiagnostics(program)
    if (diagnostics.length === 0) return

    const host: ts.FormatDiagnosticsHost = {
        getCurrentDirectory: () => REPO_ROOT,
        getCanonicalFileName: (f) => f,
        getNewLine: () => ts.sys.newLine,
    }
    const formatted = ts.formatDiagnosticsWithColorAndContext(diagnostics, host)
    throw new Error(`Runtime snapshot failed type-check:\n${formatted}`)
}
