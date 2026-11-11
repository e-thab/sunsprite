import type { Class } from "@mixins/shared"
import type { ReferenceObject } from "@api/types"
import { isVector2Like, Vector2, type Vector2Like } from "@api/Vector2"
import { camera, pinReactors } from "@api/core"
import Random from "@api/Random"

export type PositionableScreenSpace = {
    x: number,
    y: number,
    position: Vector2,
}

export type PositionableProps = {
    /** Horizontal position in the world. */
    x?: number
    /** Vertical position in the world. */
    y?: number
    /** Position in the world. */
    position?: Vector2Like
    /** Keeps this object in place on the screen as the camera moves. */
    pinned?: boolean
}

export function Positionable<Base extends Class>(base: Base) {
    return class Positionable extends base {
        _refObj?: ReferenceObject
        _x: number = 0
        _y: number = 0
        _positionPinned: boolean = false
        // While pinned, position is stored as an offset from the camera in screen pixels
        // (unaffected by zoom), and x/y are worked out from it whenever they're read
        _pinnedX: number = 0
        _pinnedY: number = 0
        /** Registered with core while pinned; Camera runs it after moving or zooming. */
        _syncPinnedPosition = () => this._updatePosition()

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
            if (props?.pinned) this._pinPosition()
        }

        /** Horizontal position in the world. */
        get x(): number {
            if (this._positionPinned) return camera.x + this._pinnedX / camera.zoom
            return this._x
        }
        set x(x: number) {
            this._setX(x)
            this._updateX()
        }

        /** Vertical position in the world. */
        get y(): number {
            if (this._positionPinned) return camera.y + this._pinnedY / camera.zoom
            return this._y
        }
        set y(y: number) {
            this._setY(y)
            this._updateY()
        }

        /** Position in the world. */
        get position(): Vector2 {
            return new Vector2(this.x, this.y)
        }
        set position(pos: Vector2Like) {
            pos = Vector2.from(pos)
            this._setX(pos.x)
            this._setY(pos.y)
            this._updatePosition()
        }

        /**
         * Whether this object stays in place on the screen as the camera moves, like a UI element.
         * Moving a pinned object (by setting its position, screenSpace position, etc.) pins it
         * at its new spot. Setting this is the same as calling pin() or unpin().
         */
        get pinned(): boolean {
            return this._positionPinned
        }
        set pinned(pinned: boolean) {
            if (pinned) this.pin()
            else this.unpin()
        }

        /**
         * Keep this object in place on the screen, wherever it is right now, as the camera moves.
         * Use it with screenSpace to place UI elements:
         *
         * ```js
         * healthBar.goToScreen(0, 200)
         * // optionally: healthBar.screenSpace.position = [0, 200]
         * healthBar.pin()
         * ```
         */
        pin() {
            this._pinPosition()
        }

        /** Stop keeping this object in place on the screen. It stays where it is in the world. */
        unpin() {
            this._unpinPosition()
        }

        _pinPosition() {
            if (this._positionPinned) return
            this._pinnedX = (this._x - camera.x) * camera.zoom
            this._pinnedY = (this._y - camera.y) * camera.zoom
            this._positionPinned = true
            pinReactors.add(this._syncPinnedPosition)
        }

        _unpinPosition() {
            if (!this._positionPinned) return
            // Leave the object at the world position it's being shown at
            this._x = this.x
            this._y = this.y
            this._positionPinned = false
            pinReactors.delete(this._syncPinnedPosition)
        }

        /** Stores a new world x, as a screen offset if pinned. Doesn't update the Phaser object. */
        _setX(x: number) {
            if (this._positionPinned) this._pinnedX = (x - camera.x) * camera.zoom
            else this._x = x
        }

        /** Stores a new world y, as a screen offset if pinned. Doesn't update the Phaser object. */
        _setY(y: number) {
            if (this._positionPinned) this._pinnedY = (y - camera.y) * camera.zoom
            else this._y = y
        }

        /**
         * Used to access and/or modify this object's positioning data in screen-space coordinates.
         * This allows you to position the object and its edges relative to the screen itself.
         * 
         * For example, placing a sprite in the center of the screen:
         * 
         * ```js
         * sprite.screenSpace.position = [0, 0]
         * ```
         */
        get screenSpace(): PositionableScreenSpace {
            const positionable = this
            return {
                /** Horizontal position relative to the screen. */
                get x(): number {
                    return positionable.x - camera.x
                },
                set x(x: number) {
                    positionable.x = camera.x + x
                },

                /** Vertical position relative to the screen. */
                get y(): number {
                    return positionable.y - camera.y
                },
                set y(y: number) {
                    positionable.y = camera.y + y
                },

                /** Position relative to the screen. */
                get position(): Vector2 {
                    return new Vector2(this.x, this.y)
                },
                set position(pos: Vector2Like) {
                    pos = Vector2.from(pos)
                    positionable.position = new Vector2(camera.x + pos.x, camera.y + pos.y)
                },
            }
        }

        /**
         * Distance between this object and a point.
         * @param x The point's x coordinate.
         * @param y The point's y coordinate.
         */
        distanceTo(x: number, y: number): number
        /**
         * Distance between the center of this object and the center of another object.
         * @param other The other object.
         */
        distanceTo(other: Vector2Like): number
        distanceTo(xOrOther: number | Vector2Like, y?: number) {
            if (isVector2Like(xOrOther)) {
                // other = Vector2.from(xOrOther)
                return this.position.distanceTo(xOrOther)
            }
            else if (typeof xOrOther === 'number' && typeof y === 'number') {
                // other = Vector2.from(xOrOther, y)
                return this.position.distanceTo(xOrOther, y)
            }
            
            return new Vector2(NaN, NaN)
        }

        // goTo overloads, can go to:
        //  - Any object containing numeric x/y props
        //  - A [number, number] array as [x, y]
        //  - A Vector2
        //  - Two args (x, y)
        // NOTE: Alignable has its own set of overloads
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
                // TODO: Explain better
                throw new Error('Bad goTo args')
            }
        }

        /**
         * Set position relative to the screen.
         * @param position New position relative to the screen.
         */
        goToScreen(position: Vector2Like): void
        /**
         * Set position relative to the screen.
         * @param x New horizontal position relative to the screen.
         * @param y New vertical position relative to the screen.
         */
        goToScreen(x: number, y: number): void
        goToScreen(xOrPoint: number | Vector2Like, y?: number) {
            if (typeof xOrPoint === 'number' && typeof y === 'number') {
                this.goTo(camera.x + xOrPoint, camera.y + y)
            } else if (typeof xOrPoint === 'object' && y === undefined) {
                const { x, y } = Vector2.from(xOrPoint)
                this.goTo(camera.x + x, camera.y + y)
            } else {
                // TODO: Explain better
                throw new Error('Bad goToScreen args')
            }
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
