/** Any object with both x and y properties. */
export type Point = {
	/** Horizontal position in the world. */
	x: number,
	/** Vertical position in the world. */
	y: number
}

/** Point-interpretable array of the form [x, y]. */
export type ArrayPoint = [number, number]

/** Type to be provided when providing points as arguments/setter values, either a Point directly or an [x, y] array. */
export type PointArg = Point | ArrayPoint

function isPoint(obj: any): obj is Point {
	return obj && typeof obj.x === 'number' && typeof obj.y === 'number'
}
function isArrayPoint(obj: any): obj is ArrayPoint {
	return obj && /*obj.length === 2 &&*/ typeof obj[0] === 'number' && typeof obj[1] === 'number'
}
function isPointArg(obj: any): obj is PointArg {
	return obj && isPoint(obj) && isArrayPoint(obj)
}

/** Create a point from a pair of number args. */
export function pointFrom(x: number, y: number): Point
/** Create a point from a PointArg; either an { x, y } obj or a [number, number] array. */
export function pointFrom(point: PointArg): Point
/** Create a point from a number array, this is needed to allow JS array literals from user code which will be inferred as number[] rather than [number, number]. */
export function pointFrom(array: number[]): Point
/** Point factory: Return a Point object created from any point-interpretable type. */
export function pointFrom(xOrPoint: number | number[] | PointArg, y?: number): Point {
	if (isPoint(xOrPoint)) {
		return {
			x: xOrPoint.x,
			y: xOrPoint.y
		}
	}

	if (isArrayPoint(xOrPoint)) {
		return {
			x: xOrPoint[0],
			y: xOrPoint[1]
		}
	}
	
	if (y != null && typeof xOrPoint === 'number' && typeof y === 'number') {
		return {
			x: xOrPoint,
			y
		}
	}

	// Bad params. Error here
	return { x: NaN, y: NaN }
}

// WIP...
export class Vector2 {
	x: number = 0
	y: number = 0

	constructor(xOrPoint: number | PointArg, y?: number) {
		if (isPointArg(xOrPoint)) {
			this.x = pointFrom(xOrPoint).x
			this.y = pointFrom(xOrPoint).y
		}
		
		if (y != null && typeof xOrPoint === 'number' && typeof y === 'number') {
			this.x = xOrPoint,
			this.y = y
		}
	}

	get length(): number {
		return Math.sqrt(this.x ** 2 + this.y ** 2)
	}

	// normalize() {

	// }

	static get ZERO(): Vector2 {
		return new Vector2(0, 0)
	}

	static get ONE(): Vector2 {
		return new Vector2(1, 1)
	}
}