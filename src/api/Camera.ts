import { clock, mouse } from "@api/core"
import { forever } from "@api/control"
import { isVector2Like, Vector2, type Vector2Like, type HasPosition } from "@api/Vector2"
import { smoothStep } from "./utility"

/** User camera reference. */
export default class Camera {
    _cam: Phaser.Cameras.Scene2D.Camera
    _pos: Vector2 = new Vector2(0, 0)
    _zoom: number = 1
    _x: number = 0
    _y: number = 0
    // panning: boolean = false
    _target?: Vector2
    _velocity: Vector2 = Vector2.ZERO
    _zoomTarget?: number
    _zoomVelocity: number = 0
    following?: HasPosition
    smoothTime: number = 0.15
    zoomSmoothTime: number = 0.15

    constructor(cam: Phaser.Cameras.Scene2D.Camera) {
        this._cam = cam
        this.reset()
    }

    get x(): number {
        return this._x
    }
    set x(x: number) {
        this._x = x
        this._cam.scrollX = x
    }

    get y(): number {
        return this._y
    }
    set y(y: number) {
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
    set position(pos: Vector2Like) {
        const newPos = Vector2.from(pos)
        this._pos = newPos
        // const { x, y } = getOurPoint(newPos)
        // this._cam.centerOn(x, y)
        this.x = newPos.x
        this.y = newPos.y
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

    zoomToward(pos: Vector2Like, factor: number) {
        pos = Vector2.from(pos)

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

    goTo(x: number, y: number): void
    goTo(other: Vector2Like): void
    goTo(xOrVector: number | Vector2Like, y?: number): void {
        if (isVector2Like(xOrVector)) {
            this.position = xOrVector
        } else if (typeof xOrVector === 'number' && typeof y === 'number') {
            this.position = new Vector2(xOrVector, y)
        }
    }

    easeTo(x: number, y: number): void
    easeTo(other: Vector2Like): void
    easeTo(xOrVector: number | Vector2Like, y?: number): void {
        if (isVector2Like(xOrVector)) {
            this._target = Vector2.from(xOrVector)
        } else if (typeof xOrVector === 'number' && typeof y === 'number') {
            this._target = Vector2.from(xOrVector, y)
        }
        this.following = undefined
    }

    easeZoom(zoom: number) {
        this._zoomTarget = zoom
    }

    follow(gameObject: HasPosition) {
        this.following = gameObject
    }

    stopFollow() {
        this.following = undefined
        this._target = undefined
        this._velocity = Vector2.ZERO
    }

    reset() {
        this.goTo(0, 0)
        this.zoom = 1
        this.following = undefined
        this._pos = Vector2.ZERO
        this._velocity = Vector2.ZERO
        this._target = undefined
        this._zoomTarget = undefined
        this._zoomVelocity = 0

        // The loop handling camera ease and follow
        forever(delta => {
            if (this.following) this._target = Vector2.from(this.following)

            const dt = clock.deltaMs / 1000
            if (this._target !== undefined) {
                // Smooth damp position
                const step = smoothStep(
                    this.position, this._target, 
                    this._velocity, this.smoothTime, dt
                )
                this.position = step.position
                this._velocity = step.velocity
    
                if (!this.following && this.position.distanceTo(this._target) < 0.01 && this._velocity.length < 0.01) {
                    this.position = this._target
                    this._velocity = Vector2.ZERO
                    this._target = undefined
                }
            }

            // Smooth damp zoom
            if (this._zoomTarget !== undefined) {
                const step = smoothStep(
                    Math.log(this.zoom), Math.log(this._zoomTarget), 
                    this._zoomVelocity, this.zoomSmoothTime, dt
                )
                this.zoom = Math.exp(step.value)
                this._zoomVelocity = step.velocity

                if (Math.abs(this.zoom - this._zoomTarget) < 0.0001 && Math.abs(this._zoomVelocity) < 0.0001) {
                    this.zoom = this._zoomTarget
                    this._zoomVelocity = 0
                    this._zoomTarget = undefined
                }
            }
            // if (!this.position.equals(this._target)) {
            //     const v = this._target.subtract(this.position)
            //     this.position = this.position.add(v.multiply(1 - Math.exp(-k * delta)))
            // }
        })
    }

    _setCam(cam: Phaser.Cameras.Scene2D.Camera) {
        this._cam = cam
        this.reset()
    }
}
