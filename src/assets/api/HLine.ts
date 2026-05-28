import { Point, Vector2 } from "./interfaces"
import Line from "./Line"

type HLineProps = {
    y: number
}

export default class HLine {
    readonly _line: Line
    _y: number

    constructor(props?: HLineProps) {
        this._y = props?.y ?? 0
        this.y = this._y

        this._line = new Line({
            pointA: new Point(1, 2),
            pointB: new Point(3, 4)
        })
    }

    get y(): number {
        return this._y
    }
    set y(y: number) {
        this._y = y
    }
}