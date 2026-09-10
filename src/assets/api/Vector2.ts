import Output from "@/sandbox/output"
import Warning from "./Warning"
import { currentLocation } from "@api/moduleRunner"

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

export class Vector2 {
	x: number = 0
	y: number = 0

	constructor(x: number, y: number) {
		this.x = x
        this.y = y
	}

    /** The magnitude of this vector. */
	get length(): number {
		return Math.sqrt(this.x ** 2 + this.y ** 2)
	}

    set(x: number, y: number) {
        this.x = x
        this.y = y
    }
    
    fill(n: number) {
        this.x = n
        this.y = n
    }

    /** Set this vector's length to 1. */
	normalize() {
        const length = this.length
        this.x /= length
        this.y /= length
	}

    rotate() {
        // TODO
    }

    setRotation() {
        // TODO
    }

    lookAt() {
        // TODO
    }

    /** Get a normalized copy of this vector. */
    get normal(): Vector2 {
        return new Vector2(this.x / this.length, this.y / this.length)
    }

    /** A Vector2 with x & y of 0. */
	static get ZERO(): Vector2 {
		return new Vector2(0, 0)
	}

    /**  */
	static get ONE(): Vector2 {
		return new Vector2(1, 1)
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

    toString(): string {
        return `[${this.x}, ${this.y}]`
    }
}