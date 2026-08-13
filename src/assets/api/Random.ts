import { screen } from "./core"
import type { Point } from "./Point";

const Random = {
    // Get a random int, min & max inclusive
    range(min: number, max: number): number {
        const minCeiled = Math.ceil(Math.min(min, max))
        const maxFloored = Math.floor(Math.max(min, max))
        return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled)
    },

    // TODO: exclusive int range?

    // Random float in a given range, min inclusive / max exclusive
    float(min: number, max: number): number {
        const realMin = Math.min(min, max)
        const realMax = Math.max(min, max)
        return Math.random() * (realMax - realMin) + realMin;
    },

    // // Random alphanumeric string of length len: is this idea any good?
    // string(len: number): string {

    // },

    // Random bool, 50% chance
    coinFlip(): boolean {
        return Math.random() >= 0.5
    },

    // Random dice roll
    roll(sides: number): number {
        return this.range(1, sides)
    },

    // Random letter
    letter(uppercase: boolean = false): string {
        const alpha = 'abcdefghijklmnopqrstuvwxyz'
        return uppercase ? this.char(alpha).toUpperCase() : this.char(alpha)
    },

    // Random character from a string
    char(str: string): string {
        return str.charAt(this.range(0, str.length - 1))
    },

    // Random color
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

    // Pick a random item from array
    choice(arr: any[]): any {
        return arr[this.range(0, arr.length - 1)]
    },

    // Random rotation in radians
    radians(): number {
        return this.float(0, 2 * Math.PI)
    },

    // Random rotation in degrees
    degrees(): number {
        return this.range(0, 359)
    },

    // Random position inside screen
    position(): Point {
        return {
            x: this.x(),
            y: this.y()
        }
    },

    // Alias for random.position()
    pos(): Point {
        return this.position()
    },

    // Random x coordinate inside screen
    x(): number {
        return this.range(screen.left, screen.right)
    },
    
    // Random y coordinate inside screen
    y(): number {
        return this.range(screen.bottom, screen.top)
    },
}

export default Random