import { resizeReactors, scene } from "@api/core"
import type { ShapeProps } from "./mixins"
import type { Optional } from "./types"
import Phaser from 'phaser'
import Shape from "./Shape"

type RectangleProps = ShapeProps & {
    /** Radius of the rectangle's corners. */
    cornerRadius?: number
}

/**
 * Rectangle class
 */
export default class Rectangle extends Shape {
    readonly _rect: Phaser.GameObjects.Rectangle

	// What should happen when supplying contradictory size/place properties?
	// Just pick one to overwrite and push a warning to the output panel?

    // TODO: Look into the weird paths created when assigning an outline to a rect with rounded corners
	constructor(props?: RectangleProps) {
        super()

        const rect = scene.add.rectangle() // Phaser Rectangle
        this._refObj = rect // Reference to Phaser object used in mixins
        this._rect = rect   // Reference to Phaser object used within this class (for readability)

        if (props?.cornerRadius !== undefined) this.cornerRadius = props.cornerRadius

        // Set mixin props
        this._initMixins(props)

        // Rectangles may flicker on creation without this delay
        this._queueShow()
        
        resizeReactors.push(this)
	}

    /** Radius of the rectangle's corners. Set to 0 to remove rounding and use default sharp corners. */
    get cornerRadius(): number {
        return this._rect.radius
    }
    set cornerRadius(radius: number) {
        this._rect.setRounded(radius)
    }
}