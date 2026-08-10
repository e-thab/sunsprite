import type { Point } from "./Point"

/**
 * Interfaces
 */
export type Action = (...args: any[]) => void
export type Predicate = (...args: any[]) => boolean
export type Returnable<T> = T | (() => T)
export type Optional<T> = T | undefined | null
export type Printable = { toString(): string }
export type PointerAction = ((x: number, y: number) => void) | (() => void) | null

export type ReferenceObject = 
	| Phaser.GameObjects.Text
	| Phaser.GameObjects.Line
	| Phaser.GameObjects.Rectangle
	| Phaser.GameObjects.Sprite
	| Phaser.GameObjects.Graphics
	| any // TEMP, 

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

/* Used for repeatWhile() */
export interface RepeatableWhile extends RepeatableUntil {
	lastCheck: boolean
}

/* Used for after() & every() */
export interface Delayable {
	elapsedMs: number
	lifetimeMs: number
	fn: Action
}

/* Used for when() */
export interface Conditional {
	/** Used to record the result of condition() last time it was checked to prevent running continuously while true */
	lastCheck: boolean
	condition: Predicate,
	fn: Action,
}

export interface Screen {
	width: number
	height: number
	top: number
	bottom: number
	left: number
	right: number
	// center: [number, number] // <- at some point, make this required so it can be spread '...center'
	center: Point
}

const keyCodes = [
	'Backquote', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'Minus', 'Equal', 'Backspace',
	'Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'BracketLeft', 'BracketRight', 'Backslash',
	'CapsLock', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Semicolon', 'Quote', 'Enter',
	'ShiftLeft', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'Comma', 'Period', 'Slash', 'ShiftRight',
	'CtrllLeft', 'AltLeft', 'Space', 'AltRight', 'ContextMenu', 'CtrlRight',

	'Insert', 'Home', 'PageUp', 'Delete', 'End', 'PageDown',
	'Up', 'Down', 'Left', 'Right', 'ScrollLock', 'Pause',

	'Numpad0', 'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5', 'Numpad6', 'Numpad7', 'Numpad8', 'Numpad9',
	'NumLock', 'NumpadDivide', 'NumpadMultiply', 'NumpadSubtract', 'NumpadAdd', /*'NumpadEnter',*/ 'NumpadDecimal',

	'Escape', 'Any', 'Shift', 'Ctrl', 'Alt'
] as const

export type InputKey = typeof keyCodes[number]
export type KeyAction = {
	[key in InputKey]?: Action
}

const mouseEvents = [
	'Click', 'Release', 'DoubleClick',
	'LeftClick', 'LeftRelease',
	'RightClick', 'RightRelease',
	'MiddleClick', 'MiddleRelease',
	'Enter', 'Exit',
	'Drag', 'DragStart', 'DragEnd',
	'Scroll', 'Move',
] as const

export type MouseInputEvent = typeof mouseEvents[number]
export type MouseInputAction = {
	[key in MouseInputEvent]?: Action | null
}

// export type MouseHoldEvent = 'LEFT' | 'RIGHT' | 'MIDDLE'
// export type MouseHoldAction = {
// 	[key in MouseHoldEvent]?: Action
// }

export class Mouse {
	_pointer?: Phaser.Input.Pointer
	x: number = 0
	y: number = 0

	constructor(pointer?: Phaser.Input.Pointer) {
		this._pointer = pointer
	}

	_setPointer(pointer: Phaser.Input.Pointer) {
		this._pointer = pointer
	}

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

	get leftButtonDown() {
		return this._pointer?.leftButtonDown()
	}

	get rightButtonDown() {
		return this._pointer?.rightButtonDown()
	}

	get middleButtonDown() {
		return this._pointer?.middleButtonDown()
	}

	get anyButtonDown() {
		return this._pointer?.isDown
	}
}