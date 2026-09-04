import { readdirSync } from 'node:fs'
import path from 'node:path'
import { REPO_ROOT } from '../aliases'

export { REPO_ROOT }

const API_DIR = path.join(REPO_ROOT, 'src', 'assets', 'api')
const SANDBOX_DIR = path.join(REPO_ROOT, 'src', 'sandbox')
const DOCS_API_DIR = path.join(REPO_ROOT, 'src', 'assets', 'docs', 'content', 'api')

export function apiPath(...segments: string[]): string {
    return path.join(API_DIR, ...segments)
}

export function sandboxPath(...segments: string[]): string {
    return path.join(SANDBOX_DIR, ...segments)
}

export const MIXINS = [
    { file: apiPath('mixins', 'Positionable.ts'), typeName: 'PositionableProps', functionName: 'Positionable' },
    { file: apiPath('mixins', 'Sizable.ts'), typeName: 'SizableProps', functionName: 'Sizable' },
    { file: apiPath('mixins', 'Rotatable.ts'), typeName: 'RotatableProps', functionName: 'Rotatable' },
    { file: apiPath('mixins', 'Viewable.ts'), typeName: 'ViewableProps', functionName: 'Viewable' },
    { file: apiPath('mixins', 'Interactable.ts'), typeName: 'InteractableProps', functionName: 'Interactable' },
    { file: apiPath('mixins', 'Timeable.ts'), typeName: undefined, functionName: 'Timeable' },
] as const

export const CONCRETE_CLASSES = [
    { file: apiPath('Sprite.ts'), typeName: 'SpriteProps', className: 'Sprite' },
    { file: apiPath('Rectangle.ts'), typeName: 'RectangleProps', className: 'Rectangle' },
    { file: apiPath('Circle.ts'), typeName: 'CircleProps', className: 'Circle' },
    { file: apiPath('Label.ts'), typeName: 'LabelProps', className: 'Label' },
    { file: apiPath('Line.ts'), typeName: 'LineProps', className: 'Line' },
    { file: apiPath('HLine.ts'), typeName: 'HLineProps', className: 'HLine' },
    { file: apiPath('VLine.ts'), typeName: 'VLineProps', className: 'VLine' },
] as const

export const GAME_OBJECT_FILE = apiPath('GameObject.ts')

/**
 * Known, deliberate accommodations that real source's exact types don't carry —
 * kept as an explicit, narrow override table rather than silently reproduced or
 * silently dropped. Currently just one: user scripts typed in Monaco infer array
 * literals like `[1, 2]` as `number[]`, not the precise tuple `[number, number]`
 * that `ArrayPoint` requires — so the *declared* setter type is deliberately
 * widened here to avoid a false-positive editor error, even though the real
 * runtime setter's TS-checked parameter type doesn't need the widening.
 */
export const SET_TYPE_OVERRIDES: Record<string, string> = {
    'Line.pointA': 'Returnable<PointArg | number[]>',
    'Line.pointB': 'Returnable<PointArg | number[]>',
}

/**
 * Files under src/assets/api/ that are part of the real, runnable API surface
 * but aren't already named by MIXINS/CONCRETE_CLASSES/GAME_OBJECT_FILE above —
 * core.ts included, since it's not a clean "engine" layer underneath the API,
 * it's mutually circular with it (Camera/Random/Timer/types/the mixins all
 * import live bindings back from it, and it imports the concrete classes).
 * Deliberately excluded, confirmed safe: moduleRunner.ts/scriptResolution.ts
 * (generic script-compilation engine, version-agnostic), examples.ts/gameAssets.ts
 * (zero imports, host-only), api.d.ts/apiLib.ts (the declaration system itself,
 * not runtime code), and src/assets/api/output.ts (the *host-side* DOM output
 * renderer — a different file from src/sandbox/output.ts below, which is the
 * one core.ts actually imports).
 */
export const SUPPORTING_API_FILES = [
    apiPath('Point.ts'),
    apiPath('utility.ts'),
    apiPath('Colors.ts'),
    apiPath('Timer.ts'),
    apiPath('Clock.ts'),
    apiPath('Camera.ts'),
    apiPath('Random.ts'),
    apiPath('Screen.ts'),
    apiPath('core.ts'),
    apiPath('types.ts'),
    apiPath('mixins', 'index.ts'),
    apiPath('mixins', 'shared.ts'),
]

/**
 * Two files outside src/assets/api/ that core.ts circularly imports live
 * (watch/unwatch/clearWatchCards, and the Output/print machinery) — confirmed
 * in scope with the user despite being diagnostic tooling rather than
 * game-behavior API, since core.ts can't run without them.
 */
export const SANDBOX_RUNTIME_FILES = [sandboxPath('watch.ts'), sandboxPath('output.ts')]

/** The full set of real source files copied into each permanent version snapshot. */
export function runtimeCopySet(): string[] {
    return [
        ...MIXINS.map((m) => m.file),
        ...CONCRETE_CLASSES.map((c) => c.file),
        GAME_OBJECT_FILE,
        ...SUPPORTING_API_FILES,
        ...SANDBOX_RUNTIME_FILES,
    ]
}

function walkVueFiles(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = path.join(dir, entry.name)
        if (entry.isDirectory()) return walkVueFiles(entryPath)
        return entry.isFile() && entry.name.endsWith('.vue') ? [entryPath] : []
    })
}

/**
 * Every doc page under content/api/ — the API-surface-specific reference
 * material, the only part of the docs that gets frozen per version (see
 * docs/plans/api-versioning.md). content/concepts/, content/tutorials/, and
 * content/ui/ stay live/evergreen, shared across every version, so they're
 * deliberately not walked here.
 *
 * A dynamic directory walk, not a hand-enumerated list like MIXINS/
 * CONCRETE_CLASSES above: doc pages are numerous and open-ended, and
 * docsContent.ts itself already treats content/** as glob-discovered with
 * "no manifest to keep in sync" — this shouldn't be the one place that
 * breaks that property.
 */
export function docsCopySet(): string[] {
    return walkVueFiles(DOCS_API_DIR)
}
