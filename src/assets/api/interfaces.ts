import type { Point } from "./Point"

/**
 * Interfaces
 */
export type Action = (...args: any[]) => void
export type Predicate = (...args: any[]) => boolean
export type Returnable<T> = T | (() => T)
export type Optional<T> = T | undefined | null

export type PointerAction = ((x: number, y: number) => void) | (() => void)

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
	left: number
	right: number
	// center: [number, number] // <- at some point, make this required so it can be spread '...center'
	center: Point
}

function generateKeyArray() {
	const keyString = '`~1!2@3#4$5%6^7&8*9(0)-_=+QWERTYUIOP[{]}\\|ASDFGHJKL;:\'\"ZXCVBNM,<.>/?'
	const keyArray = keyString.split('')
	keyArray.push('Up', 'Down', 'Left', 'Right', 'Shift', 'Ctrl', 'Alt', 'Tab', 'Esc', 'Enter')

	let count = 0
	let logString = '['
	for (let key of keyArray) {
		let escapeChar = ['\`', '\'', '\\'].includes(key) ? '\\' : ''
		let prefixComma = key === keyString[0] ? '' : ', '

		let genString = `'${escapeChar}${key}', `
		logString += genString
		if ((count += genString.length) > 120) {
			logString += '\n'
			count = 0
		}

		if (key.toLowerCase() !== key) {
			logString += `'${escapeChar}${key.toLowerCase()}', `
			if ((count += genString.length) > 120) {
				logString += '\n'
				count = 0
			}
		}

		if (key.toUpperCase() !== key) {
			logString += `'${escapeChar}${key.toUpperCase()}', `
			if ((count += genString.length) > 120) {
				logString += '\n'
				count = 0
			}
		}
	}
	console.log(logString + ']')
}
// generateKeyArray()

// TODO: Check that all these keys actually register inputs, esp. shift-keys i.e. @, $, etc.
// TODO: Add an 'any' entry that will allow handling any key press
const keys = [
	'\`', '~', '1', '!', '2', '@', '3', '#', '4', '$', '5', '%', '6', '^', '7', '&', '8', '*', '9', '(', '0', ')', '-', '_', 
	'=', '+', 'Q', 'q', 'W', 'w', 'E', 'e', 'R', 'r', 'T', 't', 'Y', 'y', 'U', 'u', 'I', 'i', 'O', 'o', 'P', 'p', '[', '{', ']', 
	'}', '\\', '|', 'A', 'a', 'S', 's', 'D', 'd', 'F', 'f', 'G', 'g', 'H', 'h', 'J', 'j', 'K', 'k', 'L', 'l', ';', ':', '\'', 
	'"', 'Z', 'z', 'X', 'x', 'C', 'c', 'V', 'v', 'B', 'b', 'N', 'n', 'M', 'm', ',', '<', '.', '>', '/', '?', 'Up', 'up', 'UP', 
	'Down', 'down', 'DOWN', 'Left', 'left', 'LEFT', 'Right', 'right', 'RIGHT', 'Shift', 'shift', 'SHIFT', 'Ctrl', 'ctrl', 'CTRL', 
	'Alt', 'alt', 'ALT', 'Tab', 'tab', 'TAB', 'Esc', 'esc', 'ESC', 'Enter', 'enter', 'ENTER'
] as const

export type InputKey = typeof keys[number]
export type KeyAction = {
	[key in InputKey]?: Action
}

const mouseEvents = [
	'CLICK', //'Click', 'click',
	'RELEASE', //'Release', 'release',
	'DOUBLE_CLICK',

	'LEFT_CLICK', //'Left_Click', 'left_click',
	'LEFT_RELEASE', //'Left_Release', 'left_release',

	'RIGHT_CLICK',
	'RIGHT_RELEASE',

	'ENTER',
	'EXIT',

	'DRAG',
	'DRAG_START',
	'DRAG_END',

	'SCROLL',
	'MOVE',
] as const

export type MouseInputEvent = typeof mouseEvents[number]
export type MouseInputAction = {
	[key in MouseInputEvent]?: Action
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