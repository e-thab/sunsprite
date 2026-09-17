import GameObject from "@api/GameObject"
import type { GameObjectProps } from "./mixins"
import { resizeReactors, scene } from "@api/core"
import Phaser from 'phaser'

/**
 * Rectangle class, using position setters from that one WoofJS project
 */

type RectangleProps = GameObjectProps & {
    /** Fill color. */
    color?: string
    /** Outline color. Setting this to null or undefined will clear the outline. */
    outlineColor?: string
    /** Outline width/thickness. */
    outlineWidth?: number
    /** Outline's opacity. Range of 0-1 where 0 is transparent and 1 is opaque. */
    outlineAlpha?: number
    /** Radius of the rectangle's corners. */
    cornerRadius?: number
}

const _outlineDefaults = {
    outlineColor: '#000',
    outlineWidth: 5,
    outlineAlpha: 1
}

export default class Rectangle extends GameObject {
    readonly _rect: Phaser.GameObjects.Rectangle
    _color?: string
    _outlineColor?: string
    _outlineWidth?: number
    _outlineAlpha?: number

	// What should happen when supplying contradictory size/place properties?
	// Just pick one to overwrite and push a warning to the output panel?

    // TODO: Look into the weird paths created when assigning an outline to a rect with rounded corners
	constructor(props?: RectangleProps) {
        super()

        const rect = scene.add.rectangle() // Phaser Rectangle
        this._refObj = rect // Reference to Phaser object used in mixins
        this._rect = rect   // Reference to Phaser object used within this class (for readability)
        
        this._color = props?.color ?? '#fff'
        this.color = this._color

        // If any one outline prop is provided, display an outline with any non-provided set to defaults
        if (props?.outlineColor || props?.outlineWidth || props?.outlineAlpha) {
            this.outlineColor = props.outlineColor ?? _outlineDefaults.outlineColor
            this.outlineWidth = props.outlineWidth ?? _outlineDefaults.outlineWidth
            this.outlineAlpha = props.outlineAlpha ?? _outlineDefaults.outlineAlpha
        }

        if (props?.cornerRadius !== undefined) this.cornerRadius = props.cornerRadius

        // Set mixin props
        this._initMixins(props)

        // Rectangles may flicker on creation without this delay
        this._queueShow()
        
        resizeReactors.push(this)
	}

    /** Fill color. */
    get color(): string | undefined {
        return this._color
    }
    set color(color: string | undefined | null) {
        // Clear fill if undefined or null provided
        if (color === undefined || color === null) {
            this._color = undefined
            this.clearFill()
            return
        }

        // May move color logic to a mixin
        // Also need to implement support for CSS color names for phaser objects
        this._color = color
        const phaserColor = Phaser.Display.Color.HexStringToColor(color).color
        this._rect.setFillStyle(phaserColor)
    }

    /** Outline color. Setting this to null or undefined will clear the outline. */
    get outlineColor(): string | undefined {
        return this._outlineColor
    }
    set outlineColor(color: string | undefined | null) {
        // Clear outline if undefined or null provided
        if (color === undefined || color === null) {
            this._outlineColor = undefined
            this.clearOutline()
            return
        }

        // Use width/alpha defaults if not already defined
        this._outlineColor = color
        const width = this._outlineWidth ?? _outlineDefaults.outlineWidth
        const alpha = this._outlineAlpha ?? _outlineDefaults.outlineAlpha
        this.setOutline(color, width, alpha)
    }

    /** Outline width/thickness. */
    get outlineWidth(): number | undefined {
        return this._outlineWidth
    }
    set outlineWidth(width: number) {
        // Use color/alpha defaults if not already defined
        this._outlineWidth = width
        const color = this._outlineColor ?? _outlineDefaults.outlineColor
        const alpha = this._outlineAlpha ?? _outlineDefaults.outlineAlpha
        this.setOutline(color, width, alpha)
    }

    /** Outline's opacity. Range of 0-1 where 0 is transparent and 1 is opaque. */
    get outlineAlpha(): number | undefined {
        return this._outlineAlpha
    }
    set outlineAlpha(alpha: number) {
        // Use color/width defaults if not already defined
        this._outlineAlpha = alpha
        const color = this._outlineColor ?? _outlineDefaults.outlineColor
        const width = this._outlineWidth ?? _outlineDefaults.outlineWidth
        this.setOutline(color, width, alpha)
    }

    /** Radius of the rectangle's corners. Set to 0 to remove rounding and use default sharp corners. */
    get cornerRadius(): number {
        return this._rect.radius
    }
    set cornerRadius(radius: number) {
        this._rect.setRounded(radius)
    }

    /** Remove rectangle's fill; outline will stay visible if it was already. */
    clearFill() {
        this._color = undefined
        this._rect.setFillStyle()
    }

    /** Remove rectangle's outline; fill will stay visible if it was already. */
    clearOutline() {
        this._outlineColor = undefined
        this._outlineWidth = undefined
        this._outlineAlpha = undefined
        this._rect.setStrokeStyle()
    }

    /**
     * Set each property of the outline all at once. If none are defined, the outline is cleared.
     * @param color Outline color.
     * @param width Outline width/thickness.
     * @param alpha Outline's opacity. Range of 0-1 where 0 is transparent and 1 is opaque.
     */
    setOutline(color?: string, width?: number, alpha?: number) {
        if (color === undefined && width === undefined && alpha === undefined) {
            this.clearOutline()
            return
        }

        const phaserColor = color === undefined ? 0x000000 : Phaser.Display.Color.HexStringToColor(color).color
        this._rect.setStrokeStyle(
            width ?? _outlineDefaults.outlineWidth,
            phaserColor,
            alpha ?? _outlineDefaults.outlineAlpha,
        )
    }
}