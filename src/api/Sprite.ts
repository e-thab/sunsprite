import type { GameObjectProps } from "./mixins"
import { scene, resizeReactors } from "@api/core"
import GameObject from "@api/GameObject"
import { _imageSourceStatus, type ImageSource } from "@api/assets"
import Phaser from "phaser"
import Output from "@/sandbox/output"
import { currentLocation } from "./moduleRunner"
import { _hexStringToColor } from "./Colors"
// import type { Sprite } from 'phaser'

/*
 * Simplified sprite class, mimics WoofJS style
 * 
 * TODO:
 *  - flipX / flipY
 *  - scaleX / scaleY ?
 *  - pivot / anchor ?
 *  - distanceTo
 *  - lastX / lastY
 *  - move?
 * 	- hitbox
 * 	- animation
*/

export enum TintMode {
    ADD = 'add',
    MULTIPLY = 'multiply',
    FILL = 'fill',
    HARD_LIGHT = 'hard_light',
    OVERLAY = 'overlay',
    SCREEN = 'screen'
}

/** How a sprite's tint color is combined with its image. See Sprite.tintMode. */
export type TintModeName = `${TintMode}`

function _phaserTintMode(mode: TintMode): Phaser.TintModes {
    switch (mode) {
        case TintMode.ADD:
            return Phaser.TintModes.ADD
        case TintMode.FILL:
            return Phaser.TintModes.FILL
        case TintMode.HARD_LIGHT:
            return Phaser.TintModes.HARD_LIGHT
        case TintMode.MULTIPLY:
            return Phaser.TintModes.MULTIPLY
        case TintMode.OVERLAY:
            return Phaser.TintModes.OVERLAY
        case TintMode.SCREEN:
            return Phaser.TintModes.SCREEN
    }
}

function isTintMode(value: unknown): value is TintMode {
    return Object.values(TintMode).includes(value as any)
}

type SpriteProps = GameObjectProps & {
    /** The sprite's image: the name of an image file in your project, like 'player.png', or a URL. */
    src?: ImageSource
}

export default class Sprite extends GameObject {
    readonly _sprite: Phaser.GameObjects.Sprite
    _src?: string
    _tint: string = '#ffffff'
    _tintTopLeft: string = '#ffffff'
    _tintTopRight: string = '#ffffff'
    _tintBottomLeft: string = '#ffffff'
    _tintBottomRight: string = '#ffffff'
    _tintMode: TintMode = TintMode.MULTIPLY
    
    constructor(props?: SpriteProps) {
        super()
        const sprite = scene.add.sprite(0, 0, '__MISSING') // Phaser Sprite
        this._refObj = sprite // Reference to Phaser object used in mixins
        this._sprite = sprite // Reference to Phaser object used within this class (for readability)
        
        this.src = props?.src
        // Set mixin props
        this._initMixins(props)
        
        // Sprites may flicker on creation without this delay
        this._queueShow()
        
        resizeReactors.push(this)
    }
    
    /** The sprite's image: the name of an image file in your project, like 'player.png', or a URL. */
    get src(): string | undefined {
        return this._src
    }
    set src(keyOrPath: ImageSource | undefined | null) {
        this._src = keyOrPath ?? undefined
        
        // Undefined; use default 'missing' texture
        if (keyOrPath === undefined || keyOrPath === null) {
            this._sprite.setTexture('__MISSING')
            return
        }
        
        // A project file (preloaded under its own name) or a texture loaded
        // earlier applies right away. A bare name that matches neither has
        // already been reported, and shows the 'missing' texture so the
        // sprite is still visible where the image would have been.
        const status = _imageSourceStatus(scene.textures, keyOrPath)
        if (status === 'ready') {
            this._sprite.setTexture(keyOrPath)
            return
        }
        if (status === 'missing') {
            this._sprite.setTexture('__MISSING')
            return
        }

        // Otherwise, loading a new texture from path
        this._sprite.setTexture('__DEFAULT') // Temp?: Use invisible texture while loading

        // TODO: Add svg support. Should load as svg instead of image, and will need to override
        // some scalable methods to include new scale as object size args for load.svg, i.e.:
        // this.load.svg('pointer_c', 'cursors/pointer_c.svg', { width: 400, height: 400 })
        // Additionally, look into svg exploits (like Scratch malware injection)
        scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
            // A failed load has been reported by assets.ts's loader error
            // handler; setTexture on the missing key falls back to __MISSING.
            this._sprite.setTexture(keyOrPath)
        })
        scene.load.image(keyOrPath, keyOrPath)
        scene.load.start()
    }

    /** Whether this sprite is tinted with some color. */
    get isTinted(): boolean {
        return this._sprite.isTinted
    }

    /**
     * Tint mode applied when drawing a tint on the sprite's texture.
     * 
     * | Mode | Effect |
     * | ---- | ------ |
     * | 'Add' | Tint color is added to texture color. |
     * | 'Fill' | Tint color is used to fill the sprite with a solid color. |
     * | 'Hard_Light' | Tint color brightens light areas and darkens dark areas. Like overlay, but with tint colors swapped. |
     * | 'Multiply' (default) | Tint color is multiplied with texture color. |
     * | 'Overlay' | Tint color brightens light areas and darkens dark areas. |
     * | 'Screen' | Tint color brightens dark areas. |
     */
    get tintMode(): TintModeName {
        return this._tintMode
    }
    set tintMode(mode: string) {
        mode = mode.toLowerCase()
        if (!isTintMode(mode)) {
            Output.runtimeWarning(`Invalid tint mode, must be one of: ['add', 'fill', 'hard_light', 'multiply', 'overlay', 'screen']. Ignoring this command.`, currentLocation())
            return
        }
        this._tintMode = mode
        this._sprite.setTintMode(_phaserTintMode(mode))
    }

    get tint(): string {
        return this._tint
    }
    set tint(color: string) {
        this._tint = color
        this._tintTopLeft = color
        this._tintTopRight = color
        this._tintBottomLeft = color
        this._tintBottomRight = color
        this._sprite.setTint(_hexStringToColor(color))
    }

    get _tintHexColors() {
        return {
            tintTopLeft: _hexStringToColor(this._tintTopLeft),
            tintTopRight: _hexStringToColor(this._tintTopRight),
            tintBottomLeft: _hexStringToColor(this._tintBottomLeft),
            tintBottomRight: _hexStringToColor(this._tintBottomRight),
        }
    }

    setTint(allOrTopLeft: string, topRight?: string, bottomLeft?: string, bottomRight?: string) {
        this._tint = allOrTopLeft
        this._tintTopLeft = allOrTopLeft
        this._tintTopRight = topRight ?? allOrTopLeft
        this._tintBottomLeft = bottomLeft ?? allOrTopLeft
        this._tintBottomRight = bottomRight ?? allOrTopLeft
        const { tintTopLeft, tintTopRight, tintBottomLeft, tintBottomRight } = this._tintHexColors
        this._sprite.setTint(tintTopLeft, tintTopRight, tintBottomLeft, tintBottomRight)
    }

    clearTint() {
        this._tint = '#ffffff'
        this._tintTopLeft = '#ffffff'
        this._tintTopRight = '#ffffff'
        this._tintBottomLeft = '#ffffff'
        this._tintBottomRight = '#ffffff'
        this._tintMode = TintMode.MULTIPLY
        this._sprite.clearTint()
    }

    hideTint() {
        this._sprite.clearTint()
    }

    showTint() {
        const { tintTopLeft, tintTopRight, tintBottomLeft, tintBottomRight } = this._tintHexColors
        this._sprite.setTint(tintTopLeft, tintTopRight, tintBottomLeft, tintBottomRight)
    }

    get tintTopLeft(): string {
        return this._tintTopLeft
    }
    set tintTopLeft(color: string) {
        this._tint = color
        this._tintTopLeft = color
        this._sprite.tintTopLeft = _hexStringToColor(color)
    }

    get tintTopRight(): string {
        return this._tintTopRight
    }
    set tintTopRight(color: string) {
        this._tintTopRight = color
        this._sprite.tintTopRight = _hexStringToColor(color)
    }

    get tintBottomLeft(): string {
        return this._tintBottomLeft
    }
    set tintBottomLeft(color: string) {
        this._tintBottomLeft = color
        this._sprite.tintBottomLeft = _hexStringToColor(color)
    }

    get tintBottomRight(): string {
        return this._tintBottomRight
    }
    set tintBottomRight(color: string) {
        this._tintBottomRight = color
        this._sprite.tintBottomRight = _hexStringToColor(color)
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