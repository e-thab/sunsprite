import { screen } from "./core"
import Line from "./Line"

type VLineProps = {
    x?: number
    color?: string
}

export default class VLine {
    // Should use Viewable & Timeable
    readonly _line: Line
    _x: number

    constructor(props?: VLineProps) {
        this._line = new Line({
            pointA: { x: 0, y: screen.top },
            pointB: { x: 0, y: screen.bottom }
        })

        this._x = props?.x ?? 0
        this.x = this._x
    }

    get x(): number {
        return this._x
    }
    set x(x: number) {
        this._x = x
        this._line.setPoints(
            { x, y: screen.top },
            { x, y: screen.bottom }
        )
    }

    // color
    // thickness
}