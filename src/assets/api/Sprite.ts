import { Sprite as PixiSprite, Assets } from "pixi.js"
import { allPositionables, app } from "./core"
import GameObject from "./GameObject"

/**
 * Simplified sprite class, mimics WoofJS style
 * 
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
export default class Sprite extends GameObject {
	readonly _sprite: PixiSprite
	_src: string
	onClick: Function
	
	constructor({
		src = 'https://woofjs.com/docs/images/river-gator.png',
		x = 0,
		y = 0,
		width = undefined,
		height = undefined,
		pivotX = undefined,
		pivotY = undefined,
		rotation = 0,
		radians = 0,
		alpha = 100,
		cursor = 'default',
		onClick = () => {}
	} = {}) {
		super(new PixiSprite(), x, y, rotation, radians, alpha, cursor)
		this._sprite = this._pixiObject
		this._sprite.visible = false
		this._src = src
		this.src = src
		this.x = x
		this.y = y
		this.rotation = rotation
		this.radians = radians
		this.onClick = onClick

		if (pivotX === undefined && pivotY === undefined) {
			this.setPivotCenter()
		} else {
			this.pivotX = pivotX
			this.pivotY = pivotY
		}

		// Height/width still need to adjust pivot
		if (width) this.width = width
		if (height) this.height = height
		
		// this.width = spriteObj.width === undefined ? this._texture.width : spriteObj.width
		// this.height = spriteObj.height === undefined ? this._texture.height : spriteObj.height

		app.stage.addChild(this._sprite)
		allPositionables.push(this)

		// Temp
		this._sprite.eventMode = 'dynamic'
		this._sprite.on('click', () => {
			console.log('Sprite clicked!');
			// app.renderer.events.cursorStyles
		})
	// 	this._sprite.on('mousedown', () => {
	// 		this.cursor = 'handClosed'
	// 		// app.renderer.events.setCursor('handClosed')
	// 	})
	// 	this._sprite.on('mouseup', () => {
	// 		this.cursor = 'handOpen'
	// 		// app.renderer.events.setCursor('handOpen')
	// 	})
		this._sprite.visible = true
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