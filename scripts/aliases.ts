import ts from 'typescript'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** The repo root — one level above scripts/. */
export const REPO_ROOT = path.resolve(__dirname, '..')

const TSCONFIG_APP = path.join(REPO_ROOT, 'tsconfig.app.json')

/**
 * Path mappings that exist only so vue-tsc can find generated .d.ts files —
 * not real source aliases, and deliberately not turned into Vite aliases:
 * @nuxt/ui's own Vite plugin resolves #build/ui itself, and an alias here
 * would preempt it. Nothing under src/ imports these directly.
 */
const TYPE_ONLY_PATTERNS = ['#build/']

export interface Alias {
    /** Import prefix with no trailing `/*`, e.g. `@api`. */
    prefix: string
    /** Absolute directory the prefix maps to. */
    dir: string
}

/**
 * tsconfig.app.json's `paths` block, read verbatim. That file is the single
 * place aliases are declared; Vite's `resolve.alias` and the codegen's module
 * resolution are both derived from it (see ALIASES / viteAliases below) so a
 * new alias only ever has to be written once.
 *
 * A raw read rather than a full ts.parseJsonConfigFileContent: `paths` is
 * declared directly in tsconfig.app.json, never in the @vue/tsconfig base it
 * extends, and parsing the whole config would walk every `include` glob on
 * each Vite config load for nothing.
 */
export const TS_PATHS: Record<string, string[]> = (() => {
    const { config, error } = ts.readConfigFile(TSCONFIG_APP, ts.sys.readFile)
    if (error) {
        throw new Error(`Could not read ${TSCONFIG_APP}: ${ts.flattenDiagnosticMessageText(error.messageText, ' ')}`)
    }
    return config?.compilerOptions?.paths ?? {}
})()

/**
 * The subset of TS_PATHS that names real source directories, resolved to
 * absolute paths.
 *
 * Sorted longest-prefix-first because Vite tries alias entries in order. A
 * bare `@` can't actually swallow `@api/x` (Rollup's matcher requires the
 * prefix to be followed by `/` or end the specifier), but a future `@api` vs
 * `@api/mixins` pair would depend on this ordering.
 */
export const ALIASES: Alias[] = Object.entries(TS_PATHS)
    .filter(([pattern]) => !TYPE_ONLY_PATTERNS.some((p) => pattern.startsWith(p)))
    .map(([pattern, targets]) => {
        const target = targets[0]
        if (!target) throw new Error(`tsconfig.app.json path alias "${pattern}" has no target.`)
        return {
            prefix: pattern.replace(/\/\*$/, ''),
            dir: path.resolve(REPO_ROOT, target.replace(/\/\*$/, '')),
        }
    })
    .sort((a, b) => b.prefix.length - a.prefix.length)

/** True for specifiers that go through one of the project's aliases (`@/x`, `@api/x`). */
export function isAliasSpecifier(specifier: string): boolean {
    return ALIASES.some(({ prefix }) => specifier.startsWith(`${prefix}/`))
}

/** Matches an alias import left in emitted text, e.g. `from "@/x"` — used by the snapshot completeness checks. */
export const ALIAS_IMPORT_RE = new RegExp(
    `from\\s+["'](?:${ALIASES.map(({ prefix }) => prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})/`,
)

/** The same aliases in Vite's `resolve.alias` array shape, which preserves the ordering above. */
export function viteAliases(): { find: string; replacement: string }[] {
    return ALIASES.map(({ prefix, dir }) => ({ find: prefix, replacement: dir }))
}
