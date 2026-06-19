/**
 * Point object with { x, y }
 */
export type Point = { x: number, y: number }

/**
 * Point-interpretable array of the form [x, y]
 */
export type ArrayPoint = [number, number]

/**
 * Interpretable as a point, either a Point directly or an [x, y] array
 */
export type PointArg = Point | [number, number]


function isPoint(obj: any): obj is Point {
	return obj && typeof obj.x === 'number' && typeof obj.y === 'number'
}
function isArrayPoint(obj: any): obj is ArrayPoint {
	return obj && obj.length === 2 && typeof obj[0] === 'number' && typeof obj[1] === 'number'
}
function isPointArg(obj: any): obj is PointArg {
	return obj && isPoint(obj) && isArrayPoint(obj)
}

/**
 * Used to create point objects from args
 */
export abstract class PointFactory {
	x: number = NaN
	y: number = NaN

	constructor(xOrPoint: number | PointArg, y?: number) {
		if (isPointArg(xOrPoint)) {
			this.x = PointFactory.from(xOrPoint).x
			this.y = PointFactory.from(xOrPoint).y
		}
		
		if (y != null && typeof xOrPoint === 'number' && typeof y === 'number') {
			this.x = xOrPoint,
			this.y = y
		}
	}

	// Point object factory; returns a point-like { x, y } object
	static from(x: number, y: number): Point
	static from(point: PointArg): Point
	static from(xOrPoint: number | PointArg, y?: number): Point {
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
}

// WIP...
export class Vector2 {
	x: number = 0
	y: number = 0

	constructor(xOrPoint: number | PointArg, y?: number) {
		if (isPointArg(xOrPoint)) {
			this.x = PointFactory.from(xOrPoint).x
			this.y = PointFactory.from(xOrPoint).y
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