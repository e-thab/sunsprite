import type { ShapeProps } from "./mixins"
import { resizeReactors, scene } from "@api/core"
import Phaser from 'phaser'
import Shape from "./Shape"

function getPhaserColor(colorString: string) {
    return Phaser.Display.Color.HexStringToColor(colorString).color
}


type CircleProps = ShapeProps & {
    /**
     * Distance in pixels from the center of the circle to the edge.
     * @default 64
     */
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
        this._radius = props?.radius ?? 64
        this.radius = this._radius

        // Set mixin props
        this._initMixins(props)

        // Circles may flicker on creation without this delay
        this._queueShow()
        
        resizeReactors.push(this)
    }

    /** Distance in pixels from the center of the circle to the edge. */
    get radius() {
        return this._radius
    }
    set radius(radius: number) {
        this._radius = radius
        this._redraw()
    }

    /**
     * Horizontal size in pixels: the circle's diameter. Setting this changes height
     * to match, and radius to width/2.
     */
    get width(): number {
        return this._radius * 2 * this._scale
    }
    set width(width: number) {
        this.radius = this._unscaled(width) / 2
    }

    /**
     * Vertical size in pixels: the circle's diameter. Setting this changes width
     * to match, and radius to height/2.
     */
    get height(): number {
        return this.width
    }
    set height(height: number) {
        this.width = height
    }

    /** Shape override, resizes hitArea and uses setRadius to consistently resize geometry. */
    _redraw() {
        const r = this._radius * this._scale
        this._circle.setRadius(r)

        // Resize hit circle
        const hitArea = this._circle.input?.hitArea as Phaser.Geom.Circle | undefined
        hitArea?.setTo(r, r, r)
    }

    // Override to set interactive with a circular hit area
    _setInteractive() {
        // Set's phaser object's interactive state if it isn't already
        if (!this._refObj) return

        const r = this._radius * this._scale
        if (!this._isInteractive) {
            this._refObj.setInteractive(new Phaser.Geom.Circle(r, r, r), Phaser.Geom.Circle.Contains)
            this._isInteractive = true
        }
        scene.input.setDraggable(this._refObj, this._draggable)
    }
}