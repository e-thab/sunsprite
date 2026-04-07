import { ref } from 'vue';
import { Application, Color, Ticker } from 'pixi.js';

import type { Repeatable, Delayable, Screen } from './interfaces';
import { atan2, cos, sin, sqrt, startCode, tan } from './utility';

import Camera from './Camera';
import Sprite from './Sprite';

export function resizeStage() {
	app.resize()
	updateSpritePositions()
}

export const fpsRef = ref(0)
export const mouseRef = ref({mouseX: 0, mouseY: 0})

/**
 * API internal methods
 */
export function updateSpritePositions(): void {
	for (const sprite of allSprites) {
		sprite._updatePosition()
	}
}

function _runRepeats() {
	for (const repeat of _repeats) {
		repeat.fn(repeat.i)
		repeat.count -= 1
		repeat.i += 1
	}
	_repeats = _repeats.filter(repeat => repeat.count > 0)
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

function _clearKeysJustPressed(frame: number): void {
	for (const key of keysJustPressed.keys()) {
		if (keysJustPressed.get(key) !== frame) {
			keysJustPressed.set(key, undefined)
		}
	}
}

function _resetTicker(): void {
	_ticker.destroy()
	_ticker = new Ticker()
	_ticker.start()
	_frame = 0
}

/**
 * API Internal vars
 */
// type Key = 'Escape' | ''
export let allSprites: Array<Sprite> = []
let _frame: number = 0 // current render frame index
let _ticker: Ticker = new Ticker()
let _repeats: Array<Repeatable> = []
let _afters: Array<Delayable> = []
let _everys: Array<Delayable> = []

/**
 * User-accessible
 */
export const app: Application = new Application()
export const camera: Camera = new Camera() 
export const Timer = {
	time: 0, // time since start, does not increment during pause
	realTime: 0, // time since start including pause time
}
export let mouseX: number = 0
export let mouseY: number = 0
export let FPS: number = 0
export let paused: boolean = false
// export const PI: number = 3.141592653589793

let keysPressed: Array<string> = []
let keysJustPressed: Map<string, number | undefined> = new Map()
const screen: Screen = {
	get width(): number {
		return app.screen.width
	},
	get height(): number {
		return app.screen.height
	},
	get topY(): number {
		return camera.y + this.height / 2
	},
	get bottomY(): number {
		return camera.y - this.height / 2
	},
	get leftX(): number {
		return camera.x - this.width / 2
	},
	get rightX(): number {
		return camera.x + this.width / 2
	}
}

export function pause() {
	paused = true
}
export function play() {
	paused = false
}

// function point(x: number, y: number): Positionable {
// 	return {x: x, y: y}
// }

// function move_camera(x: number, y: number): void {
// 	camera.x += x
// 	camera.y += y
// 	_positionSprites()
// }

// function set_camera(x: number, y: number): void {
// 	camera.x = x
// 	camera.y = y
// 	_positionSprites()
// }

function setBackgroundColor(color: Color) {
	app.renderer.background.color = color
}

async function setCursor(src: string) {
	// Come back to this
	// app.renderer.events.cursorStyles.default = `url(${src}), auto`;
	// const defaultIcon = `url(${src}),auto`;
	// app.renderer.events.cursorStyles.hover = defaultIcon;
}

/* Run function {fn} once every frame */
function forever(fn: Function): void {
	_ticker.add((time) => {
		if (paused) { return }
		fn(time.deltaMS / 1000) // delta: how long since previous frame in seconds
	})
}

/* Run function {fn} {times} number of times */
function repeat(times: number, fn: Function) {
	_repeats.push({
		count: times,
		i: 0,
		fn: fn
	})
}

/* Run function {fn} after {seconds} seconds have passed */
function after(seconds: number, fn: Function): void {
	_afters.push({
		seconds: seconds,
		duration: 0,
		fn: fn
	})
}

/* Run function {fn} once immediately, then every {seconds} seconds */
function every(seconds: number, fn: Function): void {
	fn()
	_everys.push({
		seconds: seconds,
		duration: 0,
		fn: fn
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

function clearStage(): void {
	app.stage.removeChildren()
}

function print(msg: string) {
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
    // item.textContent = msg
	
	const msgItem = document.createElement('div')
	msgItem.className = 'output-msg'
	msgItem.textContent = msg
	
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

function clearOutput(): void {
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
export async function runUserCode(code: string): Promise<void> {
	// const keys = Object.keys(api)
    // const values = Object.values(api)
	clearOutput()
	clearStage()
	_repeats = []
	_afters = []
	_everys = []
	allSprites = []
	Timer.time = 0
	paused = false
	
	_resetTicker()
	_ticker.add(time => {
		const delta = time.deltaMS / 1000
		Timer.realTime += delta
		fpsRef.value = Math.round(app.ticker.FPS)
		FPS = app.ticker.FPS
		_clearKeysJustPressed(_frame)
		// whilePaused loops? or a flag to be able to run standard loops through pause?
		
		if (paused) { return } // Can pause from loops, but obviously not unpause. Would a workaround be useful?
		Timer.time += delta
		_frame++
		_runRepeats()
		_runAfters(delta)
		_runEverys(delta)
		resizeStage() // -necessary?
	})

	const keys = [ 'app',  'PI', 'sin', 'cos', 'tan', 'atan2', 'sqrt', 'Timer', 'screen', 'camera', 'Sprite', 'setBackgroundColor', 'setCursor', 'forever', 'repeat', 'after', 'every', 'clearStage', 'keyPressed', 'keyJustPressed', 'print', 'pause', 'play', 'paused' ]
	const values = [app, Math.PI, sin,   cos,   tan,   atan2,   sqrt,   Timer,   screen,   camera,   Sprite,   setBackgroundColor,   setCursor,   forever,   repeat,   after,   every,  clearStage,   keyPressed,   keyJustPressed,    print,   pause,   play,   paused]
	
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

export async function setup(): Promise<void> {
	const gameContainer = document.querySelector('#game-container') as HTMLElement

	await app.init({
		background: '#222',
		resizeTo: gameContainer, // Dynamically update this on resize
		antialias: true,
		autoDensity: true,
  	})

	const eventSystem = app.renderer.events
	eventSystem.cursorStyles.default = "url('src/assets/images/ui-cursors/small/pointer_c.png') 5 5, auto"
	eventSystem.cursorStyles.handOpen = "url('src/assets/images/ui-cursors/small/hand_open.png') 15 10, auto"
	eventSystem.cursorStyles.handClosed = "url('src/assets/images/ui-cursors/small/hand_closed.png') 10 10, auto"
	eventSystem.cursorStyles.handPoint = "url('src/assets/images/ui-cursors/small/hand_point.png') 10 4, auto"
	eventSystem.cursorStyles.question = "url('src/assets/images/ui-cursors/small/mark_question_pointer_b.png') 7 4, auto"
	eventSystem.cursorStyles.cross = "url('src/assets/images/ui-cursors/small/cross_large.png') 16 16, auto"
	eventSystem.cursorStyles.dot = "url('src/assets/images/ui-cursors/small/dot_large.png') 16 16, auto"
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
		if (document.activeElement?.ariaPlaceholder) { return }

		const key = apiKeyCode(event.key)
		if (key && !keysPressed.includes(key) && !event.repeat) {
			keysPressed.push(key)
			keysJustPressed.set(key, _frame)
		}
	})
	window.addEventListener('keyup', event => {
		// if (document.activeElement?.ariaRoleDescription === 'editor') { return }
		if (document.activeElement?.ariaPlaceholder) { return }

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
		await new Promise(resolve => setTimeout(resolve, 100))
		// resizeStage()
		updateSpritePositions()
	})

	app.stage.eventMode = 'static'
	app.stage.on('globalmousemove', event => {
		mouseX = Math.round(event.globalX - app.screen.width / 2)
		mouseY = Math.round(app.screen.height / 2 - event.globalY)
		mouseRef.value = { mouseX, mouseY }
	})
	runUserCode(startCode)
}

export { startCode };
