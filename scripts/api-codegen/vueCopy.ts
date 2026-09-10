import ts from 'typescript'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { parse, type SFCScriptBlock } from 'vue/compiler-sfc'
import { mirroredPath, normalizeSlashes, resolveSpecifier, RESOLUTION_OPTIONS, toSpecifier } from './runtimeCopy'
import { ALIAS_IMPORT_RE, isAliasSpecifier, REPO_ROOT } from '../aliases'

/**
 * Same idea as runtimeCopy.ts's rewriteFile, adapted for .vue SFCs: a doc
 * page's imports only ever live in its <script>/<script setup> blocks (see
 * e.g. content/api/colors.vue), never its <template>/<style>, so only those
 * blocks are parsed as TS and rewritten — the rest of the file is copied
 * byte-for-byte. Two blocks (a plain <script> for `meta` plus a
 * <script setup> for logic) are both real and both need their own pass.
 */
function rewriteScriptBlock(block: SFCScriptBlock, realFile: string, copySet: Set<string>, outDir: string): string {
    const sourceFile = ts.createSourceFile(realFile, block.content, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TS)
    const copiedFile = mirroredPath(outDir, realFile)

    const edits: { start: number; end: number; text: string }[] = []

    for (const statement of sourceFile.statements) {
        const hasSpecifier =
            (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) && statement.moduleSpecifier

        if (!hasSpecifier) continue
        const moduleSpecifier = (statement as ts.ImportDeclaration | ts.ExportDeclaration).moduleSpecifier
        if (!moduleSpecifier || !ts.isStringLiteral(moduleSpecifier)) continue

        const specifier = moduleSpecifier.text
        if (!specifier.startsWith('.') && !isAliasSpecifier(specifier)) continue

        const resolved = resolveSpecifier(specifier, realFile)
        if (!resolved) throw new Error(`Could not resolve "${specifier}" from ${realFile}`)

        const target = copySet.has(resolved) ? mirroredPath(outDir, resolved) : resolved
        const newSpecifier = toSpecifier(copiedFile, target)

        if (newSpecifier === specifier) continue
        edits.push({ start: moduleSpecifier.getStart(sourceFile), end: moduleSpecifier.getEnd(), text: JSON.stringify(newSpecifier) })
    }

    let result = block.content
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
        result = result.slice(0, edit.start) + edit.text + result.slice(edit.end)
    }

    return result
}

/**
 * Rewrites one .vue file's script block(s) and copies the result. copySet is
 * the union of the runtime copy set and the docs copy set (see sources.ts's
 * docsCopySet) — a doc page importing e.g. `@/assets/api/Colors` for a live
 * example resolves to *this version's own* already-copied Colors.ts, not the
 * live original, the same way a copy-set-internal runtime import already does.
 */
function rewriteVueFile(realFile: string, copySet: Set<string>, outDir: string): { copiedFile: string; content: string } {
    const original = readFileSync(realFile, 'utf8')
    const { descriptor } = parse(original, { filename: realFile })
    const copiedFile = mirroredPath(outDir, realFile)

    // Both blocks, if present, are real (see docsTypes.ts's DocPageMeta doc
    // comment: a plain <script> exports `meta`, <script setup> is optional
    // page logic) — collected together and spliced back in one pass, latest
    // offset first, so rewriting one block's content never shifts the other's
    // still-unprocessed offsets.
    const blocks = [descriptor.script, descriptor.scriptSetup].filter((b): b is SFCScriptBlock => b !== null)
    blocks.sort((a, b) => b.loc.start.offset - a.loc.start.offset)

    let result = original
    for (const block of blocks) {
        const rewritten = rewriteScriptBlock(block, realFile, copySet, outDir)
        result = result.slice(0, block.loc.start.offset) + rewritten + result.slice(block.loc.end.offset)
    }

    return { copiedFile, content: result }
}

/** Copies and rewrites the given .vue files into outDir, mirroring their src/-relative layout. Returns the written file paths. */
export function copyAndRewriteVueFiles(realFiles: string[], copySetFiles: string[], outDir: string): string[] {
    const copySet = new Set(copySetFiles.map(normalizeSlashes))
    const written: string[] = []

    for (const realFile of realFiles) {
        const { copiedFile, content } = rewriteVueFile(realFile, copySet, outDir)
        mkdirSync(path.dirname(copiedFile), { recursive: true })
        writeFileSync(copiedFile, content, 'utf8')
        written.push(copiedFile)
    }

    return written
}

/**
 * Same two-pronged shape as runtimeCopy.ts's verifyStandalone, scoped to just
 * the script blocks: each copied file's script content is extracted again (it
 * was already rewritten, so this re-parses the *output*, not the original)
 * into a real sibling .ts file — simpler and less fragile than a synthetic
 * in-memory CompilerHost, and cheap to clean up afterward — then checked the
 * same way runtimeCopy.ts's runtime files are: (1) no unrewritten alias
 * specifier survived, (2) the extracted blocks type-check against this
 * project's real resolution config. Deliberately not a full vue-tsc SFC check
 * — the point here is catching rewriter bugs (a missed specifier, a Windows
 * path-separator mismatch), not template type-checking, and a real SFC
 * type-checker is a much bigger tool to shell out to mid-script for that
 * narrower goal.
 */
export function verifyVueStandalone(copiedFiles: string[]): void {
    const tempFiles: string[] = []

    try {
        for (const file of copiedFiles) {
            const text = readFileSync(file, 'utf8')
            const { descriptor } = parse(text, { filename: file })
            const blocks = [descriptor.script, descriptor.scriptSetup].filter((b): b is SFCScriptBlock => b !== null)

            for (const [index, block] of blocks.entries()) {
                const unrewritten = block.content.match(ALIAS_IMPORT_RE)
                if (unrewritten) {
                    throw new Error(`Docs snapshot incomplete: ${file} still has an unrewritten alias import (${unrewritten[0].trim()}…).`)
                }
                const tempFile = `${file}.block${index}.check.ts`
                writeFileSync(tempFile, block.content, 'utf8')
                tempFiles.push(tempFile)
            }
        }

        const program = ts.createProgram(tempFiles, {
            ...RESOLUTION_OPTIONS,
            module: ts.ModuleKind.ESNext,
            strict: true,
            skipLibCheck: false,
            noEmit: true,
        })

        const diagnostics = ts.getPreEmitDiagnostics(program)
        if (diagnostics.length === 0) return

        const formatHost: ts.FormatDiagnosticsHost = {
            getCurrentDirectory: () => REPO_ROOT,
            getCanonicalFileName: (f) => f,
            getNewLine: () => ts.sys.newLine,
        }
        throw new Error(`Docs snapshot failed type-check:\n${ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost)}`)
    } finally {
        for (const tempFile of tempFiles) rmSync(tempFile, { force: true })
    }
}
