import type { ReferenceObject } from "../types"
import type { Class } from "./shared"

export type ViewableProps = {
    alpha?: number
    layer?: number
    visible?: boolean
}

const propDescription: Record<keyof ViewableProps, string> = {
    alpha: `Transparency, decimal value that ranges from 0.0 (transparent) to 1.0 (opaque).`,
    layer: `The render order. Objects with higher layer values will show in front of objects with lower values.`,
    visible: `Whether this object is currently visible.`,
}

export const viewablePropsTypeDef = `
type ViewableProps = {
    /** ${propDescription.alpha} */
    alpha?: number

    /** ${propDescription.layer} */
    layer?: number

    /** ${propDescription.visible} */
    visible?: boolean
}`
export const viewableApi = [
    // Props
    `/** ${propDescription.alpha} */
    alpha: number`,

    `/** ${propDescription.layer} */
    layer: number`,

    `/** ${propDescription.visible} */
    visible: boolean`,

    // Methods
    `/** Show this object. */
    show(): void`,

    `/** Hide this object. */
    hide(): void`,
].join('\n')

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

        constructor(...args: any[]) {
            super()
        }

        initViewable(props?: ViewableProps) {
            if (props?.alpha != null) this.alpha = props.alpha
            if (props?.layer != null) this.layer = props.layer
            if (props?.visible != null) this.visible = props.visible
        }

        queueShow() {
            // Visible objects may flicker on create without this delay
            if (!this._refObj) return

            if (this.visible) {
                this._refObj.setVisible(false)
                new Promise(resolve => setTimeout(resolve, 0)).then(() => this._refObj.setVisible(true))
            }
        }

        get alpha(): number {
            return this._alpha
        }
        set alpha(alpha: number) {
            this._alpha = alpha
            if (this._refObj) this._refObj.setAlpha(alpha)
        }

        // Update for phaser
        get layer(): number {
            return this._layer
        }
        set layer(layer: number) {
            this._layer = layer
            if (this._refObj) this._refObj.setDepth(layer)
        }

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

        show() {
            if (this._refObj) this._refObj.visible = true
        }

        hide() {
            if (this._refObj) this._refObj.visible = false
        }

        sendToFrontLayer() {
            // TODO: Send to front layer
        }

        sendToBackLayer() {
            // TODO: Send to back layer
        }

        // layerUp() {
        // }
        // layerDown() {
        // }
        sendToLayerAbove(other: Viewable) {
            // TODO: Send to layer above other
        }
        sendToLayerBelow(other: Viewable) {
            // TODO: Send to layer below other
        }
    }
}
