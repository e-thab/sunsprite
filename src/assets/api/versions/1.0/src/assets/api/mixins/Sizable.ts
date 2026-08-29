import type { ReferenceObject } from "../types"
import type { Class } from "./shared"

export type SizableProps = {
    /** Horizontal size in pixels. */
    width?: number
    /** Vertical size in pixels. */
    height?: number
    /** Factor to multiply size by. Setting scale to 2 will double its size; 0.5 will halve it. */
    scale?: number // - still needs testing
}

export function Sizable<Base extends Class>(base: Base) {
    return class Sizable extends base {
        _refObj?: ReferenceObject
        _width: number = 0
        _height: number = 0
        _scale: number = 0
        // scaleX / scaleY ?

        constructor(...args: any[]) {
            // What happens when both width//height and scale are provided?
            super()
        }

        _initSizable(props?: SizableProps) {
            // Can't null-ish coalesce bc sprites set their own default width/height
            if ((props?.width !== undefined && props?.scale !== undefined) || (props?.height !== undefined && props?.scale !== undefined)) {
                // Handle conflict between width/scale
            } else {
                if (props?.width !== undefined) this.width = props.width
                if (props?.height !== undefined) this.height = props.height
                if (props?.scale !== undefined) this.scale = props.scale
            }
            // if (props?.width !== undefined) this.width = props.width
            // if (props?.height !== undefined) this.height = props.height
            // this.scale = props?.scale ?? 1 // Can't add this until potential conflict is handled
        }

        /** Horizontal size in pixels. */
        get width(): number {
            if (this._refObj) return this._refObj.displayWidth
            return this._width
        }
        set width(width: number) {
            this._width = width
            if (this._refObj) this._refObj.displayWidth = width
        }

        // A way to reset sprite size to default? Just use scale = 1?
        /** Vertical size in pixels. */
        get height(): number {
            if (this._refObj) return this._refObj.displayHeight
            return this._height
        }
        set height(height: number) {
            this._height = height
            if (this._refObj) this._refObj.displayHeight = height
        }

        /** Factor to multiply size by. Setting scale to 2 will double its size; 0.5 will halve it. */
        get scale(): number {
            if (this._refObj) return this._refObj.scale // Assuming uniform scale for now
            return this._scale
        }
        set scale(scale: number) {
            this._scale = scale
            this._updateScale()
        }

        // TODO: fitInside(?): XI setSize logic, fit this shape within another shape, preserving aspect

        _updateScale() {
            // if (this._refObj) this._refObj.scale.set(this._scale)
            if (this._refObj) this._refObj.scale = this._scale
        }
    }
}
