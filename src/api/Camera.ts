import { forever, getGamePoint, getOurPoint, mouse, repeatUntil } from "@api/core"
import { Vector2, type Vector2Like } from "@api/Vector2"
import type Sprite from "@api/Sprite"
import type Rectangle from "@api/Rectangle"
import type Circle from "@api/Circle"
import type Label from "@api/Label"
import Output from "@/sandbox/output"

/** User camera reference. */
export default class Camera {
    _cam: Phaser.Cameras.Scene2D.Camera
    _pos: Vector2 = new Vector2(0, 0)
    _zoom: number = 1
    _x: number = 0
    _y: number = 0
    // panning: boolean = false
    _target?: Vector2
    following?: Sprite | Rectangle | Circle | Label

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

    goTo(x: number, y: number) {
        this.position = new Vector2(x, y)
    }

    easeTo(pos: Vector2Like, duration?: number) {
        // const x = pos.x - this.zoom * (screen.right - this.x)
        // const y = -pos.y - this.zoom * (screen.right - this.x)
        const posv = Vector2.from(pos)
        const targetPos = getOurPoint(posv)
        this._cam.pan(targetPos.x, targetPos.y, duration ?? 1000, 'Power3', true, (cam, progress, x, y) => {
            this._x = x
            this._y = -y
        })
    }

    moveToward(pos: Vector2Like, amount: number) {
        // TODO !!
    }

    follow(gameObject: Sprite | Rectangle | Circle | Label) {
        this.following = gameObject
        // this._cam.startFollow(gameObject._refObj, false, 0.05, 0.05)
        // repeatUntil(() => !this.following, () => {
        //     this._x = this._cam.scrollX
        //     this._y = -this._cam.scrollY
        // })
    }

    stopFollow() {
        // this._cam.stopFollow()
        // Ends follow()'s position sync, which would otherwise keep running
        // and stack another copy on top with every later follow() call.
        this._target = undefined
        this.following = undefined
    }

    reset() {
        this.goTo(0, 0)
        this._pos = Vector2.ZERO
        this.zoom = 1
        this.following = undefined
        this._target = undefined

        // The loop handling camera ease and follow
        forever(delta => {
            if (this.following) {
                const target = Vector2.from(this.following)
                if (!this.position.equals(target)) {
                    const v = target.subtract(this.position)
                    this.position = this.position.add(v.normal.multiply(v.length * 0.1))
                }
            }
        })
    }

    _setCam(cam: Phaser.Cameras.Scene2D.Camera) {
        this._cam = cam
        this.reset()
    }
}
