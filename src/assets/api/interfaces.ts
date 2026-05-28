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
export class Point {
	x: number
	y: number

	constructor(x: number, y: number) {
		this.x = x
		this.y = y
	}
}
// export function At(x: number, y: number) {
// 	return { x, y }
// }

// type ObjectPoint = { x: number, y: number }
// type ArrayPoint = [number, number]
// function isArrayPoint(obj: any): obj is ArrayPoint {
// 	return obj && obj.length === 2 && typeof obj[0] === 'number' && typeof obj[1] === 'number'
// }

function isObjectPoint(obj: any): obj is Point {
	return obj && typeof obj.x === 'number' && typeof obj.y === 'number'
}

export class Vector2 {
	x: number = 0
	y: number = 0

	constructor(x: number, y: number)  // Vector2(25, 50)
	constructor(xyObject: Point)  // Vector2({ x: 25, y: 50 })
	constructor(xOrPoint: number | Point, y?: number) {
		if (isObjectPoint(xOrPoint)) {
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

	static ZERO() {
		return new Vector2(0, 0)
	}

	static ONE() {
		return new Vector2(1, 1)
	}
}