import Output from "@/sandbox/output"
import Warning from "./Warning"
import { currentLocation } from "@api/moduleRunner"
import { atan2, cos, deg2rad, rad2deg, sin } from "./utility"

/** Vector2-interpretable array of the form [x, y]. */
type XYArray = [number, number]
/** Any object with numeric { x, y } */
type XYObject = { x: number, y: number }

/** 
 * Type to be used when providing vector2 as arguments/setter values,
 * either an { x, y } object or an [x, y] array.
 */
export type Vector2Like = XYObject | XYArray

export function isXYObject(obj: any): obj is XYObject {
    return obj && typeof obj.x === 'number' && typeof obj.y === 'number'
}
export function isXYArray(obj: any): obj is XYArray {
    return obj && /*obj.length === 2 &&*/ typeof obj[0] === 'number' && typeof obj[1] === 'number'
}

export function isVector2Like(obj: any): obj is Vector2Like {
    return isXYObject(obj) || isXYArray(obj)
}

export class Vector2 {
	x: number = 0
	y: number = 0

	constructor(x: number, y: number) {
		this.x = x
        this.y = y
	}

    /** Sets the given x and y values. */
    set(x: number, y: number) {
        this.x = x
        this.y = y
    }
    
    /** Sets both x and y to the same given value. */
    fill(n: number) {
        this.x = n
        this.y = n
    }
    
    /** Set this vector's length to 1, keeping the same direction. */
	normalize() {
        const length = this.length
        this.x /= length
        this.y /= length
	}
    
    // TODO: Come back to these, vector should implement more robust rotation and orientation behaviors
    /**
     * Rotates this vector by a given amount.
     * @param amount How much to rotate by.
     * @param unit The angle unit ('radians' or 'degrees'), defaults to degrees.
     */
    rotate(amount: number, unit: 'radians' | 'degrees' = 'degrees') {
        const cosT = cos(amount, unit)
        const sinT = sin(amount, unit)
        const x = this.x
        const y = this.y
        this.x = x * cosT - y * sinT
        this.y = x * sinT - y * cosT
    }

    /**
     * Returns a copy of this vector rotated by a given amount.
     * @param amount How much to rotate by.
     * @param unit The angle unit ('radians' or 'degrees'), defaults to degrees.
     */
    rotated(amount: number, unit: 'radians' | 'degrees' = 'degrees') {
        const cosT = cos(amount, unit)
        const sinT = sin(amount, unit)
        const x = this.x
        const y = this.y
        return Vector2.from(
            x * cosT - y * sinT,
            x * sinT - y * cosT
        )
    }

    get rotation(): number {
        return atan2(this.y, this.x, 'degrees')
    }
    set rotation(degrees: number) {
        const { x, y, length } = this
        this.x = length * cos(degrees, 'degrees')
        this.y = length * sin(degrees, 'degrees')
    }

    get radians(): number {
        return atan2(this.y, this.x, 'radians')
    }
    set radians(radians: number) {
        const { x, y, length } = this
        this.x = length * cos(radians, 'radians')
        this.y = length * sin(radians, 'radians')
    }
    
    // /** Points this vector toward the position of another object or end point of another vector. */
    // lookAt(other: Vector2Like) {
    //     other = Vector2.from(other)
    //     const newDir = Vector2.from(other.x - this.x, other.y - this.y)
    // }

    /** Magnitude of this vector. */
    get length(): number {
        return Math.sqrt(this.x ** 2 + this.y ** 2)
    }

    /**
     * Angle of this vector in the given unit, defaults to degrees.
     * @param unit The angle unit ('radians' or 'degrees'), defaults to degrees.
     */
    // getAngle(unit: 'degrees' | 'radians' = 'degrees'): number {
    //     const rads = Math.atan2(this.y, this.x)
    //     return unit === 'degrees' ? rad2deg(rads) : rads
    // }

    /** Distance from this vector's end point to another vector's end point. */
    distanceTo(x: number, y: number): number
    distanceTo(other: Vector2Like): number
    distanceTo(xOrOther: number | Vector2Like, y?: number) {
        let other = Vector2.ZERO

        if (isVector2Like(xOrOther)) {
            other = Vector2.from(xOrOther)
        }
        else if (typeof xOrOther === 'number' && typeof y === 'number') {
            other = Vector2.from(xOrOther, y)
        }
        else {
            return new Vector2(NaN, NaN)
        }

        return Math.sqrt((other.x - this.x) ** 2 + (other.y - this.y) ** 2)
    }

    /** A human-readable string in the format [x, y]. */
    toString(): string {
        return `[${this.x}, ${this.y}]`
    }

    /** Get a normalized copy of this vector. */
    get normal(): Vector2 {
        return new Vector2(this.x / this.length, this.y / this.length)
    }

    /** A Vector2 with x & y both equal to 0: [0, 0] */
	static get ZERO(): Vector2 {
		return new Vector2(0, 0)
	}

    /** A Vector2 with x & y both equal to 1: [1, 1] */
	static get ONE(): Vector2 {
		return new Vector2(1, 1)
	}

    /** A Vector2 representing a normalized upward direction: [0, 1]. */
    static get UP(): Vector2 {
        return new Vector2(0, 1)
    }

    /** A Vector2 representing a normalized downward direction: [0, -1]. */
    static get DOWN(): Vector2 {
        return new Vector2(0, -1)
    }

    /** A Vector2 representing a normalized left direction: [-1, 0]. */
    static get LEFT(): Vector2 {
        return new Vector2(-1, 0)
    }

    /** A Vector2 representing a normalized right direction: [1, 0]. */
    static get RIGHT(): Vector2 {
        return new Vector2(1, 0)
    }

    /** Create a Vector2 from a pair of x/y values. */
    static from(x: number, y: number): Vector2
    /** 
     * Create a Vector2 from a Vector2Like; either an { x, y } obj or a
     * [number, number] array.
     */
    static from(xy: Vector2Like): Vector2
    /** 
     * Create a Vector2 from a number array, this is needed (not captured by
     * above) to allow JS array literals from user code which will be inferred
     * as number[] rather than [number, number].
     */
    static from(xy: number[]): Vector2
    /**
     * Overloaded Vector2 factory: Return a Vector2 created from any
     * Vector2-interpretable type.
     */
    static from(xOrXy: number | number[] | Vector2Like, y?: number): Vector2 {
        if (isXYObject(xOrXy)) {
            return new Vector2(xOrXy.x, xOrXy.y)
        }
    
        if (isXYArray(xOrXy)) {
            if (xOrXy.length > 2) {
                Output.runtimeWarning('Extra Vector2 array arguments will be discarded', currentLocation())
            }
            return new Vector2(xOrXy[0], xOrXy[1])
        }
        
        if (y != null && typeof xOrXy === 'number' && typeof y === 'number') {
            return new Vector2(xOrXy, y)
        }
    
        // Bad params. Error here
        throw new Error('Bad Vector2 args')
    }
}