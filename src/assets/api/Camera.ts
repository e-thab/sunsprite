import { camera, getOurPoint, mouse, repeatUntil, screen } from "./core"
import { Vector2, type Point } from "./Point"

export default class Camera {
    _cam: Phaser.Cameras.Scene2D.Camera
    _pos: Vector2 = new Vector2(0, 0)
    _zoom: number = 1
    _x: number = 0
    _y: number = 0
    panning: boolean = false
    following?: { _refObj: any }

    constructor(cam: Phaser.Cameras.Scene2D.Camera) {
        this._cam = cam
        this.reset()
    }

    get x(): number {
        return this._x
    }
    set x(x) {
        this._x = x
        this._cam.scrollX = x
    }

    get y(): number {
        return this._y
    }
    set y(y) {
        this._y = y
        this._cam.scrollY = -y
    }

    get top(): number {
        // return -(camera?._cam.midPoint.y - camera?._cam.displayHeight)
        return -this._cam.worldView.top + this.height / 2 * this._cam.zoom
    }
    get bottom(): number {
        return -this._cam.worldView.bottom + this.height / 2 * this._cam.zoom
    }
    get left(): number {
        return this._cam.worldView.left - this.width / 2 * this._cam.zoom
    }
    get right(): number {
        return this._cam.worldView.right - this.width / 2 * this._cam.zoom
    }

    get position(): Vector2 {
        return this._pos
    }
    set position(pos: Vector2) {
        this._pos = pos
        // this._refObj.centerOn(pos.x, pos.y)
    }

    get pos(): Vector2 {
        return this.position
    }
    set pos(pos: Vector2) {
        this.position = pos
    }

    get width(): number {
        return this._cam.displayWidth
    }
    get height(): number {
        return this._cam.displayHeight
    }

    get zoom(): number {
        return this._zoom
    }
    set zoom(zoom: number) {
        this._zoom = zoom
        this._cam.setZoom(zoom, zoom)
    }

    zoomToward(pos: Point, factor: number) {
        const oldZoom = this.zoom
        const newZoom = oldZoom * factor
        const ratio = oldZoom / newZoom

        const newX = pos.x - (pos.x - this.x) * ratio
        const newY = pos.y - (pos.y - this.y) * ratio

        this.zoom = newZoom
        this.x = newX
        this.y = newY
    }

    zoomTowardMouse(zoom: number) {
        // TODO: come back to this once Point has been replaced with Vector2
        this.zoomToward(mouse, zoom)
    }

    /** 
     * Shakes the Camera by the given intensity over the duration specified.
     * @param duration The duration of the effect in seconds. Default 1.
     * @param intensity The intensity of the shake. Default 1.
     */
    shake(duration?: number, intensity?: number, callback?: Function) {
        if (duration !== undefined) duration *= 0.001
        if (intensity !== undefined) intensity *= 0.001

        this._cam.shake(duration ?? 1000, intensity ?? 0.01, false, callback)
    }

    easeTo(pos: Vector2, duration?: number) {
        // const x = pos.x - this.zoom * (screen.right - this.x)
        // const y = -pos.y - this.zoom * (screen.right - this.x)
        const targetPos = getOurPoint(pos)
        this._cam.pan(targetPos.x, targetPos.y, duration ?? 1000, 'Power3', true, (cam, progress, x, y) => {
            this._x = x
            this._y = -y
        })
    }

    follow(gameObject: { _refObj: any }) {
        this.following = gameObject
        this._cam.startFollow(gameObject._refObj, false, 0.05, 0.05)
        repeatUntil(() => !this.following, () => {
            this._x = this._cam.scrollX
            this._y = -this._cam.scrollY
        })
    }

    stopFollow() {
        this._cam.stopFollow()
    }

    reset() {
        this.x = 0
        this.y = 0
        this.zoom = 1
    }

    _setCam(cam: Phaser.Cameras.Scene2D.Camera) {
        this._cam = cam
        this.reset()
    }
}

// export default class Camera extends Positionable(class {}) {
//     // TODO: zoom, rotate, smoothing
//     zoom: number
//     _x: number = 0
//     _y: number = 0

//     constructor() {
//         super()
//         this.zoom = 0
//     }

//     get x() {
//         return this._x
//     }
//     set x(x) {
//         this._x = x
//     }

//     get y() {
//         return this._y
//     }
//     set y(y) {
//         this._y = y
//     }

//     // _updatePosition(): void {

//     // }
// }

// class TestClass extends Camera {
//     constructor() {
//         super()
//         this.#testp = true
//     }
// }

// const foo = new Camera()

// foo.#testp = false