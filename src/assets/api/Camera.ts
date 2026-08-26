import { mouse } from "./core"
import { Vector2, type Point } from "./Point"



export default class Camera {
    _cam: Phaser.Cameras.Scene2D.Camera
    _pos: Vector2 = new Vector2(0, 0)
    _zoom: number = 1
    _x: number = 0
    _y: number = 0

    constructor(cam: Phaser.Cameras.Scene2D.Camera) {
        this._cam = cam
        this.reset()
    }

    get x() {
        return this._x
    }
    set x(x) {
        this._x = x
        // const pos = getGamePoint({ x, y: this.y })
        // this._refObj.setPosition(pos.x, pos.y)
        // this._refObj.x = pos.x
        // this._refObj.centerOnX(x)
        this._cam.scrollX = x
        // console.log(this._x, x, this._cam.scrollX)
    }

    get y() {
        return this._y
    }
    set y(y) {
        this._y = y
        // const pos = getGamePoint({ x: this.x, y })
        // this._refObj.setPosition(pos.x, pos.y)
        // this._refObj.centerOnY(pos.y)
        // this._refObj.y = pos.y
        this._cam.scrollY = -y
        // console.log(this._y, -y, this._cam.scrollY)
    }

    get position() {
        return this._pos
    }
    set position(pos: Vector2) {
        this._pos = pos
        // this._refObj.centerOn(pos.x, pos.y)
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

    // Shakes the Camera by the given intensity over the duration specified.
    // @param duration — The duration of the effect in seconds. Default 1.
    // @param intensity — The intensity of the shake. Default 1.
    // @param force — Force the shake effect to start immediately, even if already running. Default false.
    // @param callback
    // This callback will be invoked every frame for the duration of the effect. It is sent two arguments: A reference to the camera and a progress amount between 0 and 1 indicating how complete the effect is.
    // @param context — The context in which the callback is invoked. Defaults to the Scene to which the Camera belongs.
    // @returns — This Camera instance.
    shake(duration?: number, intensity?: number, callback?: Function) {
        if (duration !== undefined) duration *= 0.001
        if (intensity !== undefined) intensity *= 0.001

        this._cam.shake(duration ?? 1000, intensity ?? 0.01, false, callback)
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