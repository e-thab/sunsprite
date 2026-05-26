import GameObject from "./GameObject"
import type { GameObjectProps } from "./mixins"

import { scene, allPositionables } from "./core"
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
    readonly _sprite: Phaser.GameObjects.Sprite
    _src?: string

    constructor(props?: SpriteProps) {
        super()
        const sprite = scene.add.sprite(0, 0, '__MISSING') // Phaser Sprite
        this._refObj = sprite // Reference to Phaser object used in mixins
        this._sprite = sprite // Reference to Phaser object used within this class (for readability)
        
        this.src = props?.src
        
        // Set mixin props
        this.initMixins(props)
        // Rectangles may flicker on creation without this delay
        this.queueVisible()
        
        allPositionables.push(this)
    }
    
    get src() {
        return this._src
    }
    set src(keyOrPath: string | undefined | null) {
        this._src = keyOrPath ?? undefined
        
        // Undefined; use default 'missing' texture
        if (keyOrPath === undefined || keyOrPath === null) {
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

        // TODO: Add svg support. Should load as svg instead of image, and will need to override
        // some scalable methods to include new scale as object size args for load.svg, i.e.:
        // this.load.svg('pointer_c', 'cursors/pointer_c.svg', { width: 400, height: 400 })
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