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

export interface Point {
	x: number
	y: number
}