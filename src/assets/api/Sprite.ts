import GameObject from "./GameObject"
import type { GameObjectProps } from "./mixins"

import { scene, loader, allPositionables } from "./corephaser"
import Phaser from "phaser"
// import type { Sprite } from 'phaser'

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
    // readonly _sprite: PixiSprite
    readonly _sprite: Phaser.GameObjects.Sprite
    _src?: string

    constructor(props?: SpriteProps) {
        super()
        const sprite = scene.add.sprite(0, 0, '__MISSING') // Phaser Sprite
        this._refObj = sprite // Reference to Phaser object used in mixins
        this._sprite = sprite // Reference to Phaser object used in this class (for readability)
        
        // this.hide()
		// this.src = props?.src ?? 'gator'
        // if (props?.src) this.src = props.src
        this.src = props?.src

        // Set mixin props
        this.initPositionable(props)
        // this.setAnchorCenter()
        // this.initSizable(props)
        // this.initSizable({
        //     width: props?.width ?? sprite.getBounds().width,
        //     height: props?.height ?? sprite.getBounds().height,
        //     scale: props?.scale ?? 1
        // })
        // this.initSizable({
        //     width: props?.width ?? sprite.getBounds().width,
        //     height: props?.height ?? sprite.getBounds().height,
        //     scale: props?.scale ?? 1
        // })
        this.initSizable(props)
        this.initRotatable(props)
        // this.initViewable(props)
        
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

        // app.stage.addChild(sprite)
        allPositionables.push(this)
    }
    
    get src() {
        return this._src
    }
    set src(keyOrPath) {
        // Need to investigate how to do this programmatically with Phaser
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

        // Esoteric temp load string to prevent accidentally overwriting a user-written img key
        // Change this to just check if 'temp' already exists and start adding random chars until unique
        scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
            this._sprite.setTexture(keyOrPath)
        })
        scene.load.image(keyOrPath, keyOrPath)
        scene.load.start()
    }

    // get anchorX() {
    //     return this._sprite.anchor.x
    // }
    // set anchorX(newX) {
    //     this._sprite.anchor.x = newX
    // }

    // get anchorY() {
    //     return this._sprite.anchor._y
    // }
    // set anchorY(newY) {
    //     this._sprite.anchor.y = newY
    // }

    // Override
    // _updateScale() {
    //     this.setAnchorCenter()
    //     this._sprite.scale.set(this._scale)
    // }

    // setAnchorCenter(): void {
    //     this._sprite.anchor.set(0.5)
    // }

    // async _assignTexture(): Promise<void> {
		// if (this.src) this._sprite.texture = await Assets.load(this.src)
		// this.setAnchorCenter()
	// }
}