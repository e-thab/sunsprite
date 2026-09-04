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
    { file: apiPath('Sprite.ts'), typeName: 'SpriteProps', className: 'Sprite', constructorParams: undefined },
    { file: apiPath('Rectangle.ts'), typeName: 'RectangleProps', className: 'Rectangle', constructorParams: undefined },
    { file: apiPath('Circle.ts'), typeName: 'CircleProps', className: 'Circle', constructorParams: undefined },
    { file: apiPath('Label.ts'), typeName: 'LabelProps', className: 'Label', constructorParams: undefined },
    { file: apiPath('Line.ts'), typeName: 'LineProps', className: 'Line', constructorParams: undefined },
    { file: apiPath('HLine.ts'), typeName: 'HLineProps', className: 'HLine', constructorParams: undefined },
    { file: apiPath('VLine.ts'), typeName: 'VLineProps', className: 'VLine', constructorParams: undefined },
    // Singleton/value classes below have no `*Props` options-object type, so
    // typeName is left undefined (extractConcreteClass skips the props-type
    // lookup entirely in that case). Two different real shapes hide behind
    // that, distinguished by constructorParams: Camera/Screen/Clock/Mouse
    // are singleton *instances* the real api object exposes directly
    // (`Camera: camera`, etc.) — never constructed by user code, so
    // constructorParams stays undefined and both api.d.ts and apiLib.ts
    // render them as `declare const X: {...}`, no constructor at all.
    // Timer/Vector2 are real classes user code does construct (`new
    // Timer()`, `new Vector2(x, y)`), so constructorParams carries their
    // real (hand-written — constructors aren't extracted) parameter list,
    // and both render as `declare class X { constructor(...); ... }`.
    // Mouse lives in types.ts, not its own file — findDefaultExportClass
    // matches any exported class regardless of file name, and it's the
    // only exported class in that file.
    { file: apiPath('Camera.ts'), typeName: undefined, className: 'Camera', constructorParams: undefined },
    { file: apiPath('Vector2.ts'), typeName: undefined, className: 'Vector2', constructorParams: 'x: number, y: number' },
    { file: apiPath('Timer.ts'), typeName: undefined, className: 'Timer', constructorParams: '' },
    { file: apiPath('Clock.ts'), typeName: undefined, className: 'Clock', constructorParams: undefined },
    { file: apiPath('Screen.ts'), typeName: undefined, className: 'Screen', constructorParams: undefined },
    { file: apiPath('types.ts'), typeName: undefined, className: 'Mouse', constructorParams: undefined },
] as const

export const GAME_OBJECT_FILE = apiPath('GameObject.ts')

/**
 * Plain `const <exportName> = {...}` object literals (not classes) that are
 * part of the real api-object surface — currently just Random. Extracted via
 * extractObjectLiteral into the same propsFields/members shape a concrete
 * class produces, so it shares render.ts's existing output path.
 */
export const OBJECT_LITERALS = [
    { file: apiPath('Random.ts'), exportName: 'Random', className: 'Random' },
] as const

/**
 * Free (non-class, non-object-literal) functions that are part of the real
 * api-object surface, extracted directly by name from the file that declares
 * them — one `declare function name(...): T` statement per entry (or one per
 * overload, for watch's two signatures). Doesn't matter whether the source
 * declaration itself is `export`ed: some of these (e.g. onMouse) are only
 * closure-visible to core.ts's own `api` object, never imported elsewhere,
 * but are just as real a part of the runtime surface.
 */
export const FREE_FUNCTIONS = [
    { file: apiPath('core.ts'), name: 'forever' },
    { file: apiPath('core.ts'), name: 'repeat' },
    { file: apiPath('core.ts'), name: 'repeatUntil' },
    { file: apiPath('core.ts'), name: 'repeatWhile' },
    { file: apiPath('core.ts'), name: 'after' },
    { file: apiPath('core.ts'), name: 'every' },
    { file: apiPath('core.ts'), name: 'when' },
    { file: apiPath('core.ts'), name: 'keyPressed' },
    { file: apiPath('core.ts'), name: 'keyJustPressed' },
    { file: apiPath('core.ts'), name: 'keyJustReleased' },
    { file: apiPath('core.ts'), name: 'onKeyPress' },
    { file: apiPath('core.ts'), name: 'onKeyRelease' },
    { file: apiPath('core.ts'), name: 'onKeyHold' },
    { file: apiPath('core.ts'), name: 'onMouse' },
    { file: apiPath('core.ts'), name: 'setBackgroundColor' },
    { file: apiPath('core.ts'), name: 'play' },
    { file: apiPath('core.ts'), name: 'pause' },
    { file: sandboxPath('watch.ts'), name: 'watch' },
    { file: sandboxPath('watch.ts'), name: 'unwatch' },
    { file: sandboxPath('output.ts'), name: 'print' },
    { file: apiPath('utility.ts'), name: 'deg2rad' },
    { file: apiPath('utility.ts'), name: 'rad2deg' },
    { file: apiPath('utility.ts'), name: 'sin' },
    { file: apiPath('utility.ts'), name: 'cos' },
    { file: apiPath('utility.ts'), name: 'tan' },
    { file: apiPath('utility.ts'), name: 'atan2' },
    { file: apiPath('utility.ts'), name: 'clamp' },
] as const

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
    'Line.pointA': 'Returnable<Vector2Like | number[]>',
    'Line.pointB': 'Returnable<Vector2Like | number[]>',
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
    apiPath('utility.ts'),
    apiPath('Colors.ts'),
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
        // FREE_FUNCTIONS isn't included here — every file it points at
        // (core.ts, utility.ts, sandbox/watch.ts) is already covered above.
        // OBJECT_LITERALS' files aren't otherwise covered (Random.ts used to
        // reach the copy set via SUPPORTING_API_FILES; now it's only reached
        // through extraction, so it has to be added back explicitly here).
        ...OBJECT_LITERALS.map((o) => o.file),
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
