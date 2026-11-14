import type { ReferenceObject } from "@api/types"
import type { Class } from "@mixins/shared"
import { camera, pinReactors } from "@api/core"

export type SizableProps = {
    /** Horizontal size in pixels. */
    width?: number
    /** Vertical size in pixels. */
    height?: number
    /** Factor to multiply size by. Setting scale to 2 will double its size; 0.5 will halve it. */
    scale?: number // - still needs testing
    /** Keeps this object the same size on the screen as the camera zooms. */
    pinned?: boolean
}

export function Sizable<Base extends Class>(base: Base) {
    return class Sizable extends base {
        _refObj?: ReferenceObject
        _width: number = 0
        _height: number = 0
        _scale: number = 1
        // scaleX / scaleY ?
        _scalePinned: boolean = false
        /** Camera zoom the current size was last matched to while pinned. */
        _pinnedZoom: number = 1
        /** Registered with core while pinned; Camera runs it after moving or zooming. */
        _syncPinnedScale = () => {
            const zoom = camera.zoom
            if (zoom === this._pinnedZoom || zoom === 0) return
            const factor = this._pinnedZoom / zoom
            this._pinnedZoom = zoom
            // Resized through width/height rather than scale: those are what every
            // subclass overrides consistently, and Sizable's own scale setter would
            // flatten a sprite stretched by width/height back to a uniform scale.
            // Both are read first, since Circle's height setter also sets its width.
            const width = this.width
            const height = this.height
            this.width = width * factor
            this.height = height * factor
        }

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
            if (props?.pinned) this._pinScale()
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

        /** Factor to multiply width by. Setting scaleX to 2 will double its width; 0.5 will halve it. */
        
        /** Factor to multiply height by. Setting scaleY to 2 will double its height; 0.5 will halve it. */

        /**
         * Whether this object stays the same size on the screen as the camera zooms, like a UI
         * element. Resizing a pinned object keeps it pinned at its new size. Setting this is the
         * same as calling pin() or unpin().
         */
        get pinned(): boolean {
            return this._scalePinned
        }
        set pinned(pinned: boolean) {
            if (pinned) this.pin()
            else this.unpin()
        }

        /** Keep this object the same size on the screen, whatever its size is right now, as the camera zooms. */
        pin() {
            this._pinScale()
        }

        /** Stop keeping this object the same size on the screen. It keeps its current size in the world. */
        unpin() {
            this._unpinScale()
        }

        _pinScale() {
            if (this._scalePinned) return
            this._pinnedZoom = camera.zoom
            this._scalePinned = true
            pinReactors.add(this._syncPinnedScale)
        }

        _unpinScale() {
            if (!this._scalePinned) return
            this._scalePinned = false
            pinReactors.delete(this._syncPinnedScale)
        }

        // TODO: fitInside(?): XI setSize logic, fit this shape within another shape, preserving aspect

        _updateScale() {
            // if (this._refObj) this._refObj.scale.set(this._scale)
            if (this._refObj) this._refObj.scale = this._scale
        }
    }
}
