import { camera, forever, screen } from "./core"
import { Timeable, Viewable, type ViewableProps } from "./mixins"
import Line from "./Line"

type VLineProps = ViewableProps & {
    x?: number
    color?: string
    thickness?: number
}

export default class VLine extends 
    Viewable(
    Timeable(class {
        constructor() {}
    })) {

    readonly _line: Line
    _x: number

    constructor(props?: VLineProps) {
        super()

        this._x = props?.x ?? 0

        this._line = new Line({
            pointA: { x: this._x, y: screen.top },
            pointB: { x: this._x, y: screen.bottom }
        })

        this._refObj = this._line._refObj
        this.initViewable(props)

        if (props?.color) this.color = props.color
        if (props?.thickness) this.thickness = props.thickness

        forever(() => {
            this._line._line.y = camera._cam.scrollY
            this._line._line.displayHeight = screen.height
        })
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

    get color(): string {
        return this._line.color
    }
    set color(color: string) {
        this._line.color = color
    }

    get thickness(): number {
        return this._line.thickness
    }
    set thickness(thickness: number) {
        this._line.thickness = thickness
    }
}