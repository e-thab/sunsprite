import { Application, Assets, Sprite as PixiSprite, Ticker } from 'pixi.js';
import * as monaco from 'monaco-editor'

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

// Private vars / methods
interface Repeatable {
	count: number,
	i: number,
	fn: Function
}

// type Key = 'Escape' | ''
let _frame: number = 0 // current render frame index
let _ticker: Ticker = new Ticker()
let _repeats: Array<Repeatable> = []


// Global (user-accessible) vars
export const app = new Application()
let keysPressed: Array<string> = []
let keysJustPressed: Map<string, number | undefined> = new Map()

const PI: number = 3.14159265359

function deg2rad(deg: number): number {
	return deg * PI / 180
}

function rad2deg(rad: number): number {
	return 180 * rad / PI
}

interface Vector {
	x: number
	y: number
}

function point(x: number, y: number): Vector {
	return {x: x, y: y}
}

/**
 * Simplified sprite class, mimics WoofJS style
 */
class Sprite {
	readonly _sprite: PixiSprite
	_src: string
	_x: number
	_y: number
	_rotation: number
	_radians: number
	_alpha: number
	// _pivot: Vector | string
		
	constructor({
		src = 'https://woofjs.com/docs/images/river-gator.png',
		x = 0,
		y = 0,
		rotation = 0,
		radians = 0,
		alpha = 100
	} = {}) {
		this._sprite = new PixiSprite()
		this._src = src
		this._x = x
		this._y = y
		// this._pivot = { x: 0, y: 0 }
		this._rotation = rotation
		this._radians = radians
		this._alpha = alpha
		this._setProps(src, x, y, rotation, radians)

		this._sprite.pivot.x = this._sprite.width / 2
		this._sprite.pivot.y = this._sprite.height / 2
		
		/**
		 * TODO:
		 *  - width/height
		 *  - pivot
		 *  - distanceTo
		 *  - lastX / lastY
		 *  - move
		 *  - pointTowards
		 *  - touching
		 *  - z index (send to back/front)
		 */
		// this.width = spriteObj.width === undefined ? this._texture.width : spriteObj.width
		// this.height = spriteObj.height === undefined ? this._texture.height : spriteObj.height

		app.stage.addChild(this._sprite)

		// Temp
		this._sprite.eventMode = 'dynamic'
		this._sprite.on('click', () => {
			console.log('Sprite clicked!');
		})
	}

	_setProps(src: string, x: number, y: number, rotation: number, radians: number) {
		this.src = src
		this.x = x
		this.y = y
		this.rotation = rotation
		this.radians = radians
	}

	_setPivotCenter() {
		this._sprite.pivot.x = this._sprite.width / 2
		this._sprite.pivot.y = this._sprite.height / 2
	}

	async _assignTexture() {
		this._sprite.texture = await Assets.load(this.src)
		this._setPivotCenter()
	}

	get x() {
		return this._x
	}
	set x(newX) {
		this._x = newX
		this._sprite.x = app.screen.width / 2 + newX
	}

	get y() {
		return this._y
	}
	set y(newY) {
		this._y = newY
		this._sprite.y = app.screen.height / 2 - newY
	}

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
	}

	get rotation() {
		return this._rotation
	}
	set rotation(angle) {
		this._rotation = angle
		this._sprite.rotation = deg2rad(angle)
	}

	get radians(): number {
		return deg2rad(this._rotation)
	}
	set radians(rad) {
		this._rotation = rad2deg(rad)
		this._radians = rad
		this._sprite.rotation = rad
	}

	get visible() {
		return this._sprite.visible
	}
	set visible(b: boolean) {
		this._sprite.visible = b
	}

	get alpha() {
		return this._alpha
	}
	set alpha(n: number) {
		this._alpha = n
		this._sprite.alpha = n / 100
	}

	show() {
		this._sprite.visible = true
	}

	hide() {
		this._sprite.visible = false
	}

	rotate(angle: number, unit: string = 'degrees') {
		unit = unit.toLowerCase()
		if (unit === 'degrees') {
			this.rotation += angle
		} else if (unit === 'radians') {
			this.rotation += rad2deg(angle)
		}
	}

	rotateAround(point: Vector, angle: number) {
		// this._sprite.pivot.x = app.screen.width / 2 + point.x
		// this._sprite.pivot.y = app.screen.height / 2 + point.y
		console.log(`rotating around ${point.x}, ${point.y}`)
		this._sprite.pivot.x = this._sprite.x - point.x
		this._sprite.pivot.y = this._sprite.y - point.y
		
		// Thinking of syntax like:
		// sprite.rotateAround({x:5, y:10}, 45).degrees()
		// and
		// sprite.rotateAround(point(5, 10), PI/8).radians()
		//
		// Just do the math here instead of trying to use pivots
		const sprite = this
		return {
			degrees() {
				sprite.rotation += angle
				sprite._setPivotCenter()
			},
			radians() {
				sprite.radians += angle
				sprite._setPivotCenter()
			}
		}
	}
}

/**
 * Rectangle class, using position setters from that one WoofJS project
 */
class Rectangle {

}

function forever(fn: Function): void {
	_ticker.add((time) => {
		fn(time.deltaTime)
	})
}

function repeat(times: number, fn: Function) {
	_repeats.push({
		count: times,
		i: 0,
		fn: fn
	})
}

function _runRepeats() {
	for (const repeat of _repeats) {
		repeat.fn(repeat.i)
		repeat.count -= 1
		repeat.i += 1
	}
	_repeats = _repeats.filter((repeat) => repeat.count > 0)
}

// function onKeyDown(key: string) {
// 	window.addEventListener('keydown', )
// }

function keyPressed(key: string): boolean {
	return keysPressed.includes(key)
}

// True only the frame after key press
function keyJustPressed(key: string): boolean {
	return keysJustPressed.get(key) !== undefined
}

function _clearKeysJustPressed(frame: number): void {
	for (const key of keysJustPressed.keys()) {
		if (keysJustPressed.get(key) !== frame) {
			keysJustPressed.set(key, undefined)
		}
	}
}

function clear(): void {
	app.stage.removeChildren()
}

function _resetTicker(): void {
	_ticker.destroy()
	_ticker = new Ticker()
	_ticker.start()
	_frame = 0
}

export async function runUserCode(code: string): Promise<void> {
  try {
    // const keys = Object.keys(api)
    // const values = Object.values(api)
	clear()
	_resetTicker()
	_ticker.add(() => {
		_runRepeats()
		_clearKeysJustPressed(_frame)
		_frame++
	})

	const keys = [ 'PI', 'Sprite', 'forever', 'repeat', 'clear', 'keyPressed', 'keyJustPressed' ]
	const values = [PI,   Sprite,   forever,   repeat,   clear,   keyPressed,   keyJustPressed]

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
		background: '#00bd7e',
		resizeTo: document.querySelector('#game-container') as HTMLElement, // Dynamically update this on resize
		// width: 720,
		// height: 720,
		antialias: true,
		autoDensity: true
  	})

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
	window.addEventListener('keydown', (event) => {
		if (document.activeElement?.ariaRoleDescription === 'editor') { return }

		const key = apiKeyCode(event.key)
		if (key && !keysPressed.includes(key) && !event.repeat) {
			keysPressed.push(key)
			keysJustPressed.set(key, _frame)
		}
	})
	window.addEventListener('keyup', (event) => {
		if (document.activeElement?.ariaRoleDescription === 'editor') { return }

		const key = apiKeyCode(event.key)
		if (key && keysPressed.includes(key)) {
			keysPressed.splice(keysPressed.indexOf(key), 1)
		}
	})
	window.addEventListener('contextmenu', event => {
		// Prevent opening the context menu from interrupting key registration
		keysPressed = []
	})
	window.addEventListener('blur', (event) => {
		// Prevent window losing focus from interrupting key registration
		keysPressed = []
	})

	runUserCode(startCode)
}
export const startCode = `
const bunny = new Sprite({
    src: 'https://pixijs.com/assets/bunny.png',
    x: 200
})
const gator = new Sprite({
    src: 'https://woofjs.com/docs/images/river-gator.png'
})

function spinGator() {
    repeat(45, () => {
        gator.rotation += 8
    })
}

forever(() => {
    bunny.rotation += 2
    // bunny.rotateAround(gator, 2).degrees()

    if (keyPressed('w')) {
        gator.y += 5
    }
    if (keyPressed('a')) {
        gator.x -= 5
    }
    if (keyPressed('s')) {
        gator.y -= 5
    }
    if (keyPressed('d')) {
        gator.x += 5
    }
    if (keyJustPressed('space')) {
        spinGator()
    }
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
// 		guy.x -= 0.1 * time.deltaTime
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

// window.addEventListener('resize', async () => {
// 	await new Promise(resolve => setTimeout(resolve, 100))
// 	bunny.x = app.screen.width / 2
// 	bunny.y = app.screen.height / 2
// })

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