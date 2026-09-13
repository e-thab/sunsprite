import type { GeneratedDeclarations } from './index'

function esc(text: string): string {
    // Escape backtick-string hazards so generated content stays a valid template literal.
    return text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
}

const MIXIN_EXPORT_NAME: Record<string, string> = {
    Positionable: 'positionable',
    Sizable: 'sizable',
    Rotatable: 'rotatable',
    Viewable: 'viewable',
    Interactable: 'interactable',
    Timeable: 'timeable',
    Alignable: 'alignable',
}

/**
 * Renders generated declarations as a plain `.ts` module exporting bare string
 * constants (no `declare global`, no cross-file imports) — safe to import
 * from anywhere, including Vite's `import.meta.glob` in the browser, since
 * nothing in it is real ambient TS syntax until something else (apiLib.ts's
 * buildApiLib) splices it into a `declare global` wrapper.
 *
 * Used both for the "current" file (scripts/generate-api.ts) and, frozen at
 * snapshot time, for each permanent version's own copy (scripts/snapshot-api.ts)
 * — the artifact Monaco actually loads when hot-swapping to a historical
 * version; versions/<version>/api.d.ts is a separate, human-readable form,
 * not meant to be loaded into the editor directly (see docs/plans/api-versioning.md).
 */
export function renderGeneratedModule(generated: GeneratedDeclarations, header: string[]): string {
    const lines: string[] = [...header, '']

    for (const [functionName, bundle] of Object.entries(generated.mixins)) {
        const prefix = MIXIN_EXPORT_NAME[functionName]
        // A missing entry would otherwise interpolate the literal string
        // "undefined" into the export name below — valid JS, so nothing
        // catches it: the mixin's real content silently ships under
        // `undefinedPropsTypeDef`/`undefinedApi`, unimported anywhere, while
        // every consumer that actually needs it (apiLib.ts) looks like it's
        // just missing that mixin entirely. Failing here instead of a few
        // lines later means a new entry in sources.ts's MIXINS with no
        // matching one here breaks generate-api.ts loudly, at the source.
        if (!prefix) throw new Error(`render.ts: no MIXIN_EXPORT_NAME entry for mixin "${functionName}" — add one alongside its MIXINS entry in sources.ts.`)
        if (bundle.propsTypeDef) {
            lines.push(`export const ${prefix}PropsTypeDef = \`${esc(bundle.propsTypeDef)}\``)
        }
        lines.push(`export const ${prefix}Api = \`${esc(bundle.api)}\``, '')
    }

    for (const [className, bundle] of Object.entries(generated.concreteClasses)) {
        const prefix = className.charAt(0).toLowerCase() + className.slice(1)
        lines.push(
            `export const ${prefix}PropsFields = \`${esc(bundle.propsFields.join('\n\n'))}\``,
            `export const ${prefix}Members = \`${esc(bundle.members.join('\n\n'))}\``,
            ''
        )
    }

    // One complete `declare function name(...): T` statement per entry (or
    // per overload set) — unlike the members above, these need no wrapper to
    // splice directly into apiLib's declare-global block.
    for (const [name, declaration] of Object.entries(generated.freeFunctions)) {
        lines.push(`export const ${name}Declaration = \`${esc(declaration)}\``, '')
    }

    return lines.join('\n')
}
