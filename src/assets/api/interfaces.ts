/**
 * Interfaces
 */

export type Action = (...args: any[]) => void
export type Predicate = (...args: any[]) => boolean

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
	seconds: number
	duration: number
	fn: Action
}

export interface Screen {
	width: number
	height: number
	topY: number
	bottomY: number
	rightX: number
	leftX: number
}

// export interface Positionable {
// 	// _x: number
// 	// _y: number
// 	x: number
// 	y: number
// 	screenX: number
// 	screenY: number
// 	goTo(x: number, y: number): void
//     _updatePosition(): void
// 	// _updatePosition: Function
// }

// export interface Scalable extends Positionable {
// 	width: number
//     height: number
//     scale: {
//         x: number
//         y: number
//     }
// }

// export interface Rotatable extends Positionable {
// 	rotation: number
// 	radians: number
// 	// pivotX: number
// 	// pivotY: number
// 	// _updateRotation: Function
// }

// export interface Viewable {
// 	alpha: number
// 	visible: boolean
// 	show(): void
// 	hide(): void
// }