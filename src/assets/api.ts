import { Application, Assets, Color, Sprite as PixiSprite, Rectangle as PixiRect, Ticker, v8_0_0 } from 'pixi.js';
import * as monaco from 'monaco-editor'
import {autocompletion, CompletionContext, snippetCompletion} from "@codemirror/autocomplete"
import { EditorState, type Extension } from "@codemirror/state"
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript';


export function myCompletions(context: CompletionContext) {
  let word = context.matchBefore(/\w*/)
  if (word?.from == word?.to && !context.explicit)
    return null
  return {
    from: word?.from,
    options: [
		// https://codemirror.net/docs/ref/#autocomplete.Completion
		//
		// {label: "match", type: "keyword"},
		// {label: "hello", type: "variable", info: "(World)"},
		// {label: "magic", type: "text", apply: "⠁⭒*.✩.*⭒⠁", detail: "macro"},
		// {label: "pi", type: "constant", apply: "π", detail: "macro"},

		snippetCompletion(`forever(delta => {\n\t#{1:/* ... */}\n)`, {
			label: 'forever',
			type: 'function',
			detail: '(delta => {...})',
			info: 'Runs once each frame.',
			boost: 1
		}),
		snippetCompletion(`repeat(#{1:times}, i => {\n\t#{2:/* ... */}\n)`, {
			label: 'repeat',
			type: 'function',
			detail: '(i => {...})',
			info: 'Runs a given number of times.',
			boost: 1
		}),
		snippetCompletion(`every(#{1:seconds}, () => {\n\t#{2:/* ... */}\n)`, {
			label: 'every',
			type: 'function',
			detail: '(() => {...})',
			info: 'Runs once every x seconds.',
			boost: 1
		}),
    ],
	validFor: /^\w*$/
  }
}

// monaco.languages.typescript.javascriptDefaults.addExtraLib(
// 	`
// 	declare const PI: number
// 	declare function deg2rad(deg: number): number
// 	declare function rad2deg(rad: number): number
// 	declare function forever(fn: (delta: number) => {}): void
// 	declare function repeat(times: number, fn: (i: number) => {}): void
// 	declare function keyPressed(key: string): boolean
// 	declare function keyJustPressed(key: string): boolean
// 	declare namespace Sprite {
// 		let src: string
// 		let x: number
// 		let y: number
// 		let rotation: number
// 		let radians: number
// 		let visible: boolean
// 		let alpha: number
// 		function show(): void
// 		function hide(): void
// 		function rotate(angle: number): void
// 	}
// 	`,
// 	'file:///game-api.d.ts'
// )

// Monaco autocompletion
monaco.languages.registerCompletionItemProvider('javascript', {
  provideCompletionItems() {
    return {
      suggestions: [
        {
          label: 'forever',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'forever(delta => \{\n\t${1:...}\n\})',
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
        }
      ]
    }
  }
})

/**
 * Interfaces
 */
/* used for repeat() */
interface Repeatable {
	count: number
	i: number
	fn: Function
}

/* Used for after() */
interface Delayable {
	seconds: number
	duration: number
	fn: Function
}

/* Used for every() */
// interface Recurrable {
// 	seconds: number
// 	duration: number
// 	fn: Function
// }

interface Screen {
	width: number
	height: number
	topY: number
	bottomY: number
	rightX: number
	leftX: number
}

interface Positionable {
	// _x: number
	// _y: number
	x: number
	y: number
	screenX: number
	screenY: number
	// _updatePosition: Function
}

interface Scalable extends Positionable {
	
}

interface Rotatable extends Positionable {
	rotation: number
	radians: number
	pivotX: number
	pivotY: number
	// _updateRotation: Function
}

interface Viewable {
	alpha: number
	visible: boolean
	show: Function
	hide: Function
}

// // Mixins
// type Class = new (...args: any[]) => any

// function PositionableMixin<Base extends Class>(base: Base) {
// 	return class extends base {
// 		_x: number = 0
// 		_y: number = 0
// 		x: number = 0
// 		y: number = 0
// 		screenX: number = 0
// 		screenY: number = 0
// 		get x():
// 		_updatePosition: Function = () => {

// 		}
// 	}
// }


/**
 * Classes
 */
abstract class GameObject implements Positionable, Rotatable, Viewable {
	protected _pixiObject: any
	protected _x: number
	protected _y: number
	protected _rotation: number
	// protected _pivotX: number
	// protected _pivotY: number
	protected _alpha: number
	// protected _cursor: string
	// protected _radians: number

	constructor(
		pixiObject: any,
		x: number, y: number,
		rotation: number, radians: number, // do something with radians
		// pivotX: number, pivotY: number,
		alpha: number,
		cursor: string
	) {
		// Internal
		this._pixiObject = pixiObject
		this._x = x
		this._y = y
		this._rotation = rotation
		// this._pivotX = pivotX
		// this._pivotY = pivotY
		this._alpha = alpha
		// this._cursor = cursor
		this.cursor = cursor

		// Setters
		this.x = x
		this.y = y
		this.rotation = rotation
		this.radians = radians
	}

	get x() {
		return this._x
	}
	set x(newX) {
		this._x = newX
		// this._pixiObject.x = this.x + app.screen.width / 2 - camera.x 
		this._updatePosition()
	}

	get y() {
		return this._y
	}
	set y(newY) {
		this._y = newY
		// this._pixiObject.y = -this.y + app.screen.height / 2 + camera.y
		this._updatePosition()
	}

	get screenX() {
		return this._x - camera.x
	}
	set screenX(newX) {
		this.x = camera.x - newX
	}

	get screenY() {
		return this._y - camera.y
	}
	set screenY(newY) {
		this.y = camera.y - newY
	}

	get rotation() {
		return this._rotation
	}
	set rotation(angle) {
		this._rotation = angle
		this._pixiObject.rotation = deg2rad(angle)
	}

	get radians() {
		return deg2rad(this._rotation)
	}
	set radians(rad) {
		this._rotation = rad2deg(rad)
		// this._radians = rad
		this._pixiObject.rotation = rad
	}

	// Pivot implementation WIP
	get pivotX() {
		return this._pixiObject.pivot.x
		// return this._pivotX
	}
	set pivotX(newX) {
		this._pixiObject.pivot.x = newX
	}

	get pivotY() {
		return this._pixiObject.pivot._y
	}
	set pivotY(newY) {
		this._pixiObject.pivot.y = newY
	}

	get visible() {
		return this._pixiObject.visible
	}
	set visible(b: boolean) {
		this._pixiObject.visible = b
	}

	get alpha() {
		return this._alpha
	}
	set alpha(n: number) {
		this._alpha = n
		this._pixiObject.alpha = n / 100
	}

	get cursor() {
		return this._pixiObject.cursor
	}
	set cursor(cursor) {
		this._pixiObject.cursor = cursor
	}
	

	show(): void {
		this._pixiObject.visible = true
	}

	hide(): void {
		this._pixiObject.visible = false
	}

	rotate(angle: number, unit: string = 'degrees'): void {
		unit = unit.toLowerCase()
		if (unit === 'degrees') {
			this.rotation += angle
		} else if (unit === 'radians') {
			this.rotation += rad2deg(angle)
		}
	}

	// rotateAround(point: Positionable, angle: number): {degrees: Function, radians: Function} {
	// 	// this._sprite.pivot.x = app.screen.width / 2 + point.x
	// 	// this._sprite.pivot.y = app.screen.height / 2 + point.y
	// 	console.log(`rotating around ${point.x}, ${point.y}`)
	// 	this._pixiObject.pivot.x = this._pixiObject.x - point.x
	// 	this._pixiObject.pivot.y = this._pixiObject.y - point.y
		
	// 	// Thinking of syntax like:
	// 	// sprite.rotateAround({x:5, y:10}, 45).degrees()
	// 	// and
	// 	// sprite.rotateAround(point(5, 10), PI/8).radians()
	// 	//
	// 	// Just do the math here instead of trying to use pivots
	// 	return {
	// 		degrees() {
	// 			this.rotation += angle
	// 			this._setPivotCenter()
	// 		},
	// 		radians() {
	// 			this.radians += angle
	// 			this._setPivotCenter()
	// 		}
	// 	}
	// }
	
	_updatePosition(): void {
		this._pixiObject.x = this.x + app.screen.width / 2 - camera.x 
		this._pixiObject.y = -this.y + app.screen.height / 2 + camera.y
	}

	// _updateRotation(): void {

	// }
}

class Camera implements Positionable {
	// TODO: zoom, rotate, smoothing
	zoom: number
	_x: number = 0
	_y: number = 0
	screenX: number = 0
	screenY: number = 0

	constructor() {
		this.zoom = 0
	}

	get x() {
		return this._x
	}
	set x(newX) {
		this._x = newX
		// this._pixiObject.x = this.x + app.screen.width / 2 - camera.x 
		this._updatePosition()
	}

	get y() {
		return this._y
	}
	set y(newY) {
		this._y = newY
		// this._pixiObject.y = -this.y + app.screen.height / 2 + camera.y
		this._updatePosition()
	}

	_updatePosition(): void {
		_updateSpritePositions()
	}
}

/**
 * Simplified sprite class, mimics WoofJS style
 */
class Sprite extends GameObject {
	/**
	 * TODO:
	 *  - width/height
	 *  - pivot
	 *  - distanceTo
	 *  - pointTowards
	 *  - lastX / lastY
	 *  - move?
	 *  - touching
	 *  - z index (send to back/front)
	 * 	- hitbox
	 * 	- animation
	 */
	readonly _sprite: PixiSprite
	_src: string
	
	constructor({
		src = 'https://woofjs.com/docs/images/river-gator.png',
		x = 0,
		y = 0,
		pivotX = -1,
		pivotY = -1,
		rotation = 0,
		radians = 0,
		alpha = 100,
		cursor = 'default'
	} = {}) {
		super(new PixiSprite(), x, y, rotation, radians, alpha, cursor)
		this._sprite = this._pixiObject
		this._src = src
		this.src = src
		this.x = x
		this.y = y
		this.rotation = rotation
		this.radians = radians

		if (pivotX === -1 && pivotY === -1) {
			this.setPivotCenter()
		} else {
			this.pivotX = pivotX
			this.pivotY = pivotY
		}
		
		// this.width = spriteObj.width === undefined ? this._texture.width : spriteObj.width
		// this.height = spriteObj.height === undefined ? this._texture.height : spriteObj.height

		app.stage.addChild(this._sprite)
		_allSprites.push(this)

		// Temp
		this._sprite.eventMode = 'dynamic'
		this._sprite.on('click', () => {
			console.log('Sprite clicked!');
		})
	}

	setPivotCenter(): void {
		this._sprite.pivot.x = this._sprite.width / 2
		this._sprite.pivot.y = this._sprite.height / 2
	}

	async _assignTexture(): Promise<void> {
		this._sprite.texture = await Assets.load(this.src)
		this.setPivotCenter()
	}

	// _updatePosition(): void {
	// 	this._sprite.x = this.x + app.screen.width / 2 - camera.x 
	// 	this._sprite.y = -this.y + app.screen.height / 2 + camera.y
	// }

	// get pivotX() {
	// 	return this._pivotX
	// }
	// set pivotX(x) {
	// 	this._pivotX = x
	// 	this._sprite.pivot.x = app.screen.width / 2 + x
	// }

	get src() {
		return this._src
	}
	set src(path) {
		// Not this easy. Need to make async somehow
		this._src = path
		this._assignTexture()
		// this._setPivot()
	}
}

/**
 * Rectangle class, using position setters from that one WoofJS project
 */
// class Rectangle extends GameObject {
// 	readonly _rect: PixiRect
// 	_x: number
// 	_y: number
// 	width: number
// 	height: number
// 	// left: number
// 	// right: number
// 	// top: number
// 	// bottom: number

// 	// What should happen when supplying contradictory size/place properties?
// 	// A warning in the editor?
// 	constructor({
// 		x = 0,
// 		y = 0,
// 		width = 100,
// 		height = 100,
// 		// left = undefined,
// 		// right = undefined,
// 		// top = undefined,
// 		// bottom = undefined
// 	} = {}) {
// 		super()
// 		this._rect = new PixiRect()
// 		this._x = x
// 		this._y = y
// 		this.width = width
// 		this.height = height
// 	}

// 	_updatePosition(): void {
		
// 	}
// }

/**
 * Internal methods
 */
function _updateSpritePositions(): void {
	for (const sprite of _allSprites) {
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
 * Internal vars
 */
// type Key = 'Escape' | ''
let _frame: number = 0 // current render frame index
let _ticker: Ticker = new Ticker()
let _repeats: Array<Repeatable> = []
let _afters: Array<Delayable> = []
let _everys: Array<Delayable> = []
let _allSprites: Array<Sprite> = []


/**
 * Global (user-accessible) vars / methods
 */
export const app: Application = new Application()

let keysPressed: Array<string> = []
let keysJustPressed: Map<string, number | undefined> = new Map()

const camera: Camera = new Camera() 
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

const PI: number = 3.14159265359

function deg2rad(deg: number): number {
	return deg * PI / 180
}

function rad2deg(rad: number): number {
	return 180 * rad / PI
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

function keyPressed(key: string): boolean {
	return keysPressed.includes(key.toLowerCase())
}

// True only during the frame after key press
function keyJustPressed(key: string): boolean {
	return keysJustPressed.get(key.toLowerCase()) !== undefined
}

function clear(): void {
	app.stage.removeChildren()
}

// function onKeyDown(key: string, fn: Function) {
// 	window.addEventListener('keydown', )
// }

/**
 * API utility
 */
export async function runUserCode(code: string): Promise<void> {
  try {
    // const keys = Object.keys(api)
    // const values = Object.values(api)
	clear()
	_repeats = []
	_afters = []
	_everys = []
	_allSprites = []
	
	_resetTicker()
	_ticker.add(time => {
		const delta = time.deltaMS / 1000
		_runRepeats()
		_runAfters(delta)
		_runEverys(delta)
		_clearKeysJustPressed(_frame)
		_frame++
	})

	const keys = [ 'app', 'PI', 'screen', 'camera', 'Sprite', 'setBackgroundColor', 'setCursor', 'forever', 'repeat', 'after', 'every', 'clear', 'keyPressed', 'keyJustPressed' ]
	const values = [app,   PI,   screen,   camera,   Sprite,   setBackgroundColor,   setCursor,   forever,   repeat,   after,   every,  clear,   keyPressed,   keyJustPressed]

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
	await app.init({
		background: '#222',
		resizeTo: document.querySelector('#game-container') as HTMLElement, // Dynamically update this on resize
		// width: 720,
		// height: 720,
		antialias: true,
		autoDensity: true
  	})
	
	const eventSystem = app.renderer.events
	eventSystem.cursorStyles.default = "url('src/assets/images/ui-cursors/small/pointer_c.png') 5 5, auto"
	eventSystem.cursorStyles.hover = "url('src/assets/images/ui-cursors/small/hand_open.png') 15 10, auto"
	eventSystem.cursorStyles.help = "url('src/assets/images/ui-cursors/small/mark_question_pointer_b.png') 0 0, auto"
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
		_updateSpritePositions()
	})

	runUserCode(startCode)
}

export const startCode = `
setBackgroundColor('#00bd7e')

const bunny = new Sprite({
    src: 'https://pixijs.com/assets/bunny.png',
    x: 200,
    cursor: 'help'
})
const gator = new Sprite({
    src: 'https://woofjs.com/docs/images/river-gator.png',
	cursor: 'hover'
})

function spinGator() {
    repeat(45, () => {
        gator.rotation += 8
    })
}

console.log(gator.pivotX)
console.log(bunny.pivotX)

function spawnGuy() {
    const guy = new Sprite({ src: 'src/assets/images/platformer-pack/character_pink_front.png'})
    const speed = 100
    forever(delta => {
        guy.x -= speed * delta
    })
    every(2, () => {
        guy.y += 20
    })
}
every(2, spawnGuy)

forever(delta => {
    bunny.rotation += 2
    // bunny.rotateAround(gator, 2).degrees()

    if (keyPressed('W')) { gator.y += 5 }
    if (keyPressed('A')) { gator.x -= 5 }
    if (keyPressed('S')) { gator.y -= 5 }
    if (keyPressed('D')) { gator.x += 5 }
    if (keyJustPressed('Space')) { spinGator() }

    if (keyPressed('Up')) { camera.y += 5 }
    if (keyPressed('Down')) { camera.y -= 5 }
    if (keyPressed('Left')) { camera.x -= 5 }
    if (keyPressed('Right')) { camera.x += 5 }

    if (gator.x > screen.rightX) { gator.x = screen.leftX }
    if (gator.x < screen.leftX) { gator.x = screen.rightX }
    if (gator.y > screen.topY) { gator.y = screen.bottomY }
    if (gator.y < screen.bottomY) { gator.y = screen.topY }
})
`

// function main() {
// 	const guy = new Sprite()
// 	// guy.x = 200
// 	// guy.y = 200
// 	guy.rotation = 90
// 	guy.rotationUnits = Units.RADIANS
// 	console.log(guy.rotationUnits)
// 	console.log(guy.rotation)
// 	// guy.src = 'https://woofjs.com/docs/images/B9v5lZJ.png'

// 	app.ticker.add((time) => {
// 		// Continuously rotate the container!
// 		// * use delta to create frame-independent transform *
// 		guy.x -= 0.1 * time.deltaMS
// 	});
// }

// (async () => {
// 	// Initialize the application
// 	await app.init({ background: '#ffffff', resizeTo: window });

// 	// Append the application canvas to the document body
// 	document.body.appendChild(app.canvas);

// 	main();

// 	// Load the bunny texture and initialize the sprite
// 	// const texture = await Assets.load('https://pixijs.com/assets/bunny.png');
// 	// const bunny = new PixiSprite(texture);

// 	// Add the sprite to the app stage
// 	// app.stage.addChild(bunny);

// 	// Move the bunny to the center
// 	// bunny.x = app.screen.width / 2;
// 	// bunny.y = app.screen.height / 2;

// 	// Center the bunny sprites in local container coordinates
// 	// bunny.pivot.x = bunny.width / 2;
// 	// bunny.pivot.y = bunny.height / 2;

// 	// bunny.rotation = 5 * 3.1416 / 4

// 	// Listen for animate update
// 	// app.ticker.add((time) => {
// 		// Continuously rotate the container!
// 		// * use delta to create frame-independent transform *
// 		// bunny.rotation -= 0.01 * time.deltaTime;
// 	// });
// })();

// Historical reference:
// function createGameAPI() {
//   return {
//     app,

//     async addSprite(url: string, x = 0, y = 0) {
//       const texture = await Pixi.Assets.load(url)
//       const sprite = new Pixi.Sprite(texture)

//       sprite.x = x
//       sprite.y = y

//       app.stage.addChild(sprite)

//       return sprite
//     },

//     addText(text: string, x = 0, y = 0) {
//       const label = new Pixi.Text({ text })

//       label.x = x
//       label.y = y

//       app.stage.addChild(label)

//       return label
//     },

//     forever(fn: Function) {
//       app.ticker.add((time) => {
//         fn()
//       })
//     },

//     clear() {
//       app.stage.removeChildren()
//     }
//   }
// }