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
    _src?: string
    onClick: Function

    // Can I break down these args and keep them defined just in the mixins?
    // Maybe use ...args?
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
        super()

		this._pixiObj = sprite
        this._sprite = sprite
        this.hide()

		this.src = src
		this.x = x
		this.y = y
        this.alpha = alpha
        this.cursor = cursor
		this.onClick = onClick

        if (!anchorX && !anchorY) {
            this.setAnchorCenter()
		} else {
			this.anchorX = anchorX ?? this.width / 2
			this.anchorY = anchorY ?? this.height / 2
        }

        if (rotation && radians) {
            // warn?
        }
        if (rotation) this.rotation = rotation
        if (radians) this.radians = radians

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
        this.show()
    }
    
    get src() {
        return this._src
    }
    set src(path) {
        // Not necessarily this easy. Need to make async somehow?
        this._src = path
        this._assignTexture()
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

    // Override
    set scale(value: number) {
        this.setAnchorCenter()
        this._sprite.scale.set(value)
    }

    setAnchorCenter(): void {
        this._sprite.anchor.set(0.5)
    }

    async _assignTexture(): Promise<void> {
		if (this.src) this._sprite.texture = await Assets.load(this.src)
		this.setAnchorCenter()
	}
}