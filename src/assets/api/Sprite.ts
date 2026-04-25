import { Sprite as PixiSprite, Assets } from "pixi.js"
import { allPositionables, app, print } from "./core"
import GameObject from "./GameObject"
import type { GameObjectProps } from "./mixins"
import { defaults } from "./mixins"

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

type SpriteProps = GameObjectProps & {
    src?: string
}

export default class Sprite extends GameObject {
    readonly _sprite: PixiSprite
    _src?: string // make optional

    // Last steps for consolidating constructors(?): props type for each mixin interface + intersection type
    // have each class (Sprite, Rectangle) constructor take one optional arg with that intersection type.
    // Figure out how to introduce new props as needed like src for Sprite
    constructor(props: SpriteProps) {
        const sprite = new PixiSprite()
        super(props)

		this._pixiObj = sprite
        this._sprite = sprite
        this.hide()

        // The majority of these prop assigns aside from src will be moved to each mixin def
		this.src = props.src ?? 'https://woofjs.com/docs/images/river-gator.png'
		this.x = props.x ?? defaults.x
		this.y = props.y ?? defaults.y
        this.cursor = props.cursor ?? defaults.cursor
        this.alpha = props.alpha ?? defaults.alpha
        this.onClick = () => { print('Sprite click') }

        this.setAnchorCenter()
        if (props.width) this.width = props.width
        if (props.height) this.height = props.height

        if (props.rotation && props.radians) {
            // warn?
        }
        this.rotation = props.rotation ?? defaults.rotation
        this.radians = props.radians ?? defaults.radians

        
        // Temp
        this._sprite.eventMode = 'dynamic'
        // 	this._sprite.on('mousedown', () => {
        // 		this.cursor = 'handClosed'
        // 		// app.renderer.events.setCursor('handClosed')
        // 	})
        // 	this._sprite.on('mouseup', () => {
        // 		this.cursor = 'handOpen'
        // 		// app.renderer.events.setCursor('handOpen')
        // 	})

        app.stage.addChild(this._sprite)
        allPositionables.push(this)
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