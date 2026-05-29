import type { Point } from "./interfaces"
import { screen } from "./core"
import Line from "./Line"

type HLineProps = {
    y?: number
    color?: string
}

export default class HLine {
    // Should use Viewable & Timeable
    readonly _line: Line
    _y: number

    constructor(props?: HLineProps) {
        this._line = new Line({
            pointA: { x: screen.left, y: 0 },
            pointB: { x: screen.right, y: 0 }
        })

        this._y = props?.y ?? 0
        this.y = this._y
    }

    get y(): number {
        return this._y
    }
    set y(y: number) {
        this._y = y
        this._line.setPoints(
            { x: screen.left, y },
            { x: screen.right, y }
        )
    }

    // color
    // thickness
}