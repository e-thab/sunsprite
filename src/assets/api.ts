import { Application, Assets, Sprite as PixiSprite } from 'pixi.js';

// Global (user-accessible) vars
// const app = new Application();
export const api = {
	PI: 3.14159265359,

	Units: {
		DEGREES: 'degrees',
		RADIANS: 'radians'
	}
	
	function deg2rad(deg: number) {
		return deg * PI / 180
	}

	function rad2deg(rad: number) {
		return 180 * rad / PI
	},

	/**
	 * Simplified sprite class, mimics WoofJS style
	 */
	class Sprite {
	_pixiSprite: PixiSprite;
	_x: number;
	_y: number;
		
	constructor(spriteObj) {
		this._pixiSprite = new PixiSprite()

		if (spriteObj === undefined) {
		spriteObj = {}
		}
		this.src = spriteObj.src === undefined ? 'https://woofjs.com/docs/images/river-gator.png' : spriteObj.src

		this._x = 0
		this._y = 0
		this.x = spriteObj.x === undefined ? 0 : spriteObj.x
		this.y = spriteObj.y === undefined ? 0 : spriteObj.y
		
		/**
		 * TODO:
		 *  - width/height
		 *  - pivot
		 *  - show/hide
		 *  - brightness
		 *  - distanceTo
		 *  - lastX / lastY
		 *  - move
		 *  - pointTowards
		 *  - touching
		 *  - z index (send to back/front)
		 */
		// this.width = spriteObj.width === undefined ? this._texture.width : spriteObj.width
		// this.height = spriteObj.height === undefined ? this._texture.height : spriteObj.height

		this.rotationUnits = spriteObj.rotationUnits === undefined ? Units.DEGREES : spriteObj.rotationUnits
		this.rotation = spriteObj.rotation === undefined ? 0 : spriteObj.rotation

		app.stage.addChild(this._pixiSprite)

		// Temp
		this._pixiSprite.eventMode = 'dynamic'
		this._pixiSprite.on('click', () => {
		console.log('Sprite clicked!');
		})
		this._pixiSprite.on('mouseover', () => {
		console.log('enter')
		})
		this._pixiSprite.on('mousemove', () => {
		console.log('move')
		})
	}

	get x() {
		return this._x
	}
	set x(newX) {
		this._x = newX
		this._pixiSprite.x = app.screen.width / 2 + newX
	}

	get y() {
		return this._y
	}
	set y(newY) {
		this._y = newY
		this._pixiSprite.y = app.screen.height / 2 - newY
	}

	get src() {
		return this._src
	}
	set src(path) {
		// Not this easy. Need to make async somehow
		this._src = path
		this.assignTexture()
	}

	get rotationUnits() {
		return this._rotationUnits
	}
	set rotationUnits(newUnit) {
		if (this.rotationUnits === Units.DEGREES && newUnit === Units.RADIANS) {
		this._rotation = deg2rad(this._rotation)
		} else if (this.rotationUnits === Units.RADIANS && newUnit === Units.DEGREES) {
		this._rotation = rad2deg(this._rotation)
		}
		this._rotationUnits = newUnit
	}

	get rotation() {
		return this._rotation
	}
	set rotation(angle) {
		this._rotation = angle
		
		if (this.rotationUnits === Units.DEGREES) {
		this._pixiSprite.rotation = -deg2rad(angle)
		} else {
		this._pixiSprite.rotation = -angle
		}
	}

	get rotationDegrees() {
		switch (this.rotationUnits) {
		case Units.DEGREES: return this.rotation
		case Units.RADIANS: return rad2deg(this.rotation)
		}
	}
	get rotationRadians() {
		switch (this.rotationUnits) {
		case Units.DEGREES: return deg2rad(this.rotation)
		case Units.RADIANS: return this.rotation
		}
	}

	async assignTexture() {
		this._texture = await Assets.load(this.src)
		this._pixiSprite.texture = this._texture
		// this._pixiSprite.x = app.screen.width / 2
		// this._pixiSprite.y = app.screen.height / 2
		this._pixiSprite.pivot.x = this._pixiSprite.width / 2
		this._pixiSprite.pivot.y = this._pixiSprite.height / 2
	}
	}

	function main() {
	const guy = new Sprite()
	// guy.x = 200
	// guy.y = 200
	guy.rotation = 90
	guy.rotationUnits = Units.RADIANS
	console.log(guy.rotationUnits)
	console.log(guy.rotation)
	// guy.src = 'https://woofjs.com/docs/images/B9v5lZJ.png'

	app.ticker.add((time) => {
		// Continuously rotate the container!
		// * use delta to create frame-independent transform *
		guy.x -= 0.1 * time.deltaTime
	});
	}

	(async () => {
	// Initialize the application
	await app.init({ background: '#ffffff', resizeTo: window });

	// Append the application canvas to the document body
	document.body.appendChild(app.canvas);

	main();

	// Load the bunny texture and initialize the sprite
	// const texture = await Assets.load('https://pixijs.com/assets/bunny.png');
	// const bunny = new PixiSprite(texture);

	// Add the sprite to the app stage
	// app.stage.addChild(bunny);

	// Move the bunny to the center
	// bunny.x = app.screen.width / 2;
	// bunny.y = app.screen.height / 2;

	// Center the bunny sprites in local container coordinates
	// bunny.pivot.x = bunny.width / 2;
	// bunny.pivot.y = bunny.height / 2;

	// bunny.rotation = 5 * 3.1416 / 4

	// Listen for animate update
	// app.ticker.add((time) => {
		// Continuously rotate the container!
		// * use delta to create frame-independent transform *
		// bunny.rotation -= 0.01 * time.deltaTime;
	// });
	})();
}
