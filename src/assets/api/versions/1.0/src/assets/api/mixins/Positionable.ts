import type { Class } from "./shared"
import type { ReferenceObject } from "../types"
import { Vector2, type Vector2Like } from "../Vector2"
import { camera } from "../core"
import Random from "../Random"

export type PositionableProps = {
    /** Horizontal position in the world. */
    x?: number
    /** Vertical position in the world. */
    y?: number
    /** Position in the world. */
    position?: Vector2Like
    /** Position in the world (alias of position). */
    pos?: Vector2Like
    /** Horizontal position on the screen. */
    screenX?: number
    /** Vertical position on the screen. */
    screenY?: number
    /** Position on the screen. */
    screenPosition?: Vector2Like
    /** Position on the screen (alias of position). */
    screenPos?: Vector2Like
}

export function Positionable<Base extends Class>(base: Base) {
    return class Positionable extends base {
        _refObj?: ReferenceObject
        _x: number = 0
        _y: number = 0

        constructor(...args: any[]) {
            super()
        }

        _initPositionable(props?: PositionableProps) {
            // Warn when setting:
            // pos & position
            // pos & (x | y)
            // position & (x | y)
            this.x = props?.x ?? 0
            this.y = props?.y ?? 0
            if (props?.position) this.position = props.position
            if (props?.pos) this.pos = props.pos
        }

        /** Horizontal position in the world. */
        get x(): number {
            return this._x
        }
        set x(x: number) {
            this._x = x
            this._updateX()
        }

        /** Vertical position in the world. */
        get y(): number {
            return this._y
        }
        set y(y: number) {
            this._y = y
            this._updateY()
        }

        /** Position in the world. */
        get position(): Vector2 {
            return new Vector2(this.x, this.y)
        }
        set position(pos: Vector2Like) {
            pos = Vector2.from(pos)
            this._x = pos.x
            this._y = pos.y
            this._updatePosition()
        }

        // Alias for position: pos
        /** Position in the world (alias of position). */
        get pos(): Vector2 {
            return this.position
        }
        set pos(pos: Vector2Like) {
            this.position = pos
        }

        /** This object's horizontal position relative to the camera. */
        get screenX(): number {
            return this.x - camera.x
        }
        set screenX(newX: number) {
            this.x = camera.x - newX
        }

        /** This object's vertical position relative to the camera. */
        get screenY(): number {
            return this.y - camera.y
        }
        set screenY(newY: number) {
            this.y = camera.y - newY
        }

        /** This object's position relative to the camera. */
        get screenPosition(): Vector2 {
            return new Vector2(this.screenX, this.screenY)
        }
        set screenPosition(pos: Vector2Like) {
            pos = Vector2.from(pos)
            this.position = new Vector2(camera.x - pos.x, camera.y - pos.y)
        }
        
        /** This object's position relative to the camera (alias of screenPosition) */
        get screenPos(): Vector2 {
            return this.screenPosition
        }
        set screenPos(pos: Vector2Like) {
            pos = Vector2.from(pos)
            this.screenPosition = pos
        }

        // goTo overloads, can go to:
        //  - Any object containing numeric x/y props
        //  - A [number, number] array as [x, y]
        //  - A Vector2
        //  - Two args (x, y)
        /**
         * Set world position.
         * @param position New world position.
         */
        goTo(position: Vector2Like): void
        /**
         * Set world position.
         * @param x New horizontal world position.
         * @param y New vertical world position.
         */
        goTo(x: number, y: number): void
        goTo(xOrPoint: number | Vector2Like, y?: number) {
            if (typeof xOrPoint === 'number' && y !== undefined && typeof y === 'number') {
                this.x = xOrPoint
                this.y = y
            } else if (typeof xOrPoint === 'object' && y === undefined) {
                const { x, y } = Vector2.from(xOrPoint)
                this.x = x
                this.y = y
            } else {
                throw new Error('Bad goTo args')
            }
        }

        _goToMouse() {
            // temp private
            // CHECK PHASER IMPLEMENTATION
            // Super slow in a forever loop, look into this
            // if (this._refObj) this._refObj.x = mouseX + app.screen.width / 2
            // if (this._refObj) this._refObj.y = -mouseY + app.screen.height / 2
        }

        /** Set position to a random point within the current visible screen area. */
        goToRandom() {
            this.goTo(Random.position())
        }

        _onResize() {
            this._updatePosition()
        }

        _updatePosition() {
            this._updateX()
            this._updateY()
        }

        _updateX() {
            // if (this._refObj) this._refObj.x = this.x + app.screen.width / 2 - camera.x
            if (this._refObj) this._refObj.x = this.x + camera.width / 2 * camera.zoom
            // if (this._refObj) console.log(`setting actual x to ${this.x + screen.width / 2 - camera.x}`)
        }

        _updateY() {
            // if (this._refObj) this._refObj.y = -this.y + app.screen.height / 2 + camera.y
            if (this._refObj) this._refObj.y = -this.y + camera.height / 2 * camera.zoom
        }
    }
}
