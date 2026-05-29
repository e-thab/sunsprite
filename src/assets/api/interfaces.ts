/**
 * Interfaces
 */
export type Action = (...args: any[]) => void
export type Predicate = (...args: any[]) => boolean

export interface Touchable {
	left: number
	right: number
	top: number
	bottom: number
	// scale: number
	// rotation?: number
	// radians?: number
}

/* used for repeat() */
export interface Repeatable {
	count: number
	i: number
	fn: Action
	then?: Action
}

/* Used for repeatUntil() */
export interface RepeatableUntil extends Omit<Repeatable, 'count'> {
	condition: Predicate
}

/* Used for after() & every() */
export interface Delayable {
	elapsedMs: number
	lifetimeMs: number
	fn: Action
}

export interface Screen {
	width: number
	height: number
	top: number
	bottom: number
	right: number
	left: number
	center: [number, number] // <- at some point, make this required so it can be spread '...center'
}

export class Mouse {
	x: number = 0
	y: number = 0

	get position(): Point {
		return {
			x: this.x,
			y: this.y
		}
	}

	// Alias for position
	get pos(): Point {
		return this.position
	}
}

// export type Point = { x: number, y: number }
// export class Point {
// 	x: number
// 	y: number

// 	constructor(x: number, y: number) {
// 		this.x = x
// 		this.y = y
// 	}
// }
// export function At(x: number, y: number) {
// 	return { x, y }
// }

export type Point = { x: number, y: number }
export type ArrayPoint = [number, number]
export type ParamPoint = Point | ArrayPoint

function isPointObject(obj: any): obj is Point {
	return obj && typeof obj.x === 'number' && typeof obj.y === 'number'
}
function isArrayPoint(obj: any): obj is ArrayPoint {
	return obj && obj.length === 2 && typeof obj[0] === 'number' && typeof obj[1] === 'number'
}

// Point factory
export function getPoint(x: number, y: number): Point
export function getPoint(point: ParamPoint): Point
export function getPoint(xOrPoint: number | ParamPoint, y?: number): Point {
	if (isPointObject(xOrPoint)) {
		return xOrPoint
	}

	if (isArrayPoint(xOrPoint)) {
		return {
			x: xOrPoint[0],
			y: xOrPoint[1]
		}
	}
	
	if (y != null && typeof xOrPoint === 'number' && typeof y === 'number') {
		return { x: xOrPoint, y }
	}

	// Bad params. Error here
	return { x: NaN, y: NaN }
}

export class Vector2 {
	x: number = 0
	y: number = 0

	constructor(x: number, y: number)  // Vector2(25, 50)
	constructor(xyObject: Point)  // Vector2({ x: 25, y: 50 })
	constructor(xOrPoint: number | Point, y?: number) {
		if (isPointObject(xOrPoint)) {
			this.x = xOrPoint.x
			this.y = xOrPoint.y
		}
		else if (typeof xOrPoint === 'number' && y != null) {
			this.x = xOrPoint
			this.y = y
		}
		else {
			// warn? err?
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