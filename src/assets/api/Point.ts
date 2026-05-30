export abstract class Point {
	x: number = NaN
	y: number = NaN

	constructor(xOrPoint: number | AnyPoint, y?: number) {
		if (isAnyPoint(xOrPoint)) {
			this.x = Point.from(xOrPoint).x
			this.y = Point.from(xOrPoint).y
		}
		
		if (y != null && typeof xOrPoint === 'number' && typeof y === 'number') {
			this.x = xOrPoint,
			this.y = y
		}
	}

	// Point object factory; returns a point-like { x, y } object
	static from(x: number, y: number): Point
	static from(point: AnyPoint): Point
	static from(xOrPoint: number | AnyPoint, y?: number): Point {
		if (isObjectPoint(xOrPoint)) {
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

export type ObjectPoint = { x: number, y: number }
export type ArrayPoint = [number, number]
export type AnyPoint = Point | ObjectPoint | ArrayPoint

function isObjectPoint(obj: any): obj is ObjectPoint {
	return obj && typeof obj.x === 'number' && typeof obj.y === 'number'
}
function isArrayPoint(obj: any): obj is ArrayPoint {
	return obj && obj.length === 2 && typeof obj[0] === 'number' && typeof obj[1] === 'number'
}
function isAnyPoint(obj: any): obj is AnyPoint {
	return obj && isObjectPoint(obj) && isArrayPoint(obj)
}


// WIP...
export class Vector2 {
	x: number = 0
	y: number = 0

	constructor(xOrPoint: number | AnyPoint, y?: number) {
		if (isAnyPoint(xOrPoint)) {
			this.x = Point.from(xOrPoint).x
			this.y = Point.from(xOrPoint).y
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