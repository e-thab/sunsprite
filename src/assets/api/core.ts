import { ref } from 'vue';

import { AUTO, Game, Scene, type Types } from 'phaser';
import Phaser from 'phaser';

import type { Repeatable, Delayable, Screen, RepeatableUntil, Predicate, Action, KeyAction } from './interfaces';
import { Mouse } from './interfaces'
import { atan2, cos, random, sin, tan, deg2rad, rad2deg, clamp } from './utility';
import { type Point, type PointArg, Vector2 } from './Point'

import { Colors } from './Colors';
import Sprite from './Sprite';
import Rectangle from './Rectangle';
import Label from './Label';
import Line from './Line';
import HLine from './HLine';
import VLine from './VLine';
// import Camera from './Camera';  --  needs phaser attention

export const fpsRef = ref(0)
export const mouseRef = ref({mouseX: 0, mouseY: 0})
export const pausedRef = ref(false)

export function pause() {
	paused = true
	pausedRef.value = true
}
export function play() {
	paused = false
	pausedRef.value = false
}

/**
 * API Internal vars
 */
export let allPositionables: { _updatePosition(): void }[] = []
let _frame: number = 0 // current render frame index
let _nextObjectId: number = 0
let _mouseOverCanvas: boolean = false
// let _ticker: Ticker = new Ticker()
let _forevers: Action[] = []
let _repeats: Repeatable[] = []
let _repeatUntils: RepeatableUntil[] = []
let _afters: Delayable[] = []
let _everys: Delayable[] = []

let _keyPressActions: Map<string, Action | undefined> = new Map()
let _keyReleaseActions: Map<string, Action | undefined> = new Map()
let _keyHoldActions: Map<string, Action | undefined> = new Map()

/**
 * API internal methods
 */

// Maybe these will be user-accessible at some point?
export const PointerEvents = {
	// POINTER_DOWN: Phaser.Input.Events.POINTER_DOWN,
	// POINTER_UP: Phaser.Input.Events.POINTER_UP,
	// POINTER_OVER: Phaser.Input.Events.POINTER_OVER,
	// POINTER_OUT: Phaser.Input.Events.POINTER_OUT,
	// GAMEOBJECT_DRAG: Phaser.Input.Events.GAMEOBJECT_DRAG,
	// GAMEOBJECT_DRAG_START: Phaser.Input.Events.GAMEOBJECT_DRAG_START,
	// GAMEOBJECT_DRAG_END: Phaser.Input.Events.GAMEOBJECT_DRAG_END,
	DRAG: 'sunsprite-drag',
	DRAG_END: 'sunsprite-dragend',
	DRAG_START: 'sunsprite-dragstart',
	POINTER_DOWN: 'sunsprite-pointerdown',
	POINTER_DOWN_LEFT: 'sunsprite-pointerdown-left',
	POINTER_DOWN_RIGHT: 'sunsprite-pointerdown-right',
	POINTER_MOVE: 'sunsprite-pointermove',
	POINTER_OUT: 'sunsprite-pointerout',
	POINTER_OVER: 'sunsprite-pointerover',
	POINTER_UP: 'sunsprite-pointerup',
	POINTER_UP_LEFT: 'sunsprite-pointerup-left',
	POINTER_UP_RIGHT: 'sunsprite-pointerup-right',
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
			if (repeatUntil.then) repeatUntil.then(repeatUntil.i)
		} else {
			repeatUntil.fn(repeatUntil.i)
			repeatUntil.i += 1
		}
	}
	_repeatUntils = _repeatUntils.filter(repeatUntil => !repeatUntil.condition())
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
	// _ticker.add((time) => {
	// 	if (paused) return
	// 	fn(time.deltaMS / 1000) // delta: how long since previous frame in seconds
	// })
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

/* Run function {fn} after {seconds} seconds have passed */
export function after(seconds: number, fn: Action) {
	// const milliseconds = seconds * 1000
	// scene.time.delayedCall(milliseconds, () => {
	// 	fn()
	// })
	_afters.push({
		elapsedMs: 0,
		lifetimeMs: seconds * 1000,
		fn
	})
}

/* Run function {fn} once immediately, then every {seconds} seconds */
export function every(seconds: number, fn: Action) {
	// const milliseconds = seconds * 1000
	// scene.time.addEvent({
	// 	delay: milliseconds,
	// 	callback: fn,
	// 	loop: true
	// })
	// fn()
	_everys.push({
		elapsedMs: 0,
		lifetimeMs: seconds * 1000,
		fn
	})
	fn()
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
		const actionKey = inputKey as keyof typeof actions
		_keyPressActions.set(actionKey, action)
	}
}

/* Allows cleaner input key mapping for released key behavior */
export function onKeyRelease(actions: KeyAction) {
	for (const [inputKey, action] of Object.entries(actions)) {
		const actionKey = inputKey as keyof typeof actions
		_keyReleaseActions.set(actionKey, action)
	}
}

/* Allows cleaner input key mapping for held key behavior */
export function onKeyHold(actions: KeyAction) {
	for (const [inputKey, action] of Object.entries(actions)) {
		const actionKey = inputKey as keyof typeof actions
		_keyHoldActions.set(actionKey, action)
	}
}

function clearStage() {
	// app.stage.removeChildren()
}

export function warn() {
	// TODO: warn()
}

export function print(msg: string, bgColor: string | undefined = undefined, textColor: string | undefined = undefined) {
	// TODO: allow other msg types
	// TODO: allow arbitrary number of msg args
	// TODO: count repeated messages instead of showing them all (chrome console style)
    console.log(msg)

	function withLeadingZeroes(num: number, length: number) {
		let strNum = num.toString()

		if (strNum.length >= length) {
			return strNum
		}
		while (strNum.length < length) {
			strNum = '0' + strNum
		}

		return strNum
	}
	
    const item = document.createElement('div')
    item.className = 'output-item'
	
	const msgItem = document.createElement('div')
	msgItem.className = 'output-msg'
	// msgItem.textContent = msg
	msgItem.innerHTML = msg  // Unsafe
	if (bgColor) {
		msgItem.style.backgroundColor = bgColor
	}
	if (textColor) {
		msgItem.style.color = textColor
	}
	
	const stampItem = document.createElement('div')
	stampItem.className = 'output-stamp'

	const time = new Date()
	const hr = withLeadingZeroes(time.getHours(), 2)
	const min = withLeadingZeroes(time.getMinutes(), 2)
	const sec = withLeadingZeroes(time.getSeconds(), 2)
	const milli = withLeadingZeroes(time.getMilliseconds(), 3)
	stampItem.textContent = `${hr}:${min}:${sec}.${milli}`
	
	item.appendChild(stampItem)
	item.appendChild(msgItem)
	
	const panel = document.querySelector('#output-panel')
	if (panel) {
		panel.appendChild(item)
		panel.scrollTop = panel.scrollHeight
	}
}

function clearOutput() {
	const panel = document.querySelector('#output-panel')
	while (panel?.firstChild) {
		panel.removeChild(panel.firstChild)
	}
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
		this.load.image('guy', 'assets/guy.png')
		this.load.image('boot', 'assets/boot.png')
		this.load.image('gator', 'https://woofjs.com/docs/images/river-gator.png')
	}
	
	async create() {
		// TEMP: testing start code
		// const sprite = new Sprite()

		// after(2000, () => print('done'))

		// forever(() => {
		// 	if (keyPressed('W')) sprite.y += 2
		// 	if (keyPressed('A')) sprite.x -= 2
		// 	if (keyPressed('S')) sprite.y -= 2
		// 	if (keyPressed('D')) sprite.x += 2
		// 	if (keyPressed('Q')) sprite.rotation -= 2
		// 	if (keyPressed('E')) sprite.rotation += 2
		// 	if (keyJustPressed('SPACE')) print('space')
		// })
		
		// !! PROBLEM: every and after don't honor pause state when using delayed call method
		console.log('create')
		
		// Set poll always to allow cursors to change when pointer isn't moving
		this.input.setPollAlways()
		this.input.setDefaultCursor('url(cursors/default.cur), default')

		camera = this.cameras.main
		timer.time = 0
		timer.totalTime = 0
		timer.frame = 0
		_frame = 0
		_nextObjectId = 0

		_keyPressActions.clear()
		_keyHoldActions.clear()
		_keyReleaseActions.clear()
		_propUpdaters.clear()
		
		// this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
		// 	pointer.updateWorldPoint(camera) // ..?
		// 	mouse.x = pointer.x - screen.width / 2
		// 	mouse.y = screen.height / 2 - pointer.y 
		// 	mouseRef.value.mouseX = Math.round(mouse.x)
		// 	mouseRef.value.mouseY = Math.round(mouse.y)
		// })

		this.input.on(Phaser.Input.Events.GAME_OUT, (pointer: Phaser.Input.Pointer) => {
			_mouseOverCanvas = false
		})

		this.input.on(Phaser.Input.Events.GAME_OVER, (pointer: Phaser.Input.Pointer) => {
			_mouseOverCanvas = true
		})

		// TODO: Let users listen to these signals directly
		// this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
		// 	if (pointer.leftButtonDown()) {
		// 		scene.events.emit(PointerEvents.POINTER_DOWN_LEFT, pointer)
		// 	}
		// 	if (pointer.rightButtonDown()) {
		// 		scene.events.emit(PointerEvents.POINTER_DOWN_RIGHT, pointer)
		// 	}
		// 	if (pointer.leftButtonReleased()) {
		// 		scene.events.emit(PointerEvents.POINTER_UP_LEFT, pointer)
		// 	}
		// 	if (pointer.rightButtonReleased()) {
		// 		scene.events.emit(PointerEvents.POINTER_UP_RIGHT, pointer)
		// 	}
		// })

		// this.input.on('pointerup', (event: any) => {
		// 	print('up')
		// })

		// TODO
		// this.input.on('pointermove', (event: any) => {
		// 	print('move')
		// })

		// TODO

		// TODO...?
		// this.input.on(Phaser.Input.Events.POINTER_OUT, (event: any) => {
		// 	print('out')
		// })

		// type PositionableObject = Phaser.GameObjects.GameObject & { x: number, y: number }
		// this.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: PositionableObject, dragX: number, dragY: number) => {
		// 	// This needs work; circumvents api game object position setters so that the object
		// 	// visually moves but props don't update
		// 	gameObject.x = dragX;
		// 	gameObject.y = dragY;
		// });
		
		// Is the window listener good enough for key events or should I use phaser's input handling?
		
		// this.input.keyboard?.on('keydown', (event: any) => {
		// 	print(`key press: ${event.key}`)
		// })

		// console.log(this.scale.parent)

		// At the moment, moving camera doesn't actually render the new area; sprites will get sliced
		// in half when up against the previous screen edge

		// I would like to move the API definition into its own file, but it relies on object instances
		// that don't exist at compile time (timer, camera, etc.)... look into this
		const api = {
			Sprite, Rectangle, Label, Line, HLine, VLine, Vector2, /*Point,*/
			Timer: timer, Screen: screen, Camera: camera, Mouse: mouse, Colors,
			forever, repeat, repeatUntil, after, every,
			keyPressed, keyJustPressed, keyJustReleased, onKeyPress, onKeyHold, onKeyRelease,
			print, play, pause, setBackgroundColor,
			Random: random, deg2rad, rad2deg, sin, cos, tan, atan2, clamp,
			sqrt: Math.sqrt,
			min: Math.min,
			max: Math.max,
			floor: Math.floor,
			ceil: Math.ceil,
			round: Math.round,
			PI: Math.PI,
		}
		
		const keys = Object.keys(api)
		const values = Object.values(api)
		
		// Another problem post-phaser: user code errors prevent reloading of the game sometimes?
		try {
			const fn = new Function(
			...keys,
			`
			return (async () => {
				${this.JScode}
			})()
			`
			)
			await fn(...values)
		} catch (err: any) {
			print(err.toString())
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
		if (_mouseOverCanvas) {
			mouse.x = clamp(this.input.activePointer.x - screen.width / 2, screen.left, screen.right)
			mouse.y = clamp(screen.height / 2 - this.input.activePointer.y, screen.bottom, screen.top)
			mouseRef.value.mouseX = Math.round(mouse.x)
			mouseRef.value.mouseY = Math.round(mouse.y)
		}
		
		if (paused) return
		// Maybe switch Timer.time to track time in milliseconds (or different props for timeSec, timeMs, etc)
		timer.time += delta
		timer.frame = _frame++
		
		_runOnKeyActions()
		_runForevers()
		_runRepeats()
		_runAfters(timer.deltaMs)
		_runEverys(timer.deltaMs)
		_runRepeatUntils()

		_runPropUpdaters()
	}
}

// scene = new UserScene()

export async function runUserCode(code: string): Promise<void> {
	clearOutput()
	play()

	_forevers = []
	_repeats = []
	_afters = []
	_everys = []
	_repeatUntils = []
	allPositionables = []
	// camera.goTo(0, 0)
	
	// Switch this to an internal addInput func that can modify innerHTML
	print('<i>Running</i>', undefined, '#626f8b')
	
	//// Pixi stuff

	// 	fpsRef.value = Math.round(app.ticker.FPS)
	// 	FPS = app.ticker.FPS
	// 	_clearKeysJustPressed(_frame)
	// 	// whilePaused loops? or a flag to be able to run standard loops through pause?
		
	// 	if (paused) return // Can pause from loops, but obviously not unpause. Would a workaround be useful?
	// 	Timer.time += delta
	// 	_frame++
	// 	_runRepeats()
	// 	_runAfters(delta)
	// 	_runEverys(delta)
	// 	_runRepeatUntils()
	// })
	
	//// Phaser testing
	// _resetTimeline()
	// 	timeline = game.add.timeline({
	// 	at: 0
	// })

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
		scene
	}

	game = new Game(config)
	resizeStage()

	game.canvas.onclick = () => {
		// Remove focus from code editor when clicking on game canvas
		const activeElement = document.activeElement as HTMLElement
		
		// CodeMirror
		// if (activeElement?.className === 'cm-content') activeElement.blur()

		// Monaco
		if (activeElement?.className === 'native-edit-context') activeElement.blur()
	}
}

const resizeDelay = 5 // milliseconds
export function resizeStage() {
	new Promise(resolve => setTimeout(resolve, resizeDelay)).then(() => _resizeStage())
}

function _resizeStage() {
	const size = game.scale.parentSize
	game.scale.setGameSize(size.width, size.height)
	updatePositions()
}

export function setup() {
	// const gameContainer = document.querySelector('#game-container') as HTMLElement

	// await app.init({
	// 	background: '#222',
	// 	resizeTo: gameContainer, // Dynamically update this on resize
	// 	antialias: true,
	// 	autoDensity: true,
  	// })

	// const eventSystem = app.renderer.events
	// eventSystem.cursorStyles.default = "url('src/assets/images/ui-cursors/small/pointer_c.png') 5 5, auto"
	// eventSystem.cursorStyles.handOpen = "url('src/assets/images/ui-cursors/small/hand_open.png') 15 10, auto"
	// eventSystem.cursorStyles.handClosed = "url('src/assets/images/ui-cursors/small/hand_closed.png') 10 10, auto"
	// eventSystem.cursorStyles.handPoint = "url('src/assets/images/ui-cursors/small/hand_point.png') 10 4, auto"
	// eventSystem.cursorStyles.question = "url('src/assets/images/ui-cursors/small/mark_question_pointer_b.png') 7 4, auto"
	// eventSystem.cursorStyles.cross = "url('src/assets/images/ui-cursors/small/cross_large.png') 16 16, auto"
	// eventSystem.cursorStyles.dot = "url('src/assets/images/ui-cursors/small/dot_large.png') 16 16, auto"
	// const eventSystem = app.renderer.events;
	// eventSystem.cursorStyles.default = () => { defaultIcon };
	// eventSystem.setCursor('default');

	// const el = document.querySelector('#game-container')
	// console.log(el?.clientWidth)
	// app.stage.hitArea = new PixiRect(0, 0, el?.clientWidth, el?.clientHeight)
	// app.stage.cursor = 'custom'

	// app.stage.eventMode = 'dynamic'
	// console.log(app.stage.eventMode)

	const keyAlias = new Map<string, string>([
		[' ', 'space'],
		['ArrowDown', 'down'],
		['ArrowLeft', 'left'],
		['ArrowRight', 'right'],
		['ArrowUp', 'up']
	])

	function apiKeyCode(key: string): string | undefined {
		if (keyAlias.get(key)) {
			return keyAlias.get(key)
		}
		return key.toLowerCase()
	}

	// Key press/release registration
	window.addEventListener('keydown', event => {
		// Don't register press in code editor

		// CodeMirror
		// if (document.activeElement?.ariaPlaceholder) return

		// Monaco
		if (document.activeElement?.ariaRoleDescription === 'editor') { return }

		const key = apiKeyCode(event.key)

		// Add key to keysJustPressed map
		if (key && !keysPressed.includes(key) && !event.repeat) {
			keysPressed.push(key)
			keysJustPressed.set(key, _frame)
		}
	})
	window.addEventListener('keyup', event => {
		// CodeMirror
		// if (document.activeElement?.ariaPlaceholder) return

		// Monaco
		if (document.activeElement?.ariaRoleDescription === 'editor') { return }

		const key = apiKeyCode(event.key)

		// Add key to justReleased map and remove from pressed array
		if (key && keysPressed.includes(key)) {
			// Only add to map if it was being pressed. This prevents potential extra release events
			// if releasing key after window regains focus
			keysJustReleased.set(key, _frame)
			// Remove key from keysPressed array
			keysPressed.splice(keysPressed.indexOf(key), 1)
		}
	})
	window.addEventListener('contextmenu', event => {
		// Prevent opening the context menu from interrupting key registration
		_releaseAllKeys()
	})
	window.addEventListener('blur', event => {
		// Prevent window losing focus from interrupting key registration
		_releaseAllKeys()
	})
	// window.addEventListener('resize', async () => {
	// 	new Promise(resolve => setTimeout(resolve, 100)).then(() => {
	// 		// resizeStage()
	// 		updatePositions()
	// 	})
	// })

	// app.stage.eventMode = 'dynamic'
	// app.stage.on('globalmousemove', event => {
	// 	mouseX = Math.round(event.globalX - app.screen.width / 2)
	// 	mouseY = Math.round(app.screen.height / 2 - event.globalY)
	// 	mouseRef.value = { mouseX, mouseY }
	// })
	// runUserCode(startCode)
}