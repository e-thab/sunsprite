import ts from 'typescript'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { REPO_ROOT } from './sources'

export const SRC_ROOT = path.join(REPO_ROOT, 'src')

/** Matches tsconfig.app.json's real `@/*` alias, so resolution matches what Vite actually does. */
export const RESOLUTION_OPTIONS: ts.CompilerOptions = {
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    baseUrl: REPO_ROOT,
    paths: { '@/*': ['src/*'] },
    target: ts.ScriptTarget.ES2020,
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
        if (!specifier.startsWith('.') && !specifier.startsWith('@/')) continue

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
 * Two checks, together covering what actually matters — not "does the whole
 * transitive closure resolve with zero alias support" (files outside the copy
 * set, like moduleRunner.ts, are never touched and are *expected* to keep
 * using the real project's `@/` alias; that's correct, not a bug):
 *
 * 1. Completeness: no copy-set file still contains an unrewritten `@/`-style
 *    specifier — proves the rewriter didn't miss one (the exact failure mode
 *    hit during development: a Windows path-separator mismatch silently made
 *    every copy-set-internal reference look external).
 * 2. Correctness: the copy-set files, together with whatever they legitimately
 *    still reference outside it, actually type-check with zero errors, using
 *    this project's real resolution config (skipLibCheck: false, so — unlike
 *    the declaration snapshots — a genuinely broken reference can't hide
 *    behind that leniency).
 */
export function verifyStandalone(copiedFiles: string[]): void {
    for (const file of copiedFiles) {
        const text = readFileSync(file, 'utf8')
        if (/from\s+["']@\//.test(text)) {
            throw new Error(`Runtime snapshot incomplete: ${file} still has an unrewritten "@/" import.`)
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
