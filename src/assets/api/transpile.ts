import * as ts from 'typescript'
import { scriptTypeForFile } from '@/assets/utils/fileTypes'

// Turns a user script into something the browser can actually run.
//
// JavaScript is already runnable and passes straight through — the sandbox has
// always executed user source verbatim, and that stays true. TypeScript can't:
// it has to be transpiled, and transpiling moves lines around (an `enum` on one
// line becomes five; a multi-line signature collapses to one), which would
// quietly break every runtime error location that points back into the editor.
//
// So the transpile hands back a line map alongside the code, and locateError()
// in moduleRunner.ts is the single place that consults it. Only *lines* are
// mapped, never columns — nothing downstream of an OutputLocation has ever used
// a column (see src/sandbox/protocol.ts), so decoding them would be dead work.

export interface CompiledScript {
    /** Runnable JavaScript. The input itself, unchanged, for a .js script. */
    code: string
    /**
     * Output line (1-based) -> source line (1-based), for translating a stack
     * frame back into a line the editor can point at. Absent when the two are
     * already the same, i.e. nothing was transpiled.
     */
    lineMap?: number[]
}

// TS appends this to the emit whenever sourceMap is on. It names a .map file
// that doesn't exist here (the map never leaves this module), so it's stripped
// rather than shipped — a dangling reference only makes devtools complain.
const SOURCE_MAPPING_URL_RE = /\n?\/\/# sourceMappingURL=.*$/

const BASE64_DIGITS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/**
 * Decodes one comma-separated VLQ segment into its raw fields. Only field 2
 * (the source-line delta) is ever read by the caller, but the fields are
 * variable-width and positional, so they all have to be decoded to reach it.
 */
function decodeSegment(segment: string): number[] {
    const fields: number[] = []
    let index = 0

    while (index < segment.length) {
        let result = 0
        let shift = 0
        let continuation = 0

        do {
            const digit = BASE64_DIGITS.indexOf(segment[index++]!)
            // Malformed input: take whatever decoded cleanly rather than
            // throwing. A partial map costs an accurate line on one frame; a
            // throw here would take down the run itself.
            if (digit < 0) return fields
            continuation = digit & 32
            result += (digit & 31) << shift
            shift += 5
        } while (continuation)

        // Field values are zigzag-encoded: low bit is the sign.
        const negative = result & 1
        result >>= 1
        fields.push(negative ? -result : result)
    }

    return fields
}

/**
 * Flattens a source map's `mappings` into output-line -> source-line.
 *
 * The encoding is one `;`-separated group per output line, each holding
 * `,`-separated segments whose fields are *deltas* carried across the whole
 * string — so every segment has to be walked in order even though only the
 * first mapped one on each line is kept.
 */
function buildLineMap(mappings: string): number[] {
    const lineMap: number[] = []
    let sourceLine = 0

    mappings.split(';').forEach((group, outputIndex) => {
        if (!group) return

        for (const segment of group.split(',')) {
            const fields = decodeSegment(segment)
            // Fewer than 4 fields means a column with no source position
            // behind it (generated code TS invented), which maps to nothing.
            if (fields.length < 4) continue

            sourceLine += fields[2]!
            // The first mapped segment is the one that names the line; the
            // rest are columns further along that same output line.
            if (lineMap[outputIndex + 1] === undefined) lineMap[outputIndex + 1] = sourceLine + 1
        }
    })

    return lineMap
}

/**
 * Compiles `source` to runnable JavaScript, given the name it's stored under —
 * the name is what decides the language, exactly as it does everywhere else
 * (see fileTypes.ts). Never throws: a transpile that somehow produces no usable
 * map degrades to no map at all rather than failing the run, and genuine syntax
 * errors are caught earlier and more precisely by moduleRunner's checkSyntax.
 */
export function compileToRunnable(source: string, fileName: string): CompiledScript {
    if (scriptTypeForFile(fileName).id !== 'typescript') return { code: source }

    const { outputText, sourceMapText } = ts.transpileModule(source, {
        fileName,
        compilerOptions: {
            // Matches the target the editor's own TS worker checks against and
            // the one checkSyntax parses with — a mismatch here would mean
            // downleveling syntax the editor said was fine, which is both
            // needless work and more line movement than necessary.
            target: ts.ScriptTarget.ES2020,
            module: ts.ModuleKind.ESNext,
            sourceMap: true,
            // Each script is emitted entirely on its own — there's no program
            // here, and nothing can see the other files in the project. This
            // makes TS reject the constructs that would need that knowledge
            // (`const enum`, re-exported types without `export type`) up front,
            // rather than emitting something subtly wrong.
            isolatedModules: true,
        },
    })

    const code = outputText.replace(SOURCE_MAPPING_URL_RE, '')

    if (!sourceMapText) return { code }
    try {
        const mappings = (JSON.parse(sourceMapText) as { mappings?: string }).mappings
        return mappings ? { code, lineMap: buildLineMap(mappings) } : { code }
    } catch {
        return { code }
    }
}
