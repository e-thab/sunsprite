import type { ReferenceObject } from "@api/types"
import type { Class } from "@mixins/shared"

export type ViewableProps = {
    /** Transparency, decimal value that ranges from 0.0 (transparent) to 1.0 (opaque). */
    alpha?: number
    /** The render order. Objects with higher layer values will show in front of objects with lower values. */
    layer?: number
    /** Whether this object is currently visible. */
    visible?: boolean
}

export function Viewable<Base extends Class>(base: Base) {
    return class Viewable extends base {
        // TODO (Viewable):
        // - tint
        // - blend mode
        // - effects?

        _refObj?: ReferenceObject
        _alpha: number = 1
        _layer: number = 0
        _visible: boolean = true

        _queueShowWaiting: boolean = false
        _queueShowCanceled: boolean = false

        constructor(...args: any[]) {
            super()
        }

        _initViewable(props?: ViewableProps) {
            if (props?.alpha != undefined) this.alpha = props.alpha
            if (props?.layer != undefined) this.layer = props.layer
            if (props?.visible != undefined) this.visible = props.visible
        }
        
        _queueShow() {
            // Visible objects may flicker on create without this delay
            if (!this._refObj) return

            if (this.visible) {
                this._refObj.setVisible(false)
                this._queueShowWaiting = true
                new Promise(resolve => setTimeout(resolve, 0)).then(() => {
                    this._refObj.setVisible(!this._queueShowCanceled)
                    this._queueShowWaiting = false
                    this._queueShowCanceled = false
                })
            }
        }

        /** Transparency, decimal value that ranges from 0.0 (transparent) to 1.0 (opaque). */
        get alpha(): number {
            return this._alpha
        }
        set alpha(alpha: number) {
            this._alpha = alpha
            if (this._refObj) this._refObj.setAlpha(alpha)
        }

        // Update for phaser
        /** The render order. Objects with higher layer values will show in front of objects with lower values. */
        get layer(): number {
            return this._layer
        }
        set layer(layer: number) {
            this._layer = layer
            if (this._refObj) this._refObj.setDepth(layer)
        }

        /** Whether this object is currently visible. */
        get visible(): boolean {
            return this._visible
        }
        set visible(visible: boolean) {
            this._visible = visible

            if (this._refObj) {
                if (visible) {
                    this.show()
                } else {
                    this.hide()
                }
            }
        }

        /** Show this object. */
        show() {
            if (this._refObj) this._refObj.setVisible(true)
        }

        /** Hide this object. */
        hide() {
            if (this._queueShowWaiting) this._queueShowCanceled = true
            if (this._refObj) this._refObj.setVisible(false)
        }

        _sendToFrontLayer() {
            // temp private
            // TODO: Send to front layer
        }

        _sendToBackLayer() {
            // temp private
            // TODO: Send to back layer
        }

        // layerUp() {
        // }
        // layerDown() {
        // }
        _sendToLayerAbove(other: Viewable) {
            // temp private
            // TODO: Send to layer above other
        }
        _sendToLayerBelow(other: Viewable) {
            // temp private
            // TODO: Send to layer below other
        }
    }
}
