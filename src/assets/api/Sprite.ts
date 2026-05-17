import GameObject from "./GameObject"
import type { GameObjectProps } from "./mixins"

import { scene, allPositionables } from "./corephaser"
import Phaser from "phaser"
// import type { Sprite } from 'phaser'

/**
 * Simplified sprite class, mimics WoofJS style
 * 
 * TODO:
 *  - flipX / flipY
 *  - scaleX / scaleY ?
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
    // readonly _sprite: PixiSprite
    protected readonly _sprite: Phaser.GameObjects.Sprite
    _src?: string

    constructor(props?: SpriteProps) {
        super()
        const sprite = scene.add.sprite(0, 0, '__MISSING') // Phaser Sprite
        this._refObj = sprite // Reference to Phaser object used in mixins
        this._sprite = sprite // Reference to Phaser object used within this class (for readability)

        this.src = props?.src
        
        // Set mixin props
        this.initPositionable(props)
        this.initSizable(props)
        this.initRotatable(props)
        this.initViewable(props)
        
        // // Temp
        // sprite.eventMode = 'dynamic'
        // // 	sprite.on('mousedown', () => {
        // // 		this.cursor = 'handClosed'
        // // 		// app.renderer.events.setCursor('handClosed')
        // // 	})
        // // 	sprite.on('mouseup', () => {
        // // 		this.cursor = 'handOpen'
        // // 		// app.renderer.events.setCursor('handOpen')
        // // 	})
        allPositionables.push(this)
        // this.hide()
    }
    
    get src() {
        return this._src
    }
    set src(keyOrPath) {
        this._src = keyOrPath
        
        // Undefined; use default 'missing' texture
        if (keyOrPath === undefined) {
            this._sprite.setTexture('__MISSING')
            return
        }
        
        // If using a key, apply existing texture
        if (scene.textures.exists(keyOrPath)) {
            this._sprite.setTexture(keyOrPath)
            return
        }
        
        // Otherwise, loading a new texture from path
        this._sprite.setTexture('__DEFAULT') // Temp?: Use invisible texture while loading

        scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
            this._sprite.setTexture(keyOrPath)
        })
        scene.load.image(keyOrPath, keyOrPath)
        scene.load.start()

        // Investigate handling failed to load resource error
    }

    // Override
    // _updateScale() {
    //     this.setAnchorCenter()
    //     this._sprite.scale.set(this._scale)
    // }

    // async _assignTexture(): Promise<void> {
		// if (this.src) this._sprite.texture = await Assets.load(this.src)
		// this.setAnchorCenter()
	// }
}