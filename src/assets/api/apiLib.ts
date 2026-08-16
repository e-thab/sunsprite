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
import { positionableApi, sizableApi, rotatableApi, viewableApi, interactableApi, timeableApi, gameObjectApi, gameObjectPropsTypeDef, positionablePropsTypeDef, sizablePropsTypeDef, rotatablePropsTypeDef, viewablePropsTypeDef, interactablePropsTypeDef } from "./mixins"
import Colors from './Colors'

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
export const apiLib = 'declare global {\n' + [
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
${positionablePropsTypeDef}
${sizablePropsTypeDef}
${rotatablePropsTypeDef}
${viewablePropsTypeDef}
${interactablePropsTypeDef}
${gameObjectPropsTypeDef}

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

type Action = (...args: any[]) => void
type Predicate = (...args: any[]) => boolean

/** Returnable def */
type Returnable<T> = T | (() => T)

type Printable = { toString(): string }

type MouseInputEvent = typeof LibVars.mouseInputEvents[number]
type MouseInputAction = {
    [key in MouseInputEvent]?: Action | null
}

type MouseHoldEvent = typeof LibVars.mouseHoldEvents[number]
type MouseInputAction = {
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
    /**
     * Vertical position of the user's cursor.
     */
    x: number

    /**
     * Horizontal position of the user's cursor.
     */
    y: number

    /**
     * Position of the user's cursor as a Point.
     */
    position: Point

    /**
     * Position of the user's cursor as a Point. (alias for position)
     */
    pos: Point

    /**
     * Returns whether the left mouse button is currently held down.
     */
    leftButtonDown: boolean

    /**
     * Returns whether the right mouse button is currently held down.
     */
	rightButtonDown: boolean

    /**
     * Returns whether the middle mouse button is currently held down.
     */
	middleButtonDown: boolean

    /**
     * Returns whether any mouse button is currently held down.
     */
	anyButtonDown: boolean
}

/**
 * Game screen reference.
 */
declare const Screen: {
    /**
     * Current width of the game screen.
     */
    width: number

    /**
     * Current height of the game screen.
     */
    height: number

    /**
     * Y coordinate of the top edge of the screen.
     */
    top: number

    /**
     * Y coordinate of the bottom edge of the screen.
     */
    bottom: number

    /**
     * X coordinate of the left edge of the screen.
     */
    left: number

    /**
     * X coordinate of the right edge of the screen.
     */
    right: number

    /**
     * Point at the center of the screen.
     */
    center: Point
}

class Timer {
	/** Time since start in milliseconds, does not increment during pause */
	timeMs: number
	/** Time since start in seconds, does not increment during pause */
	time: number

	/** Time since start in milliseconds including pause time */
	totalTimeMs: number
	/** Time since start in seconds including pause time */
	totalTime: number

	/** Actual (but smoothed) time since last frame in milliseconds */
	deltaMs: number
	/** Time since last frame normalized to 60fps (will usually be around 1) */
	delta: number

	/** Number of frames since start */
	frame: number

	/** Time this run started in milliseconds since the Unix epoch */
	startTimeMs: number
	/** Time this run started in seconds since the Unix epoch */
	startTime: number

	/** Current time in milliseconds */
	nowMs: number = 0
	/** Current time in seconds */
	now: number

	/** Is the timer currently paused? */
	paused: boolean

	/** Pause the timer */
	pause(): void

	/** Resume the timer */
	play(): void

	/** Reset the timer */
	reset(): void
}

/**
 * Game clock, instance of the Timer class.
 */
declare const Clock: Timer

/**
 * An array of all keys currently pressed.
 */
declare const keysPressed: string[]

/**
 * Set the background color.
 * @param color Color to fill the background with.
 */
declare function setBackgroundColor(color: string): void

/**
 * Primary game loop; runs every frame.
 * @param func The function to run each frame.
 */
declare function forever(func:
    /** @param delta Time since the previous frame. */
    (delta: number) => void
): void

/**
 * Runs a specified number of times alongside the game loop (1 iteration per frame).
 * @param times The number of times to repeat.
 * @param func The function to be repeated.
 */
declare function repeat(times: number, func:
    /** @param i The current iteration (times repeated so far). */
    (i: number) => void
): {
    /**
     * Register a function to run when the repeat ends.
     * @param afterFunc The function.
     */
    then(afterFunc:
        /** @param i The current iteration (times repeated so far). */
        (i: number) => void
    ): void
}

/**
 * Runs until the specified condition is true. Runs alongside the game loop (1 iteration per frame).
 * @param condition The predicate condition to check.
 * @param func The function to be repeated.
 */
declare function repeatUntil(condition: () => boolean, func:
    /** @param i The current iteration (times repeated so far). */
    (i: number) => void
): {
    /**
     * Register a function to run when the repeat ends.
     * @param afterFunc The function.
     */
    then(afterFunc: 
        /** @param i The current iteration (times repeated so far). */
        (i: number) => void
    ): void
}

/**
 * Runs repeatedly while the specified condition is true. Runs alongside the game loop (1 iteration per frame).
 * @param condition The predicate condition to check.
 * @param func The function to be repeated.
 */
declare function repeatWhile(condition: () => boolean, func:
    /** @param i The current iteration (times repeated so far). */ 
    (i: number) => void
): {
    /**
     * Register another function to run once every time the condition switches from true to false.
     * @param afterFunc The function.
     */
    then(afterFunc:
        /** @param i The current iteration (times repeated so far). */
        (i: number) => void
    ): void
}

/**
 * Runs once after a specified number of seconds have passed.
 * @param seconds The number of seconds to wait before running.
 * @param func The function to run.
 */
declare function after(seconds: number, func: () => void): void

/**
 * Runs once immediately, then repeatedly at a specified time interval.
 * @param seconds The number of seconds to wait before running each time.
 * @param func The function to run.
 */
declare function every(seconds: number, func: () => void): void

/**
 * Runs once each time the condition becomes true.
 * @param condition The condition to check.
 * @param func The function to run.
 */
declare function when(condition: () => boolean, func: () => void): void

/**
 * Returns true if the specified key is currently pressed. Will repeatedly be true while the key is held.
 * @param key The key to check.
 */
declare function keyPressed(key: string): boolean

/*
 * Returns true if the specified key is pressed, AND this is the first frame that it's being held. Will only be true once when a key starts being held.
 * @param key The key to check.
 */
declare function keyJustPressed(key: string): boolean

/**
 * Returns true if the specified key is no longer pressed, AND this is the first frame after release. Will only be true once when a key stops being held.
 * @param key The key to check.
 */
declare function keyJustReleased(key: string): boolean

/**
 * Register input actions to run once each time a key is pressed.
 * @param actions An object whose keys are strings representing keyboard keys, and whose values are the functions that pressing that key should run.
 */
declare function onKeyPress(actions: KeyAction): void

/**
 * Register input actions to run once each time a key is released.
 * @param actions An object whose keys are strings representing keyboard keys, and whose values are the functions that pressing that key should run.
 */
declare function onKeyRelease(actions: KeyAction): void

/**
 * Register input actions to run repeatedly while a key is held.
 * @param actions An object whose keys are strings representing keyboard keys, and whose values are the functions that pressing that key should run.
 */
declare function onKeyHold(actions: KeyAction): void

/**
 * Register input actions to run once each time a mouse event is detected.
 * @param actions An object whose keys are strings representing mouse events, and whose values are the functions that activating that event should run.
 */
declare function onMouse(actions: MouseInputAction): void

/**
 * Pause engine processing. Must be manually un-paused using the UI button for now.
 */
declare function pause(): void

/**
 * Resume engine processing. There is currently no practical way to use this function since it can't be processed while paused. (WIP)
 */
declare function play(): void



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
    /**
     * Returns a random integer in a given range, min and max inclusive. If min > max, they're automatically swapped for you.
     * @param min The low end of the range.
     * @param max The high end of the range.
     */
    range(min: number, max: number): number,

    /**
     * Returns a random float in a given range, min inclusive / max exclusive. If min > max, they're automatically swapped for you.
     * @param min The low end of the range.
     * @param max The high end of the range.
     */
    float(min: number, max: number): number,

    /**
     * Returns a random boolean, 50/50 chance for true/false.
     */
    coinFlip(): boolean,

    /**
     * Returns the result of rolling a die with a given number of sides.
     * @param sides The number of sides on the die.
     */
    roll(sides: number): number,

    /**
     * Returns a random letter of the alphabet. Lowercase by default.
     * @param uppercase True if you want the letter to be uppercase.
     */
    letter(uppercase: boolean = false): string,

    /**
     * Returns a random character from a given string.
     * @param str The string to choose a character from.
     */
    char(str: string): string,

    /**
     * Returns a random hex RGB color string.
     */
    color(): string

    /**
     * Returns a random item from a given array.
     * @param array The array to choose an element from.
     */
    choice(array: any[]): any,

    /**
     * Returns a random rotation in radians as a float/decimal value. Range: [0, 2*pi)
     */
    radians(): number,

    /**
     * Returns a random rotation in degrees as an integer. Range: [0, 359]
     */
    degrees(): number,

    /**
     * Returns a random position within the screen.
     */
    position(): Point,
    
    /**
     * Returns a random position within the screen. (alias for position)
     */
    pos(): Point,

    /**
     * Returns a random x position within the screen.
     */
    x(): number,

    /**
     * Returns a random y position within the screen.
     */
    y(): number,
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

/**
 * Display a normal message in the output panel. Shorthand for Output.print().
 * @param msg The message to display.
 */
declare function print(...msg: Printable[]): void

/**
 * Adds an item to the watch panel.
 * @param label The card's title.
 * @param values An object whose properties are value labels, and whose values are functions returning the value to watch.
 */
declare function watch(label: string, values: Record<string, () => any>): void

// Overload
/**
 * Adds an item to the watch panel.
 * @param label The card's title.
 * @param value A function returning the value to watch.
 */
declare function watch(label: string, value: () => any): void

/**
 * Removes an item from the watch panel.
 * @param label The card's title.
 */
declare function unwatch(label: string): void

/**
 * Returns an angle converted from degrees to radians.
 * @param deg The angle in degrees.
 */
declare function deg2rad(deg: number): number

/**
 * Returns an angle converted from radians to degrees.
 * @param rad The angle in radians.
 */
declare function rad2deg(rad: number): number

/**
 * Returns the sine of a number.
 * @param angle The angle.
 * @param [unit=degrees] The measurement unit (radians/degrees). If not provided, defaults to degrees.
 */
declare function sin(angle: number, unit?: string): number

/**
 * Returns the cosine of a number.
 * @param angle An angle.
 * @param [unit=degrees] The measurement unit (radians/degrees). If not provided, defaults to degrees.
 */
declare function cos(angle: number, unit?: string): number

/**
 * Returns the tangent of a number.
 * @param angle An angle.
 * @param [unit=degrees] The measurement unit (radians/degrees). If not provided, defaults to degrees.
 */
declare function tan(angle: number, unit?: string): number

/**
 * Returns the angle between the X axis and the line going through both the origin and the given point.
 * @param y The y position of the given point.
 * @param x The x position of the given point.
 * @param [unit=degrees] The measurement unit (radians/degrees). If not provided, defaults to degrees.
 */
declare function atan2(y: number, x: number, unit?: string): number

/**
 * Returns a number constrained to a given range. If num <= min, returns min. If num >= max, returns max. If min > max, they're automatically swapped for you.
 * @param num A number.
 * @param min The low end of the constraint range.
 * @param max The high end of the constraint range.
 */
declare function clamp(num: number, min: number, max: number): number

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
    /** A URL path to the sprite's image. */
    src?: string
}

class Sprite {
    /**
     * The Sprite class. TODO: describe
     * @param options TODO: describe
     */
    constructor(options?: SpriteProps)
    
    ${gameObjectApi}

    /** A URL path to the sprite's image. */
    src: string
}`,

// Rectangle
`
type RectangleProps = GameObjectProps & {
    /** The fill color. */
    color?: string
}

class Rectangle {
    /**
     * The Rectangle class. TODO: describe
     * @param options TODO: describe
     */
    constructor(options?: RectangleProps)

    ${gameObjectApi}

    /** The fill color. */
    color: string
}`,

// Line
// TODO: figure out why monaco doesn't like Returnable<PointArg> for plain point
// setters. Using [x, y] to define a point in the props object is no problem, but
// when just doing something like line.pointA = [x, y] it raises an error along
// the lines of 'number[] not assignable to [number, number] (Target requires 2 element(s) but source may have fewer)'
`type LineProps = RotatableProps & ViewableProps & {
    /** Position of end point A. */
    pointA?: Returnable<PointArg>

    /** Position of end point B. */
    pointB?: Returnable<PointArg>

    /** The color of the line. */
    color?: string

    /** The thickness of the line. (Default = 2) */
    thickness?: number
}

class Line {
    /**
     * A straight line from point A to point B.
     * @param options TODO: describe
     */
    constructor(options?: LineProps)

    ${rotatableApi}
    ${timeableApi}
    ${viewableApi}

    /** Position of end point A. */
    get pointA(): Point
    set pointA(pointA: Returnable<PointArg | number[]>)

    /** Position of end point B. */
    get pointB(): Point
    set pointB(pointB: Returnable<PointArg | number[]>)

    /** The color of the line. */
    color: string

    /** The thickness of the line. */
    thickness: number
}`,

// VLine
`type VLineProps = ViewableProps & {
    /** The horizontal position of the line. */
    x?: number

    /** The color of the line */
    color?: string

    /** The thickness of the line. */
    thickness?: number
}

class VLine {
    /**
     * A straight, infinitely long vertical line.
     * @param options TODO: describe
     */
    constructor(options?: VLineProps)

    ${viewableApi}

    /** The horizontal position of the line. */
    x: number

    /** The color of the line */
    color: string

    /** The thickness of the line. */
    thickness: number
}`,

// HLine
`type HLineProps = ViewableProps & {
    /** The vertical position of the line. */
    y?: number

    /** The color of the line */
    color?: string

    /** The thickness of the line. */
    thickness?: number
}

class HLine {
    /**
     * A straight, infinitely long horizontal line.
     * @param options TODO: describe
     */
    constructor(options?: HLineProps)

    ${viewableApi}

    /** The vertical position of the line. */
    y: number

    /** The color of the line */
    color: string

    /** The thickness of the line. */
    thickness: number
}`
,

// Label
`type LabelProps = GameObjectProps & {
    /** Text content of the label. */
    text?: string | string[]

    /** Font size. */
    size?: number

    /** Font family. */
    font?: string

    /** Fill color. */
    color?: string
}

class Label {
    /**
     * An object that displays text. TODO: describe (better)
     * @param options TODO: describe
     */
    constructor(options?: LabelProps)

    ${gameObjectApi}

    /** Text content of the label. */
    get text(): string
    set text(text: string | string[])

    /** Font size. */
    size: number

    /** Font family. */
    font: string

    /** Fill color. */
    color: string
}`,

// Circle
`type CircleProps = GameObjectProps & {
    color?: string
    // outlineColor?: string
    radius?: number
}

class Circle {
    /**
     * A basic circle shape. TODO: describe (better)
     * @param options TODO: describe
     */
    constructor(options?: CircleProps)

    ${gameObjectApi}

    /** The fill color. */
    color: string

    /** The distance from the center of the circle to the edge. */
    radius: number
}`,

// Vector2
`/**
 * 
 */
class Vector2 {
    // TODO: Vector2
}`,
].join('\n') + '\n}\nexport {}'