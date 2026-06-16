// import { camera, screen, timer, mouse, forever, repeat, repeatUntil, after, every, keyPressed, keyJustPressed, print, play, pause, setBackgroundColor } from "./core";
// import { random, deg2rad, rad2deg, sin, cos, tan, atan2, clamp } from "./utility";
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
import { PositionableApi, SizableApi, RotatableApi, ViewableApi, InteractableApi, TimeableApi, GameObjectApi } from "./mixins"

// /**
//  * Defines a point as a coordinate pair { x, y }.
//  */
// class Point {
//     /**
//      * Horizontal position.
//      */
//     x: number,

//     /**
//      * Vertical position.
//      */
//     y: number
// }

// /**
//  * True when the game is paused.
//  */
// let paused: boolean

// /**
//  * @typedef {Object} Point
//  * @property {number} x - Horizontal position.
//  * @property {number} y - Vertical position.
//  */

export const coreApi = `
/**
 * User mouse reference.
 */
const Mouse = {
    /**
     * Vertical position of the user's cursor.
     */
    x: 0

    /**
     * Horizontal position of the user's cursor.
     */
    y: 0

    /**
     * Position of the user's cursor as a Point.
     */
    position: { x: 0, y: 0 }

    /**
     * Position of the user's cursor as a Point. (alias for position)
     */
    pos: { x: 0, y: 0 }
}

/**
 * Game screen reference.
 */
const Screen = {
    /**
     * Current width of the game screen.
     */
    width: 0

    /**
     * Current height of the game screen.
     */
    height: 0

    /**
     * Y coordinate of the top edge of the screen.
     */
    top: 0

    /**
     * Y coordinate of the bottom edge of the screen.
     */
    bottom: 0

    /**
     * X coordinate of the left edge of the screen.
     */
    left: 0

    /**
     * X coordinate of the right edge of the screen.
     */
    right: 0

    /**
     * Point at the center of the screen.
     */
    center: { x: 0, y: 0 }
}

/**
 * Timer singleton.
 */
const Timer = {
    /**
     * Time since start, does not increment during pause.
     */
    time: 0

    /**
     * Time since start, including pause time.
     */
    realTime: 0

    /**
     * Normalized time since last frame. When running at 60 FPS, this will be around 1.0.
     */
    delta: 0

    /**
     * Time since last frame in milliseconds.
     */
    deltaMs: 0

    /**
     * Frames since game start, does not increment during pause.
     */
    frame: 0
}

/**
 * An array of all keys currently pressed.
 */
let keysPressed: string[]

/**
 * Set the background color.
 * @param color Color to fill the background with.
 */
function setBackgroundColor(color: string) {}

/**
 * Primary game loop; runs every frame.
 * @param func The function to run each frame.
 */
function forever(func:
    /**
     * @param delta Time since the previous frame.
     */
    (delta: number) => void
) {}

/**
 * Runs a specified number of times alongside the game loop (1 iteration per frame).
 * @param times The number of times to repeat.
 * @param func The function to be repeated.
 */
function repeat(times: number, func:
        /** @param i The current iteration (times repeated so far). */
        (i: number) => void
    ): {
    /**
     * The function to run once when the repeat ends.
     */
    then(afterFunc:
        /** @param i The current iteration (times repeated so far). */
        (i: number) => void
    ): void
} {}

/**
 * Runs until the specified condition is true. Runs alongside the game loop (1 iteration per frame).
 * @param condition The predicate condition to check.
 * @param func The function to be repeated.
 */
function repeatUntil(condition: () => boolean, func:
        /** @param i The current iteration (times repeated so far). */
        (i: number) => void
    ): {
    /**
     * The function to run once when the repeat ends.
     */
    then(afterFunc: 
        /** @param i The current iteration (times repeated so far). */
        (i: number) => void
    ): void
} {}

/**
 * Runs once after a specified number of seconds have passed.
 * @param seconds The number of seconds to wait before running.
 * @param func The function to run.
 */
function after(seconds: number, func: () => void) {}

/**
 * Runs once immediately, then repeatedly at a specified time interval.
 * @param seconds The number of seconds to wait before running each time.
 * @param func The function to run.
 */
function every(seconds: number, func: () => void) {}

/**
 * Returns true if the specified key is currently pressed. Will repeatedly be true while the key is held.
 * @param key The key to check.
 */
function keyPressed(key: string): boolean {}

/**
 * Returns true if the specified key is pressed, AND this is the first frame that it's being held. Will only be true once when a key starts being held.
 * @param key The key to check.
 */
function keyJustPressed(key: string): boolean {}

/**
 * Returns true if the specified key is no longer pressed, AND this is the first frame after release. Will only be true once when a key stops being held.
 * @param key The key to check.
 */
function keyJustReleased(key: string): boolean {}

/**
 * Register input actions to run once each time a key is pressed.
 * @param actions An object whose keys are strings representing keyboard keys, and whose values are the functions that pressing that key should run.
 */
function onKeyPress(actions: object) {}

/**
 * Register input actions to run once each time a key is released.
 * @param actions An object whose keys are strings representing keyboard keys, and whose values are the functions that pressing that key should run.
 */
function onKeyRelease(actions: object) {}

/**
 * Register input actions to run repeatedly while a key is held.
 * @param actions An object whose keys are strings representing keyboard keys, and whose values are the functions that pressing that key should run.
 */
function onKeyHold(actions: object) {}

/**
 * Display a message in the output panel.
 * @param msg The message to display.
 */
function print(msg: string) {}

/**
 * Pause engine processing. Must be manually un-paused using the UI button for now.
 */
function pause() {}

/**
 * Resume engine processing. There is currently no practical way to use this function since it can't be processed while paused. (WIP)
 */
function play() {}

/**
 * Clear all messages from the output panel.
 */
function clearOutput() {}
`

export const utilityApi = `
/**
 * A collection of functions useful for generating random values.
 */
const Random = {
    /**
     * Get a random integer, min and max inclusive. If min > max, they're automatically swapped for you.
     * @param min The low end of the range.
     * @param max The high end of the range.
     */
    range(min: number, max: number): number {},

    float(min: number, max: number): number {},

    coinFlip(): boolean {},

    roll(sides: number): number {},

    choice(array: any[]): any {},

    radians(): number {},

    degrees(): number {},

    position(): { x: 0, y: 0 },
    
    pos(): { x: 0, y: 0 },

    x(): number,

    y(): number,
}
`

export const rectangleApi = `
/**
 * The Rectangle class.
 */
class Rectangle {
    ${GameObjectApi}
    color: string
}
`