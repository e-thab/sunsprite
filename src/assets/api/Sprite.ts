import { Sprite as PixiSprite, Assets } from "pixi.js"
import { allPositionables, app, print } from "./core"
import GameObject from "./GameObject"
import type { GameObjectProps } from "./mixins"

/**
 * Simplified sprite class, mimics WoofJS style
 * 
 * TODO:
 *  - pivot / anchor ?
 *  - distanceTo
 *  - pointTowards
 *  - lastX / lastY
 *  - move?
 * 	- hitbox
 * 	- animation
*/

type SpriteProps = GameObjectProps & {
    src?: string
}

export default class Sprite extends GameObject {
    readonly _sprite: PixiSprite
    _src?: string

    constructor(props?: SpriteProps) {
        super()

        const sprite = new PixiSprite()
		this._pixiObj = sprite
        this._sprite = sprite
        this.hide()
		this.src = props?.src ?? 'https://woofjs.com/docs/images/river-gator.png'

        // Set mixin props
        this.initPositionable(props)
        this.setAnchorCenter()
        this.initSizable(props)
        this.initSizable({
            width: props?.width ?? sprite.getBounds().width,
            height: props?.height ?? sprite.getBounds().height,
            scale: props?.scale ?? 1
        })
        this.initRotatable(props)
        this.initViewable(props)
        
        // Temp
        sprite.eventMode = 'dynamic'
        // 	sprite.on('mousedown', () => {
        // 		this.cursor = 'handClosed'
        // 		// app.renderer.events.setCursor('handClosed')
        // 	})
        // 	sprite.on('mouseup', () => {
        // 		this.cursor = 'handOpen'
        // 		// app.renderer.events.setCursor('handOpen')
        // 	})

        app.stage.addChild(sprite)
        allPositionables.push(this)
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
    _updateScale() {
        this.setAnchorCenter()
        this._sprite.scale.set(this._scale)
    }

    setAnchorCenter(): void {
        this._sprite.anchor.set(0.5)
    }

    async _assignTexture(): Promise<void> {
		if (this.src) this._sprite.texture = await Assets.load(this.src)
		this.setAnchorCenter()
	}
}