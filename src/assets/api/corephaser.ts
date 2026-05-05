import { ref } from 'vue';
import { atan2, cos, random, sin, sqrt, startCode, tan, deg2rad, rad2deg, clamp, max, min, randomX, randomY, randomPosition, randomFloat } from './utility';
import { AUTO, Game, Scene, type Types } from 'phaser';
import type { Repeatable, Delayable, Screen, RepeatableUntil, Predicate, Action } from './interfaces';

import Camera from './Camera';
import Sprite from './Sprite';
import Rectangle from './Rectangle';
import Text from './Text';

export function resizeStage() {
	// app.resize()
	updateSpritePositions()
}

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
 * API internal methods
 */
export function updateSpritePositions() {
	for (const positionable of allPositionables) {
		positionable._updatePosition()
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
		after.duration += delta
		if (after.duration >= after.seconds) {
			after.fn()
		}
	}
	_afters = _afters.filter(after => after.duration < after.seconds)
}

function _runEverys(delta: number) {
	for (const every of _everys) {
		every.duration += delta
		if (every.duration >= every.seconds) {
			every.fn()
			every.duration = 0
		}
	}
}

function _clearKeysJustPressed(frame: number) {
	for (const key of keysJustPressed.keys()) {
		if (keysJustPressed.get(key) !== frame) {
			keysJustPressed.set(key, undefined)
		}
	}
}

// function _resetTicker() {
// 	_ticker.destroy()
// 	_ticker = new Ticker()
// 	_ticker.start()
// 	_frame = 0
// }

/**
 * API Internal vars
 */
// type Key = 'Escape' | ''
// export let allPositionables: typeof Positionable[] = []
export let allPositionables: { _updatePosition(): void }[] = []
let _frame: number = 0 // current render frame index
// let _ticker: Ticker = new Ticker()
let _repeats: Array<Repeatable> = []
let _repeatUntils: Array<RepeatableUntil> = []
let _afters: Array<Delayable> = []
let _everys: Array<Delayable> = []

/**
 * User-accessible
 */
// Idea: setScreenSize()
// export const app: Application = new Application()
export let game: Game
export const camera = new Camera()
export const Timer = {
	time: 0, // time since start, does not increment during pause
	realTime: 0, // time since start including pause time
	delta: 0 // time since last frame
}
export let mouseX = 0
export let mouseY = 0
export let FPS = 0
export let paused = false
// export const PI: number = 3.141592653589793
// let background = new PixiSprite()

let keysPressed: Array<string> = []
let keysJustPressed: Map<string, number | undefined> = new Map()
export const screen: Screen = {
	get width(): number {
		return game.canvas.width
		// return app.screen.width
	},
	get height(): number {
		return game.canvas.height
		// return app.screen.height
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
	}
}

function setBackgroundColor(color: string /*Color*/) {
	// app.renderer.background.color = color
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
function forever(fn: Function) {
	// _ticker.add((time) => {
	// 	if (paused) return
	// 	fn(time.deltaMS / 1000) // delta: how long since previous frame in seconds
	// })
}

/* Run function {fn} {times} number of times */
function repeat(times: number, fn: () => void) {
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
/* Alternate syntax: 'then' as another argument (like WoofJS) */
// function repeat(times: number, fn: Function, then?: Function) {
// 	_repeats.push({
// 		count: times,
// 		i: 0,
// 		fn: fn,
// 		then: then ?? undefined
// 	})
// }

function repeatUntil(condition: Predicate, fn: Action) {
	const repeatableUntil: RepeatableUntil = {
		condition,
		fn,
		i: 0,
		// then: undefined
	}
	_repeatUntils.push(repeatableUntil)

	return {
		then(thenFn: Action) {
			repeatableUntil.then = thenFn
		}
	}
}

/* Run function {fn} after {seconds} seconds have passed */
function after(seconds: number, fn: Action) {
	_afters.push({
		duration: 0,
		seconds,
		fn
	})
}

/* Run function {fn} once immediately, then every {seconds} seconds */
function every(seconds: number, fn: Action) {
	fn()
	_everys.push({
		duration: 0,
		seconds,
		fn
	})
}

/* True every frame while button is down */
function keyPressed(key: string): boolean {
	return keysPressed.includes(key.toLowerCase())
}

/* True only during the frame after key press */
function keyJustPressed(key: string): boolean {
	return keysJustPressed.get(key.toLowerCase()) !== undefined
}

function clearStage() {
	// app.stage.removeChildren()
}

export function warn() {
	// TODO
}

export function print(msg: string, bgColor: string | undefined = undefined, textColor: string | undefined = undefined) {
	// TODO: count repeated messages instead of showing them all (chrome console style)
	// TODO: allow arbitrary number of msg args
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

// function onKeyDown(key: string, fn: Function) {
// 	window.addEventListener('keydown', )
// }

/**
 * API utility
 */
let _create = () => {}
let _update = () => {}

export async function runUserCode(code: string): Promise<void> {
	// BUG: doesn't reset bg color
	// const keys = Object.keys(api)
    // const values = Object.values(api)
	clearOutput()
	clearStage()
	play()
	_repeats = []
	_afters = []
	_everys = []
	_repeatUntils = []
	allPositionables = []
	camera.goTo(0, 0)
	Timer.time = 0
	Timer.realTime = 0

	// Switch this to an internal addInput func that can modify innerHTML
	print('<i>Running</i>', undefined, '#626f8b')
	
	//// Pixi stuff
	// _resetTicker()
	// _ticker.add(time => {
		// 	const delta = time.deltaMS / 1000
		// 	Timer.delta = delta
		// 	Timer.realTime += delta
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
	// 	// resizeStage() // -necessary?
	// })
	
	//// Phaser testing
	// _resetTimeline()
	// timeline = game.add.timeline({
	// 	at: 0
	// })
	
	// Maybe make a new Game instance here, providing user code as a
	// constructor arg that builds the function to be run in create()
	scene.preload()
	scene.create()

	const keys = [ 'randomFloat', 'deg2rad', 'rad2deg', 'game',  'PI', 'sin', 'cos', 'tan', 'atan2', 'sqrt', 'random', 'Timer', 'screen', 'camera', 'Sprite', 'Rectangle', 'Text', 'setBackgroundColor', 'setCursor', 'forever', 'repeat', 'repeatUntil', 'after', 'every', 'clearStage', 'keyPressed', 'keyJustPressed', 'print', 'pause', 'play', 'paused', 'min', 'max', 'clamp', 'randomX', 'randomY', 'randomPosition', 'setBackgroundImage' ]
	const values = [randomFloat,   deg2rad,   rad2deg,   game, Math.PI, sin,   cos,   tan,   atan2,   sqrt,   random,   Timer,   screen,   camera,   Sprite,   Rectangle,   Text,   setBackgroundColor,   setCursor,   forever,   repeat,   repeatUntil,   after,   every,   clearStage,   keyPressed,   keyJustPressed,   print,   pause,   play,   paused,   min,   max,   clamp,   randomX,   randomY,   randomPosition,   setBackgroundImage ]
	
	try {
		const fn = new Function(
		...keys,
		`
		return (async () => {
			${code}
		})()
		`
		)
		await fn(...values)
	} catch (err) {
		console.error('User code error:', err)
	}
}

class UserScene extends Scene {
	constructor() {
		super('Game')
	}

	preload() {
		console.log('preload')
		this.load.image('guy', 'assets/guy.png')
	}

	create() {
		console.log('create')
		this.add.image(0, 0, 'guy')
		// _create()
	}

	update() {
		// _update()
	}
}
let scene = new UserScene()
const config: Types.Core.GameConfig = {
	type: AUTO,
	// width: 800,
	// height: 600,
	parent: 'canvas-v-pane',
	backgroundColor: '#222',
	scene
}


export function setup() {
	game = new Game(config)
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
		// if (document.activeElement?.ariaRoleDescription === 'editor') { return }
		// Don't register press in code editor
		if (document.activeElement?.ariaPlaceholder) return

		const key = apiKeyCode(event.key)
		if (key && !keysPressed.includes(key) && !event.repeat) {
			keysPressed.push(key)
			keysJustPressed.set(key, _frame)
		}
	})
	window.addEventListener('keyup', event => {
		// if (document.activeElement?.ariaRoleDescription === 'editor') { return }
		if (document.activeElement?.ariaPlaceholder) return

		const key = apiKeyCode(event.key)
		if (key && keysPressed.includes(key)) {
			keysPressed.splice(keysPressed.indexOf(key), 1)
		}
	})
	window.addEventListener('contextmenu', event => {
		// Prevent opening the context menu from interrupting key registration
		keysPressed = []
	})
	window.addEventListener('blur', event => {
		// Prevent window losing focus from interrupting key registration
		keysPressed = []
	})
	window.addEventListener('resize', async () => {
		new Promise(resolve => setTimeout(resolve, 100)).then(() => {
			// resizeStage()
			updateSpritePositions()
		})
	})

	// app.stage.eventMode = 'dynamic'
	// app.stage.on('globalmousemove', event => {
	// 	mouseX = Math.round(event.globalX - app.screen.width / 2)
	// 	mouseY = Math.round(app.screen.height / 2 - event.globalY)
	// 	mouseRef.value = { mouseX, mouseY }
	// })
	// runUserCode(startCode)
}

export { startCode };
