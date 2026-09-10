import { camera, screen } from "./core"
import { Vector2 } from "./Vector2"

/**
 * Without arguments: returns a random float of any possible value, from around -1.79 * 10^308 to
 * 1.79 * 10^308, the limit for 64-bit floats. That's from -179 uncentillion to 179 uncentillion.
 * The majority of the numbers returned will have extremely large absolute values.
 */
function randomNumber(): number
/**
 * Returns a random float in a given range, min inclusive / max exclusive. If min > max, they're
 * automatically swapped for you.
 * @param min The low end of the range.
 * @param max The high end of the range.
 */
function randomNumber(min: number, max: number): number
function randomNumber(min?: number, max?: number): number {
    if (min === undefined || max === undefined) {
        return Math.random()
    }
    min = Math.min(min, max)
    max = Math.max(min, max)
    return Math.random() * (max - min) + min
}

// function randomInt(): number
// function randomInt(min: number, max: number): number

/**
 * Returns a random integer in a given range, min and max inclusive. If min > max, they're automatically swapped for you.
 * @param min The low end of the range.
 * @param max The high end of the range.
 */
function randomInt(min: number, max: number): number {
    // if (min === undefined || max === undefined) {
    //     min = Number.MIN_SAFE_INTEGER
    //     max = Number.MAX_SAFE_INTEGER
    // }
    const minCeiled = Math.ceil(Math.min(min, max))
    const maxFloored = Math.floor(Math.max(min, max))
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled)
}

/**
 * A collection of functions useful for generating random values.
 */
const Random = {
    /**
     * Test doc randomNumber
     */
    number: randomNumber,

    /**
     * Test doc randomInt
     */
    integer: randomInt,

    // // Random alphanumeric string of length len: is this idea any good?
    // string(len: number): string { ... },

    /**
     * Returns a random boolean, 50/50 chance for true/false.
     */
    coinFlip(): boolean {
        return Math.random() >= 0.5
    },

    /**
     * Returns the result of rolling a die with a given number of sides.
     * @param sides The number of sides on the die.
     */
    roll(sides: number): number {
        return this.integer(1, sides)
    },

    /**
     * Returns a random letter of the alphabet. Lowercase by default.
     * @param uppercase True if you want the letter to be uppercase.
     */
    letter(uppercase: boolean = false): string {
        const alpha = 'abcdefghijklmnopqrstuvwxyz'
        return uppercase ? this.char(alpha).toUpperCase() : this.char(alpha)
    },

    // Word... include kid-friendly word list?
    // word(length: number): string {

    // }

    /**
     * Returns a random character from a given string.
     * @param str The string to choose a character from.
     */
    char(str: string): string {
        return str.charAt(this.integer(0, str.length - 1))
    },

    /**
     * Returns a random hex RGB color string.
     */
    color(): string {
        const hexChars = '0123456789abcdef'
        let color = '#'
        while (color.length < 7) {
            color += Random.char(hexChars)
        }
        return color
    },

    // TODO: Shuffle an array
    // shuffle(arr: any[]): void {

    // },

    /**
     * Returns a random item from a given array.
     * @param array The array to choose an element from.
     */
    choice(arr: any[]): any {
        return arr[this.integer(0, arr.length - 1)]
    },

    /**
     * Returns a random rotation in radians as a float/decimal value. Range: [0, 2*pi)
     */
    radians(): number {
        return this.number(0, 2 * Math.PI)
    },

    /**
     * Returns a random rotation in degrees as an integer. Range: [0, 359]
     */
    degrees(): number {
        return this.number(0, 359)
    },

    /**
     * Returns a random position within the currently visible area.
     */
    position(): Vector2 {
        return new Vector2(this.x(), this.y())
    },

    /**
     * Returns a random position within the currently visible area. (alias for position)
     */
    pos(): Vector2 {
        return this.position()
    },

    /**
     * Returns a random x coordinate within the currently visible area.
     */
    x(): number {
        return this.integer(camera.left, camera.right)
    },
    
    /**
     * Returns a random y coordinate within the currently visible area.
     */
    y(): number {
        return this.integer(camera.bottom, camera.top)
    },

    /**
     * Returns a random x coordinate within the screen space.
     */
    screenX(): number {
        return this.integer(screen.left, screen.right)
    },

    /**
     * Returns a random y coordinate within the screen space.
     */
    screenY(): number {
        return this.integer(screen.bottom, screen.top)
    },

    /**
     * Returns a random position within the screen space.
     */
    screenPosition(): Vector2 {
        return new Vector2(this.screenX(), this.screenY())
    },

    /**
     * Returns a random position within the screen space. (alias for screenPosition)
     */
    screenPos(): Vector2 {
        return this.screenPosition()
    }
}

export default Random