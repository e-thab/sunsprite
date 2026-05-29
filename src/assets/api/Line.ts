// Calculate distance from a line only on the axis perpendicular to it.
// i.e. for a vertical line, distanceTo(line) returns only the distance on x

import { scene, screen } from "./core";
import { getPoint, type Point, type ParamPoint } from "./interfaces";
import { Rotatable, Timeable, Viewable, type RotatableProps, type ViewableProps } from "./mixins";
import Phaser from "phaser";

type LineProps = RotatableProps & ViewableProps & {
    /* ... */
    pointA?: Point
    pointB?: Point
    color?: string
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

    constructor(props?: LineProps) {
        super()

        const line = scene.add.line(0, 0, 0, 0, 0, 0, this._colorNum)
        this._refObj = line
        this._line = line

        // this.initRotatable(props) -- how will this work?
        this.initViewable(props)
        // this.alpha = 10

        this._pointA = { x: 0, y: 0 }
        this._pointB = { x: 100, y: 100 }

        if (props?.pointA) this.pointA = props.pointA
        if (props?.pointB) this.pointB = props.pointB
        if (props?.color) this.color = props.color

        this.thickness = props?.thickness ?? 2

        this._updatePoints()

        // Should probably push to a list of lines in core like positionables do,
        // end points don't update when screen size changes / camera moves etc.

        // this.queueShow()
    }
    
    get pointA(): Point {
        return this._pointA
    }
    set pointA(pointA: ParamPoint) {
        // const startPoint = getGamePoint(start)
        // this._line.setTo(startPoint.x, startPoint.y)
        this._pointA = getPoint(pointA)
        this._updatePoints()
    }

    get pointB(): Point {
        return this._pointB
    }
    set pointB(pointB: ParamPoint) {
        // const endPoint = getGamePoint(end)
        // const startPoint = getGamePoint(this._start)
        // this._line.setTo(startPoint.x, startPoint.y, endPoint.x, endPoint.y)
        this._pointB = getPoint(pointB)
        this._updatePoints()
    }

    get _colorNum(): number {
        return Phaser.Display.Color.HexStringToColor(this._color).color
    }

    get color(): string {
        return this._color
    }
    set color(color: string) {
        this._color = color
        this._line.setStrokeStyle(this.thickness, this._colorNum, this.alpha)
    }

    get thickness(): number {
        return this._thickness
    }
    set thickness(thickness: number) {
        this._thickness = thickness
        // this._line.setStrokeStyle(thickness, this._colorNum, this.alpha)
        this._line.setLineWidth(thickness)
    }

    get length(): number {
        return Math.sqrt(
            (this.pointA.x - this.pointB.x) ** 2
            + (this.pointA.y - this.pointB.y) ** 2
        )
    }

    setPoints(pointA: ParamPoint, pointB: ParamPoint) {
        this._pointA = getPoint(pointA)
        this._pointB = getPoint(pointB)
        this._updatePoints()
    }

    _updatePoints() {
        this._line.setTo(
            this._pointA.x + screen.right,
            -this._pointA.y + screen.top,
            this._pointB.x + screen.right,
            -this._pointB.y + screen.top
        )
    }
}