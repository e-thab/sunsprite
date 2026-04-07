import type { Positionable } from "./interfaces"
import { updateSpritePositions } from "./core"

export default class Camera implements Positionable {
    // TODO: zoom, rotate, smoothing
    zoom: number
    _x: number = 0
    _y: number = 0
    screenX: number = 0
    screenY: number = 0

    constructor() {
        this.zoom = 0
    }

    get x() {
        return this._x
    }
    set x(newX) {
        this._x = newX
        // this._pixiObject.x = this.x + app.screen.width / 2 - camera.x 
        this._updatePosition()
    }

    get y() {
        return this._y
    }
    set y(newY) {
        this._y = newY
        // this._pixiObject.y = -this.y + app.screen.height / 2 + camera.y
        this._updatePosition()
    }

    goTo(x: number, y: number): void {
        this.x = x
        this.y = y
    }

    _updatePosition(): void {
        updateSpritePositions()
    }
}