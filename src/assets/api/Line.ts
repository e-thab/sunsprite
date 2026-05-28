// TODO: everything
//
// Calculate distance from a line only on the axis perpendicular to it.
// i.e. for a vertical line, distanceTo(line) returns only the distance on x

import { scene, screen } from "./core";
import type { Point } from "./interfaces";
import { Rotatable, Timeable, Viewable, type RotatableProps, type ViewableProps } from "./mixins";

type LineProps = RotatableProps & ViewableProps & {
    /* ... */
    start?: Point
    end?: Point
    color?: string
    thickness?: number
}

export default class Line extends 
    Rotatable(
    Viewable(
    Timeable(class {
        constructor() {}
    }))) {

    readonly _line: Phaser.GameObjects.Line

    _start: Point
    _end: Point

    constructor(props?: LineProps) {
        super()

        const line = scene.add.line(0, 0, 0, 0, 0, 0, 0xffffff)
        this._refObj = line
        this._line = line

        this.initRotatable(props)
        this.initViewable(props)

        this._start = { x: 0, y: 0 }
        this._end = { x: 100, y: 100 }

        if (props?.start) this.start = props.start
        if (props?.end) this.end = props.end

        this._updatePoints()

        // this.queueShow()
    }
    
    get start(): Point {
        return this._start
    }
    set start(start: Point) {
        // const startPoint = getGamePoint(start)
        // this._line.setTo(startPoint.x, startPoint.y)
        this._start = start
        this._updatePoints()
    }

    get end(): Point {
        return this._end
    }
    set end(end: Point) {
        // const endPoint = getGamePoint(end)
        // const startPoint = getGamePoint(this._start)
        // this._line.setTo(startPoint.x, startPoint.y, endPoint.x, endPoint.y)
        this._end = end
        this._updatePoints()
    }

    _updatePoints() {
        this._line.setTo(
            this.start.x + screen.right,
            -this.start.y + screen.top,
            this.end.x + screen.right,
            -this.end.y + screen.top
        )
    }
}