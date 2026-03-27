import { Application, Assets, Sprite as PixiSprite, Ticker } from 'pixi.js';

// Private vars / methods
interface Repeatable {
	count: number,
	i: number,
	fn: Function
}

let _ticker: Ticker = new Ticker()
let _repeats: Array<Repeatable> = []

// Global (user-accessible) vars
export const app = new Application();
export const keysPressed: Array<string> = []

const PI = 3.14159265359

function deg2rad(deg: number) {
	return deg * PI / 180
}

function rad2deg(rad: number) {
	return 180 * rad / PI
}

interface Vector {
	x: number
	y: number
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

	rotateAround(point: Vector, angle: number) {
		// this._sprite.pivot.x = app.screen.width / 2 + point.x
		// this._sprite.pivot.y = app.screen.height / 2 + point.y
		console.log(`rotating around ${point.x}, ${point.y}`)
		this._sprite.pivot.x = this._sprite.x - point.x
		this._sprite.pivot.y = this._sprite.y - point.y
		
		// Thinking of syntax like:
		// sprite.rotateAround({x:5, y:10}, 45).degrees()
		// and
		// sprite.rotateAround({x:5, y:10}, PI/8).radians()
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

function forever(fn: Function) {
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

function keyPressed(key: string) {
	return keysPressed.includes(key)
}

function clear() {
	app.stage.removeChildren()
}

function _resetTicker() {
	_ticker.destroy()
	_ticker = new Ticker()
	_ticker.start()
}

export async function runUserCode(code: string) {
  try {
    // const keys = Object.keys(api)
    // const values = Object.values(api)
	clear()
	_resetTicker()
	_ticker.add(() => {
		_runRepeats()
	})

	const keys = [ 'PI', 'Sprite', 'forever', 'repeat', 'clear', 'keyPressed' ]
	const values = [PI,   Sprite,   forever,   repeat,   clear,   keyPressed]

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

export async function setup() {
	await app.init({
		background: '#00bd7e',
		resizeTo: document.querySelector('#game-container') as HTMLElement, // Dynamically update this on resize
		// width: 720,
		// height: 720,
		antialias: true,
		autoDensity: true
  	})

	// Key press registration needs work; right clicking while holding a key allows the
	// user to stop pressing but it's never de-registered until pressing/releasing again
	window.addEventListener('keypress', (event) => {
		// console.log(document.activeElement)
		if (document.activeElement?.ariaRoleDescription === 'editor') { return }
		if (!keysPressed.includes(event.key)) {
			keysPressed.push(event.key)
		}
	})
	window.addEventListener('keyup', (event) => {
		// console.log(document.activeElement)
		if (document.activeElement?.ariaRoleDescription === 'editor') { return }
		if (keysPressed.includes(event.key)) {
			keysPressed.splice(keysPressed.indexOf(event.key), 1)
		}
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