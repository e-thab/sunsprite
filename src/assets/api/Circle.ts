import type { ShapeProps } from "./mixins"
import { resizeReactors, scene } from "@api/core"
import Phaser from 'phaser'
import Shape from "./Shape"

function getPhaserColor(colorString: string) {
    return Phaser.Display.Color.HexStringToColor(colorString).color
}


type CircleProps = ShapeProps & {
    /** The distance from the center of the circle to the edge. */
    radius?: number
}

/**
 * Circle class
 */
export default class Circle extends Shape {
    readonly _circle: Phaser.GameObjects.Arc
    _radius: number

    // What should happen when supplying contradictory size/place properties?
    // Just pick one to overwrite and push a warning to the output panel?
    constructor(props?: CircleProps) {
        super()
        
        const circle = scene.add.circle() // Phaser circle
        this._circle = circle
        this._refObj = circle

        // TODO: Look into what happens when radius is set to 0
        this._radius = props?.radius ?? 32
        this.radius = this._radius

        // Set mixin props
        this._initMixins(props)

        // Circles may flicker on creation without this delay
        this._queueShow()
        
        resizeReactors.push(this)
    }

    /** The distance from the center of the circle to the edge. */
    get radius() {
        return this._radius
    }
    set radius(radius: number) {
        this._radius = radius
        this._circle.setRadius(radius)
    }
}