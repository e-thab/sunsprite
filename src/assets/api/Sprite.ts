import { Sprite as PixiSprite, Assets } from "pixi.js"
import { allPositionables, app, print } from "./core"
import GameObject from "./GameObject"

/**
 * Simplified sprite class, mimics WoofJS style
 * 
 * TODO:
 *  - width/height
 *  - pivot / anchor
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
		anchorX = undefined,
		anchorY = undefined,
		rotation = 0,
		radians = 0,
		alpha = 100,
		cursor = 'default',
		onClick = () => {}
	} = {}) {
		const sprite = new PixiSprite()
		super(sprite, x, y, rotation, radians, alpha, cursor)
		this._sprite = sprite
		this._sprite.visible = false
		
		this._src = src
		this.src = src
		this.x = x
		this.y = y
		this.rotation = rotation
		this.radians = radians
		this.onClick = onClick

		if (anchorX === undefined && anchorY === undefined) {
			this.setAnchorCenter()
		} else {
			this.anchorX = anchorX ?? this.width / 2
			this.anchorY = anchorY ?? this.height / 2
		}

		if (width) this.width = width
		if (height) this.height = height

		app.stage.addChild(this._sprite)
		allPositionables.push(this)

		// Temp
		this._sprite.eventMode = 'dynamic'
		this._sprite.on('click', () => {
			print('Sprite click');
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

	async _assignTexture(): Promise<void> {
		this._sprite.texture = await Assets.load(this.src)
		this.setAnchorCenter()
	}

	get src() {
		return this._src
	}
	set src(path) {
		// Not this easy. Need to make async somehow
		this._src = path
		this._assignTexture()
	}

	get x() {
        return this._x
    }
    set x(newX) {
        this._x = newX
        this._updatePosition()
    }

    get y() {
        return this._y
    }
    set y(newY) {
        this._y = newY
        this._updatePosition()
    }

    get width() {
        return this._sprite.width
    }
    set width(n) {
		this._sprite.width = n
    }

    get height() {
        return this._sprite.height
    }
    set height(n) {
        this._sprite.height = n
    }

    // get scale(): { x: number, y: number } {
    //     return this._sprite.scale
    // }
    set scale(value: number) {
		this.setAnchorCenter()
        this._sprite.scale.set(value)
    }

	get anchor(): { x: number, y: number } {
		return this._sprite.anchor
	}
	set anchor(value: number) {
		this._sprite.anchor.set(value)
	}

	get anchorX() {
		return this._sprite.anchor.x
	}
	set anchorX(newX) {
		this._sprite.anchor.x = newX
	}

	get anchorY() {
		return this._sprite.anchor._y
	}
	set anchorY(newY) {
		this._sprite.anchor.y = newY
	}

	setAnchorCenter(): void {
		this._sprite.anchor.set(0.5)
	}

	// get pivotX() {
    //     return this._sprite.pivot.x
    // }
    // set pivotX(newX) {
    //     this._sprite.pivot.x = newX
    // }

    // get pivotY() {
    //     return this._sprite.pivot._y
    // }
    // set pivotY(newY) {
    //     this._sprite.pivot.y = newY
    // }
	// setPivotCenter(): void {
	// 	this._sprite.pivot.x = this._sprite.width / 2
	// 	this._sprite.pivot.y = this._sprite.height / 2
	// }
}