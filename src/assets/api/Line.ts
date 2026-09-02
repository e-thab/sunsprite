// Calculate distance from a line only on the axis perpendicular to it.
// i.e. for a vertical line, distanceTo(line) returns only the distance on x

import type { Returnable } from "./types";
import { _clearPropUpdater, _registerPropUpdater, resizeReactors, camera, getNextObjectId, scene } from "./core";
import { pointFrom, type Point, type PointArg } from "./Point";
import { Rotatable, Timeable, Viewable, type RotatableProps, type ViewableProps } from "./mixins";
import Phaser from "phaser";

type LineProps = RotatableProps & ViewableProps & {
    /** Position of end point A. */
    pointA?: Returnable<PointArg>
    /** Position of end point B. */
    pointB?: Returnable<PointArg>
    /** The color of the line. */
    color?: string
    /** The thickness of the line. (Default = 2) */
    thickness?: number // weight?
}

export default class Line extends 
    Rotatable(
    Viewable(
    Timeable(class {
        constructor() {}
    }))) {

    readonly _line: Phaser.GameObjects.Line

    _pointA: Point
    _pointB: Point
    _color: string = '#fff'
    _thickness: number = 2 // Line thickness 1 seems to visually reduce the alpha, look into this
    _id: string = getNextObjectId()
    // _updatingPointA: boolean = false
    // _updatingPointB: boolean = false

    constructor(props?: LineProps) {
        super()

        const line = scene.add.line(0, 0, 0, 0, 0, 0, this._colorNum)
        this._refObj = line
        this._line = line

        // this.initRotatable(props) -- how will this work?
        this._initViewable(props)
        // this.alpha = 10

        this._pointA = { x: 0, y: 0 }
        this._pointB = { x: 100, y: 100 }

        if (props?.pointA) this.pointA = props.pointA
        if (props?.pointB) this.pointB = props.pointB
        if (props?.color) this.color = props.color

        this.thickness = props?.thickness ?? 2

        this._updatePoints()
        resizeReactors.push(this)

        // Should probably push to a list of lines in core like positionables do,
        // end points don't update when screen size changes / camera moves etc.

        // this.queueShow()
    }
    
    /** Position of end point A. */
    get pointA(): Point {
        return this._pointA
    }
    set pointA(pointA: Returnable<PointArg>) {
        // To make these returnable setters work, each object and property needs a unique
        // ID, built with an incrementing integer from core for the object and just a
        // string for the property name.
        const propId = this._id + 'pointA'

        if (typeof pointA === 'function') {
            _registerPropUpdater(propId, () => {
                this._pointA = pointFrom(pointA())
                this._updatePoints()
            })
            return
        }
        _clearPropUpdater(propId)
        this._pointA = pointFrom(pointA)
        this._updatePoints()
    }
    
    /** Position of end point B. */
    get pointB(): Point {
        return this._pointB
    }
    set pointB(pointB: Returnable<PointArg>) {
        // Template for how 
        const propId = this._id + 'pointB'

        if (typeof pointB === 'function') {
            _registerPropUpdater(propId, () => {
                this._pointB = pointFrom(pointB())
                this._updatePoints()
            })
            return
        }
        _clearPropUpdater(propId)
        this._pointB = pointFrom(pointB)
        this._updatePoints()
    }

    get _colorNum(): number {
        return Phaser.Display.Color.HexStringToColor(this._color).color
    }

    /** The color of the line. */
    get color(): string {
        return this._color
    }
    set color(color: string) {
        this._color = color
        this._line.setStrokeStyle(this.thickness, this._colorNum, this.alpha)
    }

    /** The thickness of the line. */
    get thickness(): number {
        return this._thickness
    }
    set thickness(thickness: number) {
        this._thickness = thickness
        // this._line.setStrokeStyle(thickness, this._colorNum, this.alpha)
        this._line.setLineWidth(thickness)
    }

    /** The distance between point A and point B. */
    get length(): number {
        return Math.sqrt(
            (this.pointA.x - this.pointB.x) ** 2
            + (this.pointA.y - this.pointB.y) ** 2
        )
    }

    /** Set both endpoints of the line at once. */
    setPoints(pointA: PointArg, pointB: PointArg) {
        this._pointA = pointFrom(pointA)
        this._pointB = pointFrom(pointB)
        this._updatePoints()
    }

    _updatePoints() {
        this._line.setTo(
            this.pointA.x + camera.width / 2 * camera.zoom,
            -this.pointA.y + camera.height / 2 * camera.zoom,
            this.pointB.x + camera.width / 2 * camera.zoom,
            -this.pointB.y + camera.height / 2 * camera.zoom
        )
    }

    _onResize() {
        this._updatePoints()
    }
}