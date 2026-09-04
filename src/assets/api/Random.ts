import { camera, screen } from "@api/core"
import { Vector2 } from "@api/Vector2"

function randomNumber(): number
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
function randomInt(min: number, max: number): number {
    // if (min === undefined || max === undefined) {
    //     min = Number.MIN_SAFE_INTEGER
    //     max = Number.MAX_SAFE_INTEGER
    // }
    const minCeiled = Math.ceil(Math.min(min, max))
    const maxFloored = Math.floor(Math.max(min, max))
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled)
}

const Random = {
    // Random float in a given range, min inclusive / max exclusive
    number: randomNumber,

    // Get a random int, min & max inclusive
    integer: randomInt,

    // // Random alphanumeric string of length len: is this idea any good?
    // string(len: number): string { ... },

    // Random bool, 50% chance
    coinFlip(): boolean {
        return Math.random() >= 0.5
    },

    // Random dice roll
    roll(sides: number): number {
        return this.integer(1, sides)
    },

    // Random letter
    letter(uppercase: boolean = false): string {
        const alpha = 'abcdefghijklmnopqrstuvwxyz'
        return uppercase ? this.char(alpha).toUpperCase() : this.char(alpha)
    },

    // Word... include kid-friendly word list?
    // word(length: number): string {

    // }

    // Random character from a string
    char(str: string): string {
        return str.charAt(this.integer(0, str.length - 1))
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
        return arr[this.integer(0, arr.length - 1)]
    },

    // Random rotation in radians
    radians(): number {
        return this.number(0, 2 * Math.PI)
    },

    // Random rotation in degrees
    degrees(): number {
        return this.number(0, 359)
    },

    // Random position inside screen
    position(): Vector2 {
        return new Vector2(this.x(), this.y())
    },

    // Alias for random.position()
    pos(): Vector2 {
        return this.position()
    },

    // Random visible x coordinate
    x(): number {
        return this.integer(camera.left, camera.right)
    },
    
    // Random visible y coordinate
    y(): number {
        return this.integer(camera.bottom, camera.top)
    },

    // Random screen x coordinate
    screenX(): number {
        return this.integer(screen.left, screen.right)
    },

    // Random screen y coordinate
    screenY(): number {
        return this.integer(screen.bottom, screen.top)
    }
}

export default Random