import { resizeReactors, camera, forever } from "./core"
import { Timeable, Viewable, type ViewableProps } from "./mixins"
import Line from "./Line"

type VLineProps = ViewableProps & {
    /** The horizontal position of the line. */
    x?: number
    /** The color of the line. */
    color?: string
    /** The thickness of the line. */
    thickness?: number
}

export default class VLine extends 
    Viewable(
    Timeable(class {
        constructor() {}
    })) {

    readonly _line: Line
    private _thickness: number = 1
    private _lastZoom
    _x: number

    constructor(props?: VLineProps) {
        super()

        this._x = props?.x ?? 0

        this._line = new Line({
            pointA: { x: this._x, y: camera.top },
            pointB: { x: this._x, y: camera.bottom }
        })

        this._refObj = this._line._refObj
        this._initViewable(props)

        if (props?.color) this.color = props.color
        if (props?.thickness) this.thickness = props.thickness

        resizeReactors.push(this)
        
        // Moving to cam.y to seem infinite, scaling thickness w/ zoom
        this._lastZoom = camera.zoom
        forever(() => {
            if (camera.zoom !== this._lastZoom) {
                this._line.thickness = this._thickness * 1/camera.zoom
                this._lastZoom = camera.zoom
            }
            this._updatePosition()
        })
    }

    /** The horizontal position of the line. */
    get x(): number {
        return this._x
    }
    set x(x: number) {
        this._x = x
        this._updatePosition()
    }

    /** The color of the line. */
    get color(): string {
        return this._line.color
    }
    set color(color: string) {
        this._line.color = color
    }

    /** The thickness of the line. */
    get thickness(): number {
        return this._line.thickness
    }
    set thickness(thickness: number) {
        this._thickness = thickness
        this._line.thickness = thickness
    }

    _updatePosition() {
        this._line.setPoints(
            { x: this._x, y: camera.top + 10 * camera.zoom },
            { x: this._x, y: camera.bottom - 10 * camera.zoom }
        )
    }

    _onResize() {
        this._updatePosition()
    }
}