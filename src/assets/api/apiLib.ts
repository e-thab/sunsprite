// import { camera, screen, timer, mouse, forever, repeat, repeatUntil, after, every, keyPressed, keyJustPressed, print, play, pause, setBackgroundColor } from "./core";
// import { deg2rad, rad2deg, sin, cos, tan, atan2, clamp } from "./utility";
// import { Point, Vector2 } from "./Point";

// import Sprite from "./Sprite"
// import Rectangle from "./Rectangle"
// import Label from "./Label"
// import Line from "./Line"
// import HLine from "./HLine"

// // Note: try dynamic imports

// const api = {
//     Sprite, Rectangle, Label, Line, HLine, Vector2, /*Point,*/
//     timer, screen, camera, mouse,
//     forever, repeat, repeatUntil, after, every,
//     keyPressed, keyJustPressed, print, play, pause, setBackgroundColor,
//     random, deg2rad, rad2deg, sin, cos, tan, atan2, clamp,
//     sqrt: Math.sqrt,
//     min: Math.min,
//     max: Math.max,
//     floor: Math.floor,
//     ceil: Math.ceil,
//     round: Math.round,
//     PI: Math.PI,
// }
// export default api
import {
    positionableApi,
    positionablePropsTypeDef, sizablePropsTypeDef, rotatablePropsTypeDef, viewablePropsTypeDef, interactablePropsTypeDef,
    spritePropsFields, spriteMembers,
    rectanglePropsFields, rectangleMembers,
    circlePropsFields, circleMembers,
    labelPropsFields, labelMembers,
    linePropsFields, lineMembers,
    hLinePropsFields, hLineMembers,
    vLinePropsFields, vLineMembers,
    cameraMembers, vector2Members, timerMembers, clockMembers, screenMembers, mouseMembers,
    randomMembers,
    foreverDeclaration, repeatDeclaration, repeatUntilDeclaration, repeatWhileDeclaration,
    afterDeclaration, everyDeclaration, whenDeclaration,
    keyPressedDeclaration, keyJustPressedDeclaration, keyJustReleasedDeclaration,
    onKeyPressDeclaration, onKeyReleaseDeclaration, onKeyHoldDeclaration, onMouseDeclaration,
    setBackgroundColorDeclaration, pauseDeclaration, playDeclaration, printDeclaration,
    watchDeclaration, unwatchDeclaration,
    deg2radDeclaration, rad2degDeclaration, sinDeclaration, cosDeclaration, tanDeclaration, atan2Declaration, clampDeclaration,
} from "./generated/apiDeclarations.generated"
import Colors from './Colors'

/**
 * The subset of apiLib's content that varies by API version — everything
 * produced by scripts/api-codegen (see src/assets/api/generated/apiDeclarations.generated.ts
 * and each versions/<version>/generated.ts). Utilities/Types-preamble
 * below stay fixed across versions; only these get swapped when hot-loading
 * a historical version into Monaco (see src/assets/api/versions/index.ts).
 */
export interface VersionedApiConstants {
    positionableApi: string
    positionablePropsTypeDef: string
    sizablePropsTypeDef: string
    rotatablePropsTypeDef: string
    viewablePropsTypeDef: string
    interactablePropsTypeDef: string
    spritePropsFields: string
    spriteMembers: string
    rectanglePropsFields: string
    rectangleMembers: string
    circlePropsFields: string
    circleMembers: string
    labelPropsFields: string
    labelMembers: string
    linePropsFields: string
    lineMembers: string
    hLinePropsFields: string
    hLineMembers: string
    vLinePropsFields: string
    vLineMembers: string
    cameraMembers: string
    vector2Members: string
    timerMembers: string
    clockMembers: string
    screenMembers: string
    mouseMembers: string
    randomMembers: string
    foreverDeclaration: string
    repeatDeclaration: string
    repeatUntilDeclaration: string
    repeatWhileDeclaration: string
    afterDeclaration: string
    everyDeclaration: string
    whenDeclaration: string
    keyPressedDeclaration: string
    keyJustPressedDeclaration: string
    keyJustReleasedDeclaration: string
    onKeyPressDeclaration: string
    onKeyReleaseDeclaration: string
    onKeyHoldDeclaration: string
    onMouseDeclaration: string
    setBackgroundColorDeclaration: string
    pauseDeclaration: string
    playDeclaration: string
    printDeclaration: string
    watchDeclaration: string
    unwatchDeclaration: string
    deg2radDeclaration: string
    rad2degDeclaration: string
    sinDeclaration: string
    cosDeclaration: string
    tanDeclaration: string
    atan2Declaration: string
    clampDeclaration: string
}

// TODO: Maybe each lib 'module' (Random, Colors, etc.) should be its own model
// so that peeking definitions doesn't look so crowded?

// TODO: Fix all this vvv, model and lib should probably just stay the same for now

/** 
 * Added to the editor as a model, allows viewing definitions and better ts
 * support, but can't have direct const declarations. User-facing.
 */
export const apiModel = `
declare enum Colors ${
    // Enums are stringified as if they're regular objects, so this needs conversion
    JSON.stringify(Colors, null, 2) // Convert to pretty string with newlines & tabs
    .replace(/"([^"]+)":/g, '$1 =') // Unquote keys and replace colons with =
}
`

/**
 * Added to the editor as a library, definitions are not added to the model
 * but general type information is still displayed. Internal.
 *
 * Wrapped in `declare global` because this lib has no import/export of its
 * own: under the editor's `moduleDetection: "force"` setting (which makes
 * project scripts require explicit imports from each other), a script-like
 * file with no top-level import/export would otherwise be scoped to itself
 * instead of staying globally ambient to every script.
 */
export function buildApiLib(v: VersionedApiConstants): string {
    return 'declare global {\n' + [
// Types
// `
// declare enum Colors ${
//     // Colors is just an object, but works better as an enum here so it needs conversion
//     JSON.stringify(Colors, null, 2) // Convert to pretty string with newlines & tabs
//     .replace(/"([^"]+)":/g, '$1 =') // Unquote keys and replace colons with =
// }`,

// PointArgs include union w/ number[] in setter params because
// JS array literals are inferred as <T>[], not [<T>, <T>, ...]
`
${v.positionablePropsTypeDef}
${v.sizablePropsTypeDef}
${v.rotatablePropsTypeDef}
${v.viewablePropsTypeDef}
${v.interactablePropsTypeDef}
type GameObjectProps = PositionableProps & SizableProps & RotatableProps & InteractableProps & ViewableProps
`,

// Types (hand-written — not derived from source, see mixin/class-derived block above)
`
// TODO: Hide from API?
namespace LibVars {
    export const mouseInputEvents = [
        'Click', 'Release', 'DoubleClick',
        'LeftClick', 'LeftRelease',
        'RightClick', 'RightRelease',
        'MiddleClick', 'MiddleRelease',
        'Enter', 'Exit',
        'Drag', 'DragStart', 'DragEnd',
        'Scroll', 'Move',
    ] as const

    export const mouseHoldEvents = [
        'Left', 'Right', 'Middle', 'Any'
    ]

    export const keyCodes = [
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
    ] as const
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

/** A Vector2-interpretable value: either an { x, y } object or a [x, y] array. */
type Vector2Like = { x: number, y: number } | [number, number]

type Action = (...args: any[]) => void
type Predicate = (...args: any[]) => boolean

/** Returnable def */
type Returnable<T> = T | (() => T)

type Printable = { toString(): string }

type Optional<T> = T | undefined | null

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
`,

// Core
`
/**
 * User mouse reference.
 */
declare const Mouse: {
${v.mouseMembers}
}

/**
 * Game screen reference.
 */
declare const Screen: {
${v.screenMembers}
}

class Timer {
    constructor()

${v.timerMembers}
}

/**
 * Game clock, derived largely from Timer but with some key differences.
 */
declare const Clock: {
${v.clockMembers}
}

/**
 * User camera reference.
 */
declare const Camera: {
${v.cameraMembers}
}

class Vector2 {
    constructor(x: number, y: number)

${v.vector2Members}
}

/**
 * An array of all keys currently pressed.
 */
declare const keysPressed: string[]

/**
 * Keys that were just pressed this frame, mapped to the frame they were pressed on.
 */
declare const keysJustPressed: Map<string, number | undefined>

/**
 * Keys that were just released this frame, mapped to the frame they were released on.
 */
declare const keysJustReleased: Map<string, number | undefined>

${v.setBackgroundColorDeclaration}

${v.foreverDeclaration}

${v.repeatDeclaration}

${v.repeatUntilDeclaration}

${v.repeatWhileDeclaration}

${v.afterDeclaration}

${v.everyDeclaration}

${v.whenDeclaration}

${v.keyPressedDeclaration}

${v.keyJustPressedDeclaration}

${v.keyJustReleasedDeclaration}

${v.onKeyPressDeclaration}

${v.onKeyReleaseDeclaration}

${v.onKeyHoldDeclaration}

${v.onMouseDeclaration}

${v.pauseDeclaration}

${v.playDeclaration}

/**
 * The browser's dev tools console. Not part of the Sunsprite API, use print/warn/err instead to show
 * messages in the output panel.
 */
declare const console: {
    log(...data: any[]): void
    info(...data: any[]): void
    debug(...data: any[]): void
    warn(...data: any[]): void
    error(...data: any[]): void
    trace(...data: any[]): void
    table(...data: any[]): void
    group(...data: any[]): void
    groupEnd(): void
    time(label?: string): void
    timeEnd(label?: string): void
    count(label?: string): void
    assert(condition?: boolean, ...data: any[]): void
    clear(): void
}`,

// Utilities
`
/**
 * A collection of functions useful for generating random values.
 */
declare const Random: {
${v.randomMembers}
}

declare const Output: {
    /**
     * Display a normal message in the output panel.
     * @param msgs The messages to display.
     */
    print(...msgs: Printable[]): void,

    /**
     * Display a warning message in the output panel.
     * @param msgs The warning messages to display.
     */
    warn(...msgs: Printable[]): void,

    /**
     * Display an error message in the output panel.
     * @param msgs The error messages to display.
     */
    error(...msgs: Printable[]): void,

    /**
     * Clear all messages from the output panel.
     */
    clear(): void
}

${v.printDeclaration}

${v.watchDeclaration}

${v.unwatchDeclaration}

${v.deg2radDeclaration}

${v.rad2degDeclaration}

${v.sinDeclaration}

${v.cosDeclaration}

${v.tanDeclaration}

${v.atan2Declaration}

${v.clampDeclaration}

/**
 * Returns the square root of a number.
 * @param num A number.
 */
declare function sqrt(num: number): number

/**
 * Returns the minimum of any number of arguments.
 * @param nums Any number of values.
 */
declare function min(...nums: number[]): number

/**
 * Returns the maximum of any number of arguments.
 * @param nums Any number of values.
 */
declare function max(...nums: number[]): number

/**
 * Returns a number rounded down to the nearest integer.
 * @param num A number.
 */
declare function floor(num: number): number

/**
 * Returns a number rounded up to the nearest integer.
 * @param num A number.
 */
declare function ceil(num: number): number

/**
 * Returns a number rounded to the nearest integer. When num has a decimal portion of exactly 0.5, it is rounded up even when negative. e.g. (1.5  ->  2.0) and (-1.5  ->  -1.0)
 * @param num A number.
 */
declare function round(num: number): number

/**
 * The ratio of the circumference of a circle to its diameter.
 */
const PI = ${Math.PI}`,

// Sprite
// TODO: include default values
`
type SpriteProps = GameObjectProps & {
${v.spritePropsFields}
}

class Sprite {
    /**
     * The Sprite class. TODO: describe
     * @param options TODO: describe
     */
    constructor(options?: SpriteProps)

${v.spriteMembers}
}`,

// Rectangle
`
type RectangleProps = GameObjectProps & {
${v.rectanglePropsFields}
}

class Rectangle {
    /**
     * The Rectangle class. TODO: describe
     * @param options TODO: describe
     */
    constructor(options?: RectangleProps)

${v.rectangleMembers}
}`,

// Line
// TODO: figure out why monaco doesn't like Returnable<PointArg> for plain point
// setters. Using [x, y] to define a point in the props object is no problem, but
// when just doing something like line.pointA = [x, y] it raises an error along
// the lines of 'number[] not assignable to [number, number] (Target requires 2 element(s) but source may have fewer)'
`type LineProps = RotatableProps & ViewableProps & {
${v.linePropsFields}
}

class Line {
    /**
     * A straight line from point A to point B.
     * @param options TODO: describe
     */
    constructor(options?: LineProps)

${v.lineMembers}
}`,

// VLine
`type VLineProps = ViewableProps & {
${v.vLinePropsFields}
}

class VLine {
    /**
     * A straight, infinitely long vertical line.
     * @param options TODO: describe
     */
    constructor(options?: VLineProps)

${v.vLineMembers}
}`,

// HLine
`type HLineProps = ViewableProps & {
${v.hLinePropsFields}
}

class HLine {
    /**
     * A straight, infinitely long horizontal line.
     * @param options TODO: describe
     */
    constructor(options?: HLineProps)

${v.hLineMembers}
}`,

// Label
`type LabelProps = GameObjectProps & {
${v.labelPropsFields}
}

class Label {
    /**
     * An object that displays text. TODO: describe (better)
     * @param options TODO: describe
     */
    constructor(options?: LabelProps)

${v.labelMembers}
}`,

// Circle
`type CircleProps = GameObjectProps & {
${v.circlePropsFields}
}

class Circle {
    /**
     * A basic circle shape. TODO: describe (better)
     * @param options TODO: describe
     */
    constructor(options?: CircleProps)

${v.circleMembers}
}`,
    ].join('\n') + '\n}\nexport {}'
}

export const apiLib = buildApiLib({
    positionableApi,
    positionablePropsTypeDef, sizablePropsTypeDef, rotatablePropsTypeDef, viewablePropsTypeDef, interactablePropsTypeDef,
    spritePropsFields, spriteMembers,
    rectanglePropsFields, rectangleMembers,
    circlePropsFields, circleMembers,
    labelPropsFields, labelMembers,
    linePropsFields, lineMembers,
    hLinePropsFields, hLineMembers,
    vLinePropsFields, vLineMembers,
    cameraMembers, vector2Members, timerMembers, clockMembers, screenMembers, mouseMembers,
    randomMembers,
    foreverDeclaration, repeatDeclaration, repeatUntilDeclaration, repeatWhileDeclaration,
    afterDeclaration, everyDeclaration, whenDeclaration,
    keyPressedDeclaration, keyJustPressedDeclaration, keyJustReleasedDeclaration,
    onKeyPressDeclaration, onKeyReleaseDeclaration, onKeyHoldDeclaration, onMouseDeclaration,
    setBackgroundColorDeclaration, pauseDeclaration, playDeclaration, printDeclaration,
    watchDeclaration, unwatchDeclaration,
    deg2radDeclaration, rad2degDeclaration, sinDeclaration, cosDeclaration, tanDeclaration, atan2Declaration, clampDeclaration,
})