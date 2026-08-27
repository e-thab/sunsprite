import { camera, forever, screen } from "./core"
import { Timeable, Viewable, type ViewableProps } from "./mixins"
import Line from "./Line"

type HLineProps = ViewableProps & {
    y?: number
    color?: string
    thickness?: number
}

export default class HLine extends 
    Viewable(
    Timeable(class {
        constructor() {}
    })) {

    readonly _line: Line
    private _lastZoom: number = 1
    private _thickness: number = 1
    _y: number

    constructor(props?: HLineProps) {
        super()

        this._y = props?.y ?? 0
        
        this._line = new Line({
            pointA: { x: screen.left, y: this._y },
            pointB: { x: screen.right, y: this._y }
        })
        
        this._refObj = this._line._refObj
        this.initViewable(props)

        if (props?.color) this.color = props.color
        if (props?.thickness) this.thickness = props.thickness

        // Moving to cam.x to seem infinite, scaling thickness w/ zoom
        this._lastZoom = camera.zoom
        forever(() => {
            this._line._line.x = camera._cam.scrollX
            this._line._line.displayWidth = screen.width
            if (camera.zoom !== this._lastZoom) {
                this._line.thickness = this._thickness * 1/camera.zoom
                this._lastZoom = camera.zoom
            }
        })
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
        this._thickness = thickness
        this._line.thickness = thickness
    }
}