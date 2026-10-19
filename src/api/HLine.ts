import { Timeable, Viewable, type ViewableProps } from "./mixins"
import { resizeReactors, camera, forever } from "@api/core"
import Line from "@api/Line"

type HLineProps = ViewableProps & {
    /** The vertical position of the line. */
    y?: number
    /** The color of the line. */
    color?: string
    /** The thickness of the line. */
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
            pointA: { x: camera.left, y: this._y },
            pointB: { x: camera.right, y: this._y }
        })
        
        this._refObj = this._line._refObj
        this._initViewable(props)

        if (props?.color) this.color = props.color
        if (props?.thickness) this.thickness = props.thickness

        resizeReactors.push(this)

        // Moving to cam.x to seem infinite, scaling thickness w/ zoom
        this._lastZoom = camera.zoom
        forever(() => {
            if (camera.zoom !== this._lastZoom) {
                this._line.thickness = this._thickness * 1/camera.zoom
                this._lastZoom = camera.zoom
            }
            this._updatePosition()
        })
    }

    /** The vertical position of the line. */
    get y(): number {
        return this._y
    }
    set y(y: number) {
        this._y = y
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
            { x: camera.left - 10 * camera.zoom, y: this._y },
            { x: camera.right + 10 * camera.zoom, y: this._y }
        )
    }

    _onResize() {
        this._updatePosition()
    }
}