import { pointFrom, type Point, type PointArg } from "../Point"
import { camera } from "../core"
import Random from "../Random"
import type { ReferenceObject } from "../types"
import type { Class } from "./shared"

export type PositionableProps = {
    x?: number
    y?: number
    pos?: PointArg
    position?: PointArg
}

const propDescription: Record<keyof PositionableProps, string> = {
    x: `Horizontal position in the world.`,
    y: `Vertical position in the world.`,
    pos: `Position in the world.`,
    position: `Position in the world (alias of position).`,
}

export const positionablePropsTypeDef = `
declare type PositionableProps = {
    /** ${propDescription.x} */
    x?: number

    /** ${propDescription.y} */
    y?: number

    /** ${propDescription.pos} */
    pos?: PointArg

    /** ${propDescription.position} */
    position?: PointArg
}`
export const positionableApi = [
    // Props
    `/** ${propDescription.x} */
    x: number`,

    `/** ${propDescription.y} */
    y: number`,

    `/** ${propDescription.pos} */
    pos: Point`,

    `/** ${propDescription.position} */
    position: Point`,

    // Methods
    `/**
     * Set world position.
     * @param x New horizontal world position.
     * @param y New vertical world position.
     */
    goTo(x: number, y: number): void`,

    `/**
     * Set world position.
     * @param position New world position.
     */
    goTo(position: Point): void`,

    `/** Set position to a random point within the current visible screen area. */
    goToRandom(): void`,

].join('\n')

export function Positionable<Base extends Class>(base: Base) {
    return class Positionable extends base {
        _refObj?: ReferenceObject
        _x: number = 0
        _y: number = 0

        constructor(...args: any[]) {
            super()
        }

        initPositionable(props?: PositionableProps) {
            // Warn when setting:
            // pos & position
            // pos & (x | y)
            // position & (x | y)
            this.x = props?.x ?? 0
            this.y = props?.y ?? 0
            if (props?.position) this.position = props.position
            if (props?.pos) this.pos = props.pos
        }

        get x(): number {
            return this._x
        }
        set x(x: number) {
            this._x = x
            this._updateX()
        }

        get y(): number {
            return this._y
        }
        set y(y: number) {
            this._y = y
            this._updateY()
        }

        get position(): Point {
            return {
                x: this.x,
                y: this.y
            }
        }
        set position(pos: PointArg) {
            pos = pointFrom(pos)
            this._x = pos.x
            this._y = pos.y
            this._updatePosition()
        }

        // Alias for position: pos
        get pos(): Point {
            return this.position
        }
        set pos(pos: PointArg) {
            this.position = pos
        }

        get screenX(): number {
            // CHECK PHASER IMPLEMENTATION
            return this.x - camera.x
        }
        set screenX(newX: number) {
            this.x = camera.x - newX
        }

        get screenY(): number {
            return this.y - camera.y
        }
        set screenY(newY: number) {
            this.y = camera.y - newY
        }

        // goTo overloads, can go to:
        //  - A Point instance (any object containing x/y props)
        //  - A point defined with 2 args
        // Also test these
        goTo(position: Point): void
        goTo(x: number, y: number): void
        goTo(xOrPoint: number | Point, y?: number) {
            if (typeof xOrPoint === 'number' && y !== undefined) {
                this.x = xOrPoint
                this.y = y
            } else if (typeof xOrPoint === 'object') {
                this.x = (xOrPoint as Point).x ?? this.x
                this.y = (xOrPoint as Point).y ?? this.y
            }
        }

        goToMouse() {
            // CHECK PHASER IMPLEMENTATION
            // Super slow in a forever loop, look into this
            // if (this._refObj) this._refObj.x = mouseX + app.screen.width / 2
            // if (this._refObj) this._refObj.y = -mouseY + app.screen.height / 2
        }

        goToRandom() {
            this.goTo(Random.position())
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
