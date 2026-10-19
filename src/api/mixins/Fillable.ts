import type { Class } from "@mixins/shared"
import type { Optional } from "../types"
import Phaser from "phaser"

export type FillableProps = {
    /** Fill color. */
    color?: string
    /** Fill opacity. Range of 0-1 where 0 is transparent and 1 is opaque. */
    fillAlpha?: number // todo
}

export function Fillable<Base extends Class>(base: Base) {
    return class Fillable extends base {
        _refObj?: Phaser.GameObjects.Shape
        _color?: string

        constructor(...args: any[]) {
            super()
        }

        _initFillable(props?: FillableProps) {
            this._color = props?.color ?? '#fff'
            this.color = this._color
        }

        /** Fill color. */
        get color(): string | undefined {
            return this._color
        }
        set color(color: Optional<string>) {
            // Clear fill if undefined or null provided
            if (color === undefined || color === null) {
                this._color = undefined
                this.clearFill()
                return
            }

            // Also need to implement support for CSS color names for phaser objects
            this._color = color
            const phaserColor = Phaser.Display.Color.HexStringToColor(color).color
            this._refObj?.setFillStyle(phaserColor)
        }

        /** Remove fill (set to transparent); outline will stay visible if it was already. */
        clearFill() {
            if (!this._refObj) return
            this._color = undefined
            this._refObj.setFillStyle()
        }
    }
}