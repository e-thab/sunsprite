/**
 * The editor's hand-written supporting types: everything the generated
 * declarations refer to that isn't itself extracted from source (Vector2Like,
 * AnchorPoint, LibVars, ShapeProps, ...). Spliced into buildApiLib's
 * `declare global` block (see apiLib.ts) and, frozen at snapshot time, into
 * each versions/<version>/generated.ts — so a snapshot keeps the types it was
 * cut with instead of picking up whatever this file says today.
 *
 * Kept free of imports and runtime code: scripts/snapshot-api.ts (run under
 * tsx, in Node) imports this module directly to freeze it.
 *
 * Written to be valid both inside `declare global` (Monaco) and at the top
 * level of a version's human-readable api.d.ts — hence `declare namespace`
 * and initializer-free consts in LibVars rather than real arrays.
 */
export const libTypesDeclaration = `
type GameObjectProps = PositionableProps & SizableProps & RotatableProps & InteractableProps & ViewableProps & AlignableProps
type ShapeProps = GameObjectProps & FillableProps & OutlinableProps

// TODO: Hide from API?
declare namespace LibVars {
    export const mouseInputEvents: readonly [
        'Click', 'Release', 'DoubleClick',
        'LeftClick', 'LeftRelease',
        'RightClick', 'RightRelease',
        'MiddleClick', 'MiddleRelease',
        'Enter', 'Exit',
        'Drag', 'DragStart', 'DragEnd',
        'Scroll', 'Move',
    ]

    export const mouseHoldEvents: string[]

    export const keyCodes: readonly [
        'Backquote', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Minus', 'Equal', 'Backspace',
        'Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'BracketLeft', 'BracketRight', 'Backslash',
        'CapsLock', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Semicolon', 'Quote', 'Enter',
        'ShiftLeft', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Comma', 'Period', 'Slash', 'ShiftRight',
        'CtrlLeft', 'AltLeft', 'Space', 'AltRight', 'ContextMenu', 'CtrlRight',

        'Insert', 'Home', 'PageUp', 'Delete', 'End', 'PageDown',
        'Up', 'Down', 'Left', 'Right', 'ScrollLock', 'Pause',

        'Numpad0', 'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5', 'Numpad6', 'Numpad7', 'Numpad8', 'Numpad9',
        'NumLock', 'NumpadDivide', 'NumpadMultiply', 'NumpadSubtract', 'NumpadAdd', /*'NumpadEnter',*/ 'NumpadDecimal',

        'Escape', 'Any', 'Shift', 'Ctrl', 'Alt'
    ]
}

/** Point def */
type Point = {
    /** x def */
    x: number,

    /** y def */
    y: number
}

/** ArrayPoint def */
type ArrayPoint = [number, number]

/** PointArg def */
type PointArg = Point | ArrayPoint

/**
 * A Vector2-interpretable value: an { x, y } object, an object with a
 * { position: { x, y } }, or a [x, y] array.
 */
type Vector2Like = { x: number, y: number } | { position: { x: number, y: number } } | [number, number]

/** Anything with a position: an { x, y } object, or an object with a { position: { x, y } }. */
type HasPosition = { x: number, y: number } | { position: { x: number, y: number } }

/**
 * Any of the nine anchor points on an object, in either the canonical
 * all-lowercase spelling ('topleft') or the camelCase spelling of the property
 * naming the same point ('topLeft'). Hand-written copy of Alignable.ts's
 * AnchorPoint — widen both together.
 */
type AnchorPoint =
    | 'topleft'
    | 'topcenter'
    | 'topright'
    | 'centerleft'
    | 'center'
    | 'centerright'
    | 'bottomleft'
    | 'bottomcenter'
    | 'bottomright'
    | 'topLeft'
    | 'topCenter'
    | 'topRight'
    | 'centerLeft'
    | 'centerRight'
    | 'bottomLeft'
    | 'bottomCenter'
    | 'bottomRight'

/** An object with enough geometry to resolve anchor points on. */
type AlignableLike = { x: number, y: number, width: number, height: number }

/**
 * An image: the name of an image file in your project, like 'player.png', or a URL.
 *
 * ImageFile is the project's own image names, declared per project by
 * CodeEditor.vue (see projectAssetsLib) so they complete inside the quotes.
 * The (string & {}) arm keeps any other string legal — a URL, or a name built
 * at runtime like 'card_' + n + '.png' — without TypeScript collapsing the
 * whole union to plain string and losing those completions. Misspelt literal
 * names are flagged separately, by monaco-assets.ts.
 */
type ImageSource = ImageFile | (string & {})

/** A sound: the name of an audio file in your project, like 'jump.mp3', or a URL. See ImageSource. */
type AudioSource = AudioFile | (string & {})

/**
 * A text file: the name of a text file in your project, like 'level1.txt'.
 * TextFile is the project's own text file names; see ImageSource for why the
 * (string & {}) arm is there.
 */
type TextSource = TextFile | (string & {})

type Action = (...args: any[]) => void
type Predicate = (...args: any[]) => boolean

/** Returnable def */
type Returnable<T> = T | (() => T)

/**
 * A running smoothDamp or smoothFollow. \`await\` it to wait until it finishes, or call \`stop()\` to end it early.
 */
interface Smoothing extends Promise<void> {
    /** Stops smoothing, leaving the value where it is, and settles the promise */
    stop(): void
    /** Whether smoothing has finished or been stopped */
    readonly stopped: boolean
}

/** Names of T's properties that hold a number or Vector2, used by smoothDamp and smoothFollow */
type SmoothableKey<T> = { [K in keyof T]: T[K] extends number | Vector2 ? K : never }[keyof T]

type Printable = { toString(): string }

type Optional<T> = T | undefined | null

/** A mouse handler, optionally taking the cursor's x and y coordinates. */
type PointerAction = ((x: number, y: number) => void) | (() => void) | null

/** A scroll handler, optionally taking the horizontal and vertical distance scrolled. */
type ScrollAction = ((x: number, y: number) => void) | (() => void) | null

/** A mouse cursor. Hand-written copy of Interactable.ts's Cursor (CursorType's values are already in the list). */
type Cursor = Optional<{
    src: string,
    type?: 'auto' | 'default' | 'none' | 'context-menu' | 'help' | 'pointer' | 'progress' | 'wait' | 'cell' | 'crosshair' | 'text' | 'vertical-text' | 'copy' | 'move' | 'no-drop' | 'not-allowed' | 'grab' | 'grabbing' | 'all-scroll' | 'col-resize' | 'row-resize' | 'n-resize' | 'e-resize' | 's-resize' | 'w-resize' | 'ne-resize' | 'nw-resize' | 'se-resize' | 'sw-resize' | 'ew-resize' | 'ns-resize'
}>

type MouseInputEvent = typeof LibVars.mouseInputEvents[number]
type MouseInputAction = {
    [key in MouseInputEvent]?: Action | null
}

type MouseHoldEvent = typeof LibVars.mouseHoldEvents[number]
type MouseHoldAction = {
    [key in MouseHoldEvent]?: Action | null
}

type InputKey = typeof LibVars.keyCodes[number]
type KeyAction = {
    [key in InputKey]?: Action | null
}
`
