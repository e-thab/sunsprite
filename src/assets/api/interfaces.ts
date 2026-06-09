import { Point } from "./Point"

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

const keys = [
	'\`', '~', '1', '!', '2', '@', '3', '#', '4', '$', '5', '%', '6', '^', '7', '&', '8', '*', '9', '(', '0', ')', '-', '_', 
	'=', '+', 'Q', 'q', 'W', 'w', 'E', 'e', 'R', 'r', 'T', 't', 'Y', 'y', 'U', 'u', 'I', 'i', 'O', 'o', 'P', 'p', '[', '{', ']', 
	'}', '\\', '|', 'A', 'a', 'S', 's', 'D', 'd', 'F', 'f', 'G', 'g', 'H', 'h', 'J', 'j', 'K', 'k', 'L', 'l', ';', ':', '\'', 
	'"', 'Z', 'z', 'X', 'x', 'C', 'c', 'V', 'v', 'B', 'b', 'N', 'n', 'M', 'm', ',', '<', '.', '>', '/', '?', 'Up', 'up', 'UP', 
	'Down', 'down', 'DOWN', 'Left', 'left', 'LEFT', 'Right', 'right', 'RIGHT', 'Shift', 'shift', 'SHIFT', 'Ctrl', 'ctrl', 'CTRL', 
	'Alt', 'alt', 'ALT', 'Tab', 'tab', 'TAB', 'Esc', 'esc', 'ESC', 'Enter', 'enter', 'ENTER'
] as const
type InputKey = typeof keys[number]

export type KeyAction = {
	[key in InputKey]?: Action
}

const t: KeyAction = {
	A: () => {},
	a: () => {},
	B: () => {},
	s: () => {}
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