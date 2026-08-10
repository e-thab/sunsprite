import { AUTO, Game, Scene, type Types } from 'phaser'
import Phaser from 'phaser'

import type { Repeatable, Delayable, Screen, Predicate, Action, KeyAction, MouseInputAction, PointerAction, MouseInputEvent, Printable, Conditional, RepeatableUntil, RepeatableWhile } from './types'
import { Mouse } from './types'
import { atan2, cos, random, sin, tan, deg2rad, rad2deg, clamp } from './utility'
import { type Point, type PointArg, Vector2 } from './Point'
import Output from '@/sandbox/output'
import { runEntryModule } from './moduleRunner'

import { Colors } from './Colors'
import Sprite from './Sprite'
import Rectangle from './Rectangle'
import Circle from './Circle'
import Label from './Label'
import Line from './Line'
import HLine from './HLine'
import VLine from './VLine'
import type { ThemePalette } from '../theme/themes'
// import Camera from './Camera';  --  needs phaser attention

// export const outputItems: {
// 	stamps: HTMLElement[],
// 	msgs: HTMLElement[]
// } = {
// 	stamps: [],
// 	msgs: []
// }
// let _printIndex = 0
// const _outputLines = 100

// This module runs inside the sandbox iframe, which has no Vue and no access to
// the editor app's reactivity. State the UI cares about (fps, mouse, paused) is
// read out of here by src/sandbox/main.ts and forwarded to the host as plain
// data; hostBridge.ts turns it back into refs on the app side.

export function pause() {
	paused = true
}
export function play() {
	paused = false
}

/** Current renderer frame rate, or 0 before a game exists. */
export function currentFps(): number {
	return game ? Math.round(game.loop.actualFps) : 0
}

/**
 * API Internal vars
 */
/** All objects that can be positioned on the screen/in the world */
export let allPositionables: { _updatePosition(): void }[] = []

/** A map associating Phaser objects to custom Sunsprite objects */
export const customObjects: Map<Phaser.GameObjects.GameObject, any> = new Map()

let _frame: number = 0 // current render frame index
let _nextObjectId: number = 0
let _lastLeftClickTime: number = 0
let _sessionCount: number = 0
let _forevers: Action[] = []
let _repeats: Repeatable[] = []
let _repeatUntils: RepeatableUntil[] = []
let _repeatWhiles: RepeatableWhile[] = []
let _afters: Delayable[] = []
let _everys: Delayable[] = []
let _whens: Conditional[] = []

let _shiftRepeating: boolean = false
let _ctrlRepeating: boolean = false
let _altRepeating: boolean = false

const _keyPressActions: Map<string, Action> = new Map()
const _keyReleaseActions: Map<string, Action> = new Map()
const _keyHoldActions: Map<string, Action> = new Map()

// TODO
const _mouseInputActions: Map<string, PointerAction> = new Map()
const _mouseHoldActions: Map<string, Action> = new Map()

/**
 * API internal methods
 */

// Maybe these will be user-accessible at some point?
export const PointerEvents = {
	DRAG: 'sunsprite-drag',
	DRAG_END: 'sunsprite-dragend',
	DRAG_START: 'sunsprite-dragstart',
	HOLD_LEFT: 'sunsprite-hold-left',
	HOLD_RIGHT: 'sunsprite-hold-right',
	HOLD_MIDDLE: 'sunsprite-hold-middle',
	POINTER_DOUBLE: 'sunsprite-doubleclick',
	POINTER_DOWN: 'sunsprite-pointerdown',
	POINTER_DOWN_LEFT: 'sunsprite-pointerdown-left',
	POINTER_DOWN_RIGHT: 'sunsprite-pointerdown-right',
	POINTER_DOWN_MIDDLE: 'sunsprite-pointerdown-middle',
	POINTER_MOVE: 'sunsprite-pointermove',
	POINTER_OUT: 'sunsprite-pointerout',
	POINTER_OVER: 'sunsprite-pointerover',
	POINTER_UP: 'sunsprite-pointerup',
	POINTER_UP_LEFT: 'sunsprite-pointerup-left',
	POINTER_UP_RIGHT: 'sunsprite-pointerup-right',
	POINTER_UP_MIDDLE: 'sunsprite-pointerup-middle',
	POINTER_WHEEL: 'sunsprite-pointerwheel',
}

export function getNextObjectId(): string {
	return (_nextObjectId++).toString()
}

export function updatePositions() {
	for (const positionable of allPositionables) {
		positionable._updatePosition()
	}
}

function _runForevers() {
	for (const forever of _forevers) {
		forever(timer.delta)
	}
}

function _runRepeats() {
	for (const repeat of _repeats) {
		repeat.fn(repeat.i)
		repeat.count -= 1
		repeat.i += 1

		if (repeat.count <= 0 && repeat.then) {
			repeat.then()
		}
	}
	_repeats = _repeats.filter(repeat => repeat.count > 0)
}

function _runRepeatUntils() {
	for (const repeatUntil of _repeatUntils) {
		if (repeatUntil.condition()) {
			// Once condition first becomes true, run then() and remove repeatUntil()
			if (repeatUntil.then) repeatUntil.then(repeatUntil.i)
		} else {
			// Run as long as condition is false
			repeatUntil.fn(repeatUntil.i)
			repeatUntil.i += 1
		}
	}
	_repeatUntils = _repeatUntils.filter(repeatUntil => !repeatUntil.condition())
}

function _runRepeatWhiles() {
	for (const repeatWhile of _repeatWhiles) {
		const thisCheck = repeatWhile.condition()
		if (thisCheck) {
			// Run as long as the condition is true
			repeatWhile.fn(repeatWhile.i)
			repeatWhile.i += 1
		} else if (repeatWhile.lastCheck && repeatWhile.then) {
			// Once the condition first becomes false, run then() and reset
			repeatWhile.then(repeatWhile.i)
			repeatWhile.i = 0
		}
		repeatWhile.lastCheck = thisCheck
	}
}

function _runAfters(delta: number) {
	for (const after of _afters) {
		after.elapsedMs += delta
		if (after.elapsedMs >= after.lifetimeMs) {
			after.fn()
		}
	}
	_afters = _afters.filter(after => after.elapsedMs < after.lifetimeMs)
}

function _runEverys(delta: number) {
	for (const every of _everys) {
		every.elapsedMs += delta
		if (every.elapsedMs >= every.lifetimeMs) {
			every.fn()
			every.elapsedMs = 0
		}
	}
}

function _runWhens() {
	for (const when of _whens) {
		const thisCheck = when.condition()
		if (thisCheck && !when.lastCheck) {
			when.fn()
		}
		when.lastCheck = thisCheck
	}
}

function _runOnKeyActions() {
	for (const [key, action] of _keyPressActions) {
		if (action && keyJustPressed(key)) action()
	}

	for (const [key, action] of _keyHoldActions) {
		if (action && keyPressed(key)) action()
	}

	for (const [key, action] of _keyReleaseActions) {
		if (action && keyJustReleased(key)) action()
	}
	 
	const anyPressAction = _keyPressActions.get('any')
	if (keysJustPressed.size > 0 && anyPressAction) {
		anyPressAction()
	} 

	const anyHoldAction = _keyHoldActions.get('any')
	if (keysPressed.length > 0 && anyHoldAction) {
		anyHoldAction()
	} 
}

const _propUpdaters: Map<string, (() => any)> = new Map()

export function _clearPropUpdater(id: string) {
	_propUpdaters.delete(id)
}

export function _registerPropUpdater(id: string, updater: (() => any)) {
	_propUpdaters.set(id, updater)
}

function _runPropUpdaters() {
	for (const [, updater] of _propUpdaters) {
		updater()
	}
}

function _clearKeysJustPressed(frame: number) {
	for (const key of keysJustPressed.keys()) {
		if (keysJustPressed.get(key) !== frame) {
			keysJustPressed.delete(key)
		}
	}
}

function _clearKeysJustReleased(frame: number) {
	for (const key of keysJustReleased.keys()) {
		if (keysJustReleased.get(key) !== frame) {
			keysJustReleased.delete(key)
		}
	}
}

function _releaseAllKeys() {
	for (const key of keysPressed) {
		keysJustReleased.set(key, _frame)
	}
	keysPressed = []
}

/**
 * Key handling entry points for events the *host* observed and forwarded,
 * which is the normal case (the iframe only receives keys directly when the
 * user has clicked the canvas). Assigned by setup(); no-ops until then.
 * `code` is a raw KeyboardEvent.code — aliasing happens inside.
 */
export let handleKeyDown: (code: string) => void = () => {}
export let handleKeyUp: (code: string) => void = () => {}
export function releaseAllKeys() {
	_releaseAllKeys()
}

export function getGamePoint(point: Point): Point {
	return {
		x: point.x - screen.right,
		y: -point.y + screen.top
	}
}

// function _resetTicker() {
// 	_ticker.destroy()
// 	_ticker = new Ticker()
// 	_ticker.start()
// 	_frame = 0
// }

/**
 * User-accessible
 */
// Idea: setScreenSize() ?
export let game: Game
export let scene: Scene
export let camera: Phaser.Cameras.Scene2D.Camera
export const mouse = new Mouse()
export const timer = {
	time: 0, 	  // time since start, does not increment during pause
	totalTime: 0, // time since start including pause time
	delta: 0,	  // time since last frame normalized to 60fps (will usually be around 1)
	deltaMs: 0,   // actual (smoothed) time since last frame
	frame: 0,     // number of frames since start
}
export let paused = false

let keysPressed: string[] = []
let keysJustPressed: Map<string, number | undefined> = new Map()
let keysJustReleased: Map<string, number | undefined> = new Map()

export const screen: Screen = {
	get width(): number {
		return camera.width
	},
	get height(): number {
		return camera.height
	},
	get top(): number {
		return camera.y + this.height / 2
	},
	get bottom(): number {
		return camera.y - this.height / 2
	},
	get left(): number {
		return camera.x - this.width / 2
	},
	get right(): number {
		return camera.x + this.width / 2
	},
	// get center(): [number, number] {
	// 	return [this.width / 2, this.height / 2]
	// }
	get center(): Point {
		return {
			x: this.width / 2,
			y: this.height / 2
		}
	}
}

export function setBackgroundColor(color: string) {
	// Web color name support?
	camera.setBackgroundColor(color)
}

async function setBackgroundImage(src: string) {
	// // if (background) {
	// // 	app.stage.removeChild(background)
	// // }
	// background.texture = await Assets.load(src)
	// background.anchor.set(0.5)
	// background.x = app.screen.width / 2
	// background.y = app.screen.height / 2

	// // Missing a condition? Test narrow images
	// if (app.screen.width > app.screen.height) {
	// 	background.width = app.screen.width
	// } else {
	// 	background.height = app.screen.height
	// }

	// background.zIndex = -Infinity
	// app.stage.addChild(background)
}

function clearBackgroundImage() {

}

async function setCursor(src: string) {
	// Come back to this
	// app.renderer.events.cursorStyles.default = `url(${src}), auto`;
	// const defaultIcon = `url(${src}),auto`;
	// app.renderer.events.cursorStyles.hover = defaultIcon;
}

/* Run function {fn} once every frame */
export function forever(fn: Action) {
	_forevers.push((delta: number) => {
		if (paused) return
		fn(delta)
	})
}

/* Run function {fn} {times} number of times */
export function repeat(times: number, fn: Action) {
	const repeatable: Repeatable = {
		count: times,
		i: 0,
		fn,
		// then: undefined
	}
	_repeats.push(repeatable)

	return {
		then(thenFn: Action) {
			repeatable.then = thenFn
		}
	}
}

export function repeatUntil(condition: Predicate, fn: Action) {
	const repeatableUntil: RepeatableUntil = {
		condition,
		fn,
		i: 0,
	}
	_repeatUntils.push(repeatableUntil)

	return {
		then(thenFn: Action) {
			repeatableUntil.then = thenFn
		}
	}
}

export function repeatWhile(condition: Predicate, fn: Action) {
	const repeatableWhile: RepeatableWhile = {
		condition,
		fn,
		lastCheck: condition(),
		i: 0,
	}
	_repeatWhiles.push(repeatableWhile)

	return {
		then(thenFn: Action) {
			repeatableWhile.then = thenFn
		}
	}
}

/* Run function {fn} after {seconds} seconds have passed */
export function after(seconds: number, fn: Action) {
	_afters.push({
		elapsedMs: 0,
		lifetimeMs: seconds * 1000,
		fn
	})
}

/* Run function {fn} once immediately, then every {seconds} seconds */
export function every(seconds: number, fn: Action) {
	_everys.push({
		elapsedMs: 0,
		lifetimeMs: seconds * 1000,
		fn
	})
	fn()
}

/* Run function {fn} once each time {condition} becomes true */
export function when(condition: Predicate, fn: Action) {
	// TODO: A way to signal that this entry should be removed after the first time it becomes true
	_whens.push({
		lastCheck: condition(),
		condition,
		fn
	})
}

/* True every frame while button is down */
export function keyPressed(key: string): boolean {
	return keysPressed.includes(key.toLowerCase())
}

/* True only during the frame after key press */
export function keyJustPressed(key: string): boolean {
	return keysJustPressed.get(key.toLowerCase()) !== undefined
}

/* True only during the frame after key release */
export function keyJustReleased(key: string): boolean {
	return keysJustReleased.get(key.toLowerCase()) !== undefined
}

/* Allows cleaner input key mapping for pressed key behavior */
export function onKeyPress(actions: KeyAction) {
	for (const [inputKey, action] of Object.entries(actions)) {
		// const actionKey = inputKey as keyof typeof actions
		_keyPressActions.set(inputKey.toLowerCase(), action)
	}
}

/* Allows cleaner input key mapping for released key behavior */
export function onKeyRelease(actions: KeyAction) {
	for (const [inputKey, action] of Object.entries(actions)) {
		// const actionKey = inputKey as keyof typeof actions
		_keyReleaseActions.set(inputKey.toLowerCase(), action)
	}
}

/* Allows cleaner input key mapping for held key behavior */
export function onKeyHold(actions: KeyAction) {
	for (const [inputKey, action] of Object.entries(actions)) {
		// const actionKey = inputKey as keyof typeof actions
		_keyHoldActions.set(inputKey.toLowerCase(), action)
	}
}

/** TODO */
function onMouse(actions: MouseInputAction) {
	for (const [button, action] of Object.entries(actions)) {
		const eventName = mouseInputEventNames[button]
		if (eventName) _registerMouseInputAction(eventName, action)
	}
}

/** TODO */
function onMouseHold(actions: MouseHoldAction) {
	for (const [button, action] of Object.entries(actions)) {
		// const actionButton = button as keyof typeof actions
		// _keyPressActions.set(button, action)
	}
}

const mouseInputEventNames: { [key: string]: string } = {
	Click: PointerEvents.POINTER_DOWN,
	DoubleClick: PointerEvents.POINTER_DOUBLE,
	Enter: PointerEvents.POINTER_OVER,
	Exit: PointerEvents.POINTER_OUT,
	LeftClick: PointerEvents.POINTER_DOWN_LEFT,
	LeftRelease: PointerEvents.POINTER_UP_LEFT,
	MiddleClick: PointerEvents.POINTER_DOWN_MIDDLE,
	MiddleRelease: PointerEvents.POINTER_UP_MIDDLE,
	Move: PointerEvents.POINTER_MOVE,
	Release: PointerEvents.POINTER_UP,
	RightClick: PointerEvents.POINTER_DOWN_RIGHT,
	RightRelease: PointerEvents.POINTER_UP_RIGHT,
	Scroll: PointerEvents.POINTER_WHEEL
}

// TODO: mouse hold events
const mouseHoldEventNames: { [key: string]: string } = {
	Right: PointerEvents.POINTER_DOWN_RIGHT,
	Middle: PointerEvents.POINTER_DOWN_MIDDLE,
	Left: PointerEvents.HOLD_LEFT,
}

// TODO: Are these useful anymore?
type MouseHoldEvent = 'Left' | 'Right' | 'Middle'
type MouseHoldAction = { [key in MouseHoldEvent]?: Action }

function _registerMouseInputAction(eventName: string, action?: PointerAction) {
	if (_mouseInputActions.get(eventName)) {
		// Coalesce in case action entry is null but not undefined
		scene.input.off(eventName, _mouseInputActions.get(eventName) ?? undefined)
	}

	if (action) {
		_mouseInputActions.set(eventName, action)
		scene.input.on(eventName, action)
	} else {
		_mouseInputActions.delete(eventName)
	}
}

function _registerMouseHoldAction(eventName: string, action?: PointerAction) {
	if (_mouseHoldActions.get(eventName)) {
		scene.input.off(eventName, _mouseHoldActions.get(eventName))
	}

	if (action) {
		_mouseHoldActions.set(eventName, action)
		scene.input.on(eventName, action)
	} else {
		_mouseHoldActions.delete(eventName)
	}
}

function clearStage() {
	// app.stage.removeChildren()
}

export function log(...args: any[]) {
	console.log(args)
}

function mouseOverCanvas() {
	return game.canvas.matches(':hover')
}

/**
 * API utility
 */
class UserScene extends Scene {
	JScode: string
	guy?: Phaser.GameObjects.Sprite

	constructor(JScode: string) {
		super('main')
		this.JScode = JScode
		scene = this
	}
	
	preload() {
		console.log('preload')
		// this.load.image('guy', 'assets/guy.png')
		// this.load.image('boot', 'assets/boot.png')
		// this.load.image('gator', 'https://woofjs.com/docs/images/river-gator.png')
	}
	
	async create() {
		// !! PROBLEM: every and after don't honor pause state when using delayed call method
		console.log('create')

		mouse._setPointer(this.input.activePointer)
		camera = this.cameras.main

		// Set poll always to allow cursors to change when pointer isn't moving
		this.input.setPollAlways()
		this.input.setDefaultCursor('url(cursors/default.cur), default')

		/* 
		 * Capturing Phaser pointer events
		 */
		// Canvas pointer down events
		this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[]) => {
			if (pointer.leftButtonDown()) {
				this.input.emit(PointerEvents.POINTER_DOWN_LEFT, mouse.x, mouse.y)
				
				// Double click if it's been <= 500 ms since last left click
				if (Date.now() - _lastLeftClickTime <= 500) {
					this.input.emit(PointerEvents.POINTER_DOUBLE, mouse.x, mouse.y)
					// Reset last click time so that three quick clicks don't count as single-double-double.
					// So two consecutive *double* clicks requires 4 individual clicks.
					_lastLeftClickTime = 0
				} else {
					_lastLeftClickTime = Date.now()
				}
			}

			if (pointer.rightButtonDown()) {
				this.input.emit(PointerEvents.POINTER_DOWN_RIGHT, mouse.x, mouse.y)
			}

			if (pointer.middleButtonDown()) {
				this.input.emit(PointerEvents.POINTER_DOWN_MIDDLE, mouse.x, mouse.y)
			}

			this.input.emit(PointerEvents.POINTER_DOWN, mouse.x, mouse.y)
		})

		// Canvas pointer up events
		this.input.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer, ...rest: any[]) => {
			if (pointer.leftButtonReleased()) {
				this.input.emit(PointerEvents.POINTER_UP_LEFT, mouse.x, mouse.y)
			}

			if (pointer.rightButtonReleased()) {
				this.input.emit(PointerEvents.POINTER_UP_RIGHT, mouse.x, mouse.y)
			}

			if (pointer.middleButtonReleased()) {
				this.input.emit(PointerEvents.POINTER_UP_MIDDLE, mouse.x, mouse.y)
			}

			this.input.emit(PointerEvents.POINTER_UP, mouse.x, mouse.y)
		})
		
		// Canvas pointer exit event
		this.input.on(Phaser.Input.Events.GAME_OUT, (pointer: Phaser.Input.Pointer) => {
			// _mouseOverCanvas = false
			this.input.emit(PointerEvents.POINTER_OUT, mouse.x, mouse.y)
		})
		
		// Canvas pointer enter event
		this.input.on(Phaser.Input.Events.GAME_OVER, (pointer: Phaser.Input.Pointer) => {
			// _mouseOverCanvas = true
			this.input.emit(PointerEvents.POINTER_OVER, mouse.x, mouse.y)
		})

		// Canvas scroll event
		this.input.on(Phaser.Input.Events.POINTER_WHEEL, (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[], deltaX: number, deltaY: number, ...rest: any[]) => {
			this.input.emit(PointerEvents.POINTER_WHEEL, deltaX, -deltaY)
		})

		// Canvas pointer move event
		this.input.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer, ...rest: any[]) => {
			this.input.emit(PointerEvents.POINTER_MOVE, mouse.x, mouse.y)
		})

		// At the moment, moving camera doesn't actually render the new area; sprites will get sliced
		// in half when up against the previous screen edge

		// I would like to move the API definition into its own file, but it relies on object instances
		// that don't exist at compile time (timer, camera, etc.)... look into this
		const api = {
			Sprite, Rectangle, Circle, Label, Line, HLine, VLine, Vector2, /*Point,*/
			Timer: timer, Screen: screen, Camera: camera, Mouse: mouse, Colors,
			forever, repeat, repeatUntil, repeatWhile, after, every, when,
			keyPressed, keysPressed, keyJustPressed, keyJustReleased, onKeyPress, onKeyHold, onKeyRelease, onMouse,
			print: Output.print, warn: Output.warn, error: Output.error, play, pause, setBackgroundColor,
			Random: random, deg2rad, rad2deg, sin, cos, tan, atan2, clamp,
			sqrt: Math.sqrt,
			min: Math.min,
			max: Math.max,
			floor: Math.floor,
			ceil: Math.ceil,
			round: Math.round,
			PI: Math.PI,
		}

		// Trying some ways to get error line/col within user script from stack trace
		// function tryCompileDynamicCode(codeBody) {
		// 	try {
		// 		// If syntax is perfect, this compiles smoothly
		// 		return new Function(this.JScode);
		// 	} catch (syntaxError) {
		// 		if (syntaxError instanceof SyntaxError) {
		// 		console.error("❌ Construction Syntax Error caught!");
				
		// 		// Some engines provide the raw offset line directly inside syntaxError.lineNumber
		// 		// If missing, we read the error stack line or fall back to checking line-by-line
		// 		console.error(`Message: ${syntaxError.message}`);
		// 		console.error(`Stack trace details:\n`, syntaxError.stack);
		// 		}
		// 		throw syntaxError;
		// 	}
		// }

		// // Example: Missing closing parenthesis on line 2
		// tryCompileDynamicCode(`
		// 	console.log("Starting..." 
		// 	const val = 100;
		// `);

		// const fn = new Function(
		// 	...keys,
		// 	`
		// 	return async function userScript() {
		// 		// try {
		// 			${this.JScode}
		// 		// } catch (e) {
		// 		// 	// console.log(e.stack)
		// 		// 	throw new Error(e.message)
		// 		// }
		// 	}
		// 	`
		// )
		
		// const factory = new Function(codeString)
		// const run = fn(...values)
		
		// Another problem post-phaser: user code errors prevent reloading of the game sometimes?
		try {
			await runEntryModule(this.JScode, api)
		} catch (e: any) {
			const err = (e as Error)
			Output.error(err.toString())
			console.error('User code error:', err)
		}
	}
	
	update(time: number, delta: number) {
		// onUpdate()
		// console.log(delta)
		const deltaNormal = delta * 0.06

		timer.delta = deltaNormal
		timer.deltaMs = delta
		timer.totalTime += delta
		
		_clearKeysJustPressed(_frame)
		_clearKeysJustReleased(_frame)

		// Only update mouse pos while mouse is over canvas, otherwise clicking code editor updates
		if (mouseOverCanvas()) {
			mouse.x = clamp(this.input.activePointer.x - screen.width / 2, screen.left, screen.right)
			mouse.y = clamp(screen.height / 2 - this.input.activePointer.y, screen.bottom, screen.top)
		}
		
		if (paused) return
		timer.time += delta
		timer.frame = _frame++
		
		_runOnKeyActions()
		_runForevers()
		_runRepeats()
		_runRepeatUntils()
		_runRepeatWhiles()
		_runAfters(timer.deltaMs)
		_runEverys(timer.deltaMs)
		_runWhens()

		_runPropUpdaters()
	}
}

export async function runUserCode(code: string, theme?: ThemePalette): Promise<void> {
	Output.clear()

	if (_sessionCount > 0) console.groupEnd()
	// Be cool to print the group header in the theme primary color, but can't use the theme store here
	// console.group(`%cSunsprite session ${++_sessionCount}`, `color: ${theme?.primary ?? 'white'}; font-weight: bold;`)
	console.group(`%cSunsprite session ${++_sessionCount}`, `color: ${Colors.HotPink}; font-weight: bold;`)

	_forevers = []
	_repeats = []
	_repeatUntils = []
	_repeatWhiles = []
	_afters = []
	_everys = []
	_whens = []
	allPositionables = []

	_keyPressActions.clear()
	_keyHoldActions.clear()
	_keyReleaseActions.clear()
	_mouseInputActions.clear()
	_mouseHoldActions.clear()
	_propUpdaters.clear()
	// camera.goTo(0, 0)

	timer.time = 0
	timer.totalTime = 0
	timer.frame = 0
	_frame = 0
	_nextObjectId = 0
	_lastLeftClickTime = 0
	
	Output.printStartMsg()
	play()

	// whilePaused loops? or a flag to be able to run standard loops through pause?
	
	if (game) game.destroy(true)

	scene = new UserScene(code)

	let config: Types.Core.GameConfig = {
		type: AUTO,
		scale: {
			// mode: Phaser.Scale.RESIZE
			mode: Phaser.Scale.NONE
		},
		parent: 'game-container',
		// backgroundColor: '#333',
		// Every image is cross-origin from in here: the sandbox document has an
		// opaque origin, so even same-server /images/* is "another origin" to it.
		// Without requesting them CORS-clean the WebGL renderer refuses to upload
		// them as textures. Requires the image host to send ACAO (GitHub Pages and
		// the Vite dev server both do — see vite.config.ts).
		//
		// The non-obvious half of this is user-uploaded art on cdn.sunsprite.dev:
		// because the origin here is opaque, those requests carry `Origin: null`,
		// which no named allowlist entry can ever match (and which R2 rejects as an
		// AllowedOrigins value — it validates as scheme://host[:port]). The R2
		// bucket policy therefore needs a *separate*, read-only rule granting GET to
		// "*", kept after the narrower rule that grants GET+PUT to the app's real
		// origins — first match wins, and the browser upload in fileStore.uploadImage
		// PUTs straight to R2, so a wildcard rule ordered ahead of it would break
		// uploads. Narrowing that "*" back down to named origins is only possible if
		// the sandbox is ever moved to a real origin of its own (a subdomain plus
		// `allow-same-origin`); as long as it stays opaque, "*" is the only thing
		// `Origin: null` matches.
		loader: {
			crossOrigin: 'anonymous'
		},
		scene
	}

	game = new Game(config)
	resizeStage()

	// The old canvas-click handler that blurred Monaco is gone: clicking the
	// canvas now moves focus into the sandbox iframe, which blurs the editor
	// natively.
}

const resizeDelay = 5 // milliseconds
export function resizeStage() {
	new Promise(resolve => setTimeout(resolve, resizeDelay)).then(() => _resizeStage())
}

function _resizeStage() {
	// The container's ResizeObserver fires as soon as it starts observing,
	// which is well before the first run creates a game.
	if (!game) return

	const size = game.scale.parentSize
	game.scale.setGameSize(size.width, size.height)
	updatePositions()
}

export function setup() {
	// TODO: Add 'group' codes like Shift that allows detecting either left or right shift
	// TODO: Pass a way to detect modifier keys as action param(s)
	const keyAlias: { [key: string]: string } = {
		// Rename for simplicity
		Digit0: '0', Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', Digit5: '5', Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9',
		KeyQ: 'Q', KeyW: 'W', KeyE: 'E', KeyR: 'R', KeyT: 'T', KeyY: 'Y', KeyU: 'U', KeyI: 'I', KeyO: 'O', KeyP: 'P',
		KeyA: 'A', KeyS: 'S', KeyD: 'D', KeyF: 'F', KeyG: 'G', KeyH: 'H', KeyJ: 'J', KeyK: 'K', KeyL: 'L',
		KeyZ: 'Z', KeyX: 'X', KeyC: 'C', KeyV: 'V', KeyB: 'B', KeyN: 'N', KeyM: 'M',
		ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right', ArrowUp: 'Up',
		ControlLeft: 'CtrlLeft', ControlRight: 'CtrlRight', Control: 'Ctrl'
		// Rename to consolidate 
		// ShiftLeft: 'Shift', ShiftRight: 'Shift',
		// ControlLeft: 'Ctrl', ControlRight: 'Ctrl',
		// AltLeft: 'Alt', AltRight: 'Alt',
		// NumpadEnter: 'Enter'
	}

	function apiKeyCode(keyCode: string): string | undefined {
		return (keyAlias[keyCode] ?? keyCode).toLowerCase()
	}

	// A keyboard event is delivered to exactly one document, so these two
	// sources are mutually exclusive and can't double-fire:
	//   - the listeners below, when the sandbox iframe itself has focus
	//     (i.e. the user clicked the game canvas), and
	//   - 'key' messages forwarded by the host, when it has focus instead.
	// The host is what decides whether a key belongs to the game or to Monaco,
	// since only it can see the editor.
	function onKeyDown(rawCode: string) {
		// Left/right shift can't really be separated the way I was originally thinking, because
		// the keyup event doesn't trigger if one shift is released while the other is still held.
		// Left/right shift should be consolidated into one code, just Shift. In order to reduce
		// confusion I think the same should be done for Ctrl/Alt.
		// Addend: Enter & NumpadEnter work the same way and will also be consolidated.
		// Addend.2: Shift behavior is normal on Linux, but Enter still does this?
		// Addend.3: Can't do further testing now on my laptop, kinda thinking I should remove
		// Ctrl/Alt/Shift as action keys altogether and just let users check event.shiftKey etc.
		
		// pass a key object containing:
		// event.altKey
		// event.ctrlKey
		// event.shiftKey
		// event.key?

		const keyCode = apiKeyCode(rawCode)

		// Add specific key to keysJustPressed map
		if (keyCode && !keysPressed.includes(keyCode)) {
			keysPressed.push(keyCode)
			keysJustPressed.set(keyCode, _frame)
			
			if ((keyCode === 'shiftleft' || keyCode === 'shiftright') && !keysPressed.includes('shift')) {
				keysPressed.push('shift')
				keysJustPressed.set('shift', _frame)
			}

			else if ((keyCode === 'ctrlleft' || keyCode === 'ctrlright') && !keysPressed.includes('ctrl')) {
				keysPressed.push('ctrl')
				keysJustPressed.set('ctrl', _frame)
			}

			else if ((keyCode === 'altleft' || keyCode === 'altright') && keysPressed.includes('alt')) {
				keysPressed.push('alt')
				keysJustPressed.set('alt', _frame)
			}
		}
	}

	function onKeyUp(rawCode: string) {
		const keyCode = apiKeyCode(rawCode)

		// Add key to justReleased map and remove from pressed array
		if (keyCode && keysPressed.includes(keyCode)) {
			// Remove key from keysPressed array
			keysPressed.splice(keysPressed.indexOf(keyCode), 1)
			// Only add to map if it was being pressed. This prevents potential extra release events
			// if releasing key after window regains focus
			keysJustReleased.set(keyCode, _frame)

			if ((keyCode === 'shiftleft' || keyCode === 'shiftright') && !keyPressed('shiftleft') && !keyPressed('shiftright')) {
				// console.log('clear shift')
				keysPressed.splice(keysPressed.indexOf('shift'), 1)
				keysJustReleased.set('shift', _frame)
			}

			if ((keyCode === 'ctrlleft' || keyCode === 'ctrlright') && !keyPressed('ctrlleft') && !keyPressed('ctrlright')) {
				// console.log('clear ctrl')
				keysPressed.splice(keysPressed.indexOf('ctrl'), 1)
				keysJustReleased.set('ctrl', _frame)
			}

			if ((keyCode === 'altleft' || keyCode === 'altright') && !keyPressed('altleft') && !keyPressed('altright')) {
				// console.log('clear alt')
				keysPressed.splice(keysPressed.indexOf('alt'), 1)
				keysJustReleased.set('alt', _frame)
			}
		}
	}

	// Exposed so src/sandbox/main.ts can drive the same state machine from the
	// key events the host forwards while it, rather than the iframe, has focus.
	handleKeyDown = onKeyDown
	handleKeyUp = onKeyUp

	// Events seen while the sandbox iframe itself has focus.
	window.addEventListener('keydown', event => onKeyDown(event.code))
	window.addEventListener('keyup', event => onKeyUp(event.code))
	window.addEventListener('contextmenu', () => {
		// Prevent opening the context menu from holding down pressed keys
		// Note: this probably doesn't matter since context menu events were disabled
		// on the game canvas, but I'll leave it here for now.
		_releaseAllKeys()
	})
	window.addEventListener('blur', () => {
		// Prevent window losing focus from holding down pressed keys
		_releaseAllKeys()
	})
	// window.addEventListener('resize', async () => {
	// 	new Promise(resolve => setTimeout(resolve, 100)).then(() => {
	// 		// resizeStage()
	// 		updatePositions()
	// 	})
	// })
	
	// window.addEventListener('error', (errorEvent) => {
	// 	console.log(errorEvent)

	// 	const { lineno, colno } = errorEvent;
	// 	console.log(`Error thrown at: ${lineno}:${colno}`);

	// 	errorEvent.preventDefault()
	// })

	// app.stage.eventMode = 'dynamic'
	// app.stage.on('globalmousemove', event => {
	// 	mouseX = Math.round(event.globalX - app.screen.width / 2)
	// 	mouseY = Math.round(app.screen.height / 2 - event.globalY)
	// 	mouseRef.value = { mouseX, mouseY }
	// })
	// runUserCode(startCode)
}