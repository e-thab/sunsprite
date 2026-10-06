import type { Class } from "@mixins/shared"
import type { Optional } from "../types"
import Phaser from "phaser"

const _outlineDefaults = {
    outlineColor: '#000',
    outlineWidth: 5,
    outlineAlpha: 1
}

export type OutlinableProps = {
    /** Outline color. Setting this to null or undefined will clear the outline. */
    outlineColor?: string
    /** Outline width/thickness. */
    outlineWidth?: number
    /** Outline's opacity. Range of 0-1 where 0 is transparent and 1 is opaque. */
    outlineAlpha?: number
}

export function Outlinable<Base extends Class>(base: Base) {
    return class Outlinable extends base {
        _refObj?: Phaser.GameObjects.Shape
        _outlineColor?: string
        _outlineWidth?: number
        _outlineAlpha?: number

        constructor(...args: any[]) {
            super()
        }

        _initOutlinable(props?: OutlinableProps) {
            // If any one outline prop is provided, display an outline with any non-provided set to defaults
            if (props?.outlineColor || props?.outlineWidth || props?.outlineAlpha) {
                this.outlineColor = props.outlineColor ?? _outlineDefaults.outlineColor
                this.outlineWidth = props.outlineWidth ?? _outlineDefaults.outlineWidth
                this.outlineAlpha = props.outlineAlpha ?? _outlineDefaults.outlineAlpha
            }
        }

        /** Outline color. Setting this to null or undefined will clear the outline. */
        get outlineColor(): string | undefined {
            return this._outlineColor
        }
        set outlineColor(color: Optional<string>) {
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

        /** Remove rectangle's outline; fill will stay visible if it was already. */
        clearOutline() {
            if (!this._refObj) return
            this._outlineColor = undefined
            this._outlineWidth = undefined
            this._outlineAlpha = undefined
            this._refObj.setStrokeStyle()
        }

        /**
         * Set each property of the outline all at once. If none are defined, the outline is cleared.
         * @param color Outline color.
         * @param width Outline width/thickness.
         * @param alpha Outline's opacity. Range of 0-1 where 0 is transparent and 1 is opaque.
         */
        setOutline(color?: string, width?: number, alpha?: number) {
            if (!this._refObj) return
            
            if (color === undefined && width === undefined && alpha === undefined) {
                this.clearOutline()
                return
            }

            const phaserColor = color === undefined ? 0x000000 : Phaser.Display.Color.HexStringToColor(color).color
            this._refObj.setStrokeStyle(
                width ?? _outlineDefaults.outlineWidth,
                phaserColor,
                alpha ?? _outlineDefaults.outlineAlpha,
            )
        }
    }
}