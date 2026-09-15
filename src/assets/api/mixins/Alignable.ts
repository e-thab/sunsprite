// import type { ReferenceObject } from "@api/types"
import type { Class } from "@mixins/shared"
import { Vector2, type Vector2Like } from "@api/Vector2"

const Alignment = {
    TOP: 'top',
    BOTTOM: 'bottom',
    LEFT: 'left',
    RIGHT: 'right',
    CENTER_V: 'centerv',
    CENTER_H: 'centerh'
}

type AlignType =
    | 'topleft'
    | 'topcenter'
    | 'topright'

/**
 * If an object extends Alignable, it must have { x: number, y: number, width: number, height: number }.
 * When extending Positionable, Sizable, and Alignable, make sure Positionable and Sizable come
 * earlier in the inheritance chain, e.g.
 * 
 * class ClassName extends
 *  ExampleMixin(
 *  Alignable(
 *  Sizable(
 *  Positionable(
 *  OtherMixin(
 *  ...
 */
export type AlignableProps = {
    /** Y coordinate at the top edge of this object. */
    top?: number
    /** Y coordinate at the bottom edge of this object. */
    bottom?: number
    /** X coordinate at the left edge of this object. */
    left?: number
    /** X coordinate at the right edge of this object. */
    right?: number
    
    /** Position at the top left corner of this object. */
    topLeft?: Vector2Like
    /** Position at the top edge in the horizontal center of this object. */
    topCenter?: Vector2Like
    /** Position at the top right corner of this object. */
    topRight?: Vector2Like

    /** Position at the bottom left corner of this object. */
    bottomLeft?: Vector2Like
    /** Position at the bottom edge in the horizontal center of this object. */
    bottomCenter?: Vector2Like
    /** Position at the bottom right corner of this object. */
    bottomRight?: Vector2Like

    /** Position at the vertical center of the left edge of this object. */
    centerLeft?: Vector2Like
    /** Position at the vertical center of the right edge of this object. */
    centerRight?: Vector2Like
}

export function Alignable<Base extends Class<{
    x: number
    y: number
    width: number
    height: number
}>>(base: Base) {
    return class Alignable extends base {
        constructor(...args: any[]) {
            super()
        }

        _initAlignable(props?: AlignableProps) {
            if (props === undefined) return

            if (props?.top !== undefined) this.top = props.top
            if (props?.bottom !== undefined) this.bottom = props.bottom
            if (props?.left !== undefined) this.left = props.left
            if (props?.right !== undefined) this.right = props.right
            // ...
        }

        /** X coordinate at the left edge of this object. */
        get left(): number {
            return this.x - this.width / 2
        }
        set left(left: number) {
            this.width = Math.abs(this.right - left)
            this.x = left + this.width / 2
        }

        /** X coordinate at the right edge of this object. */
        get right(): number {
            return this.x + this.width / 2
        }
        set right(right: number) {
            this.width = Math.abs(this.left - right)
            this.x = right - this.width / 2
        }

        /** Y coordinate at the top edge of this object. */
        get top(): number {
            return this.y + this.height / 2
        }
        set top(top: number) {
            this.height = Math.abs(this.bottom - top)
            this.y = top - this.height / 2
        }

        /** Y coordinate at the bottom edge of this object. */
        get bottom(): number {
            return this.y - this.height / 2
        }
        set bottom(bottom: number) {
            this.height = Math.abs(this.top - bottom)
            this.y = bottom + this.height / 2
        }

        /** Position at the top left corner of this object. */
        get topLeft(): Vector2 {
            return new Vector2(this.left, this.top)
        }
        set topLeft(topLeft: Vector2Like) {
            const { x, y } = Vector2.from(topLeft)
            this.left = x
            this.top = y
        }

        /** Position at the top edge in the horizontal center of this object. */
        get topCenter(): Vector2 {
            return new Vector2(this.x, this.top)
        }
        set topCenter(topCenter: Vector2Like) {
            const { x, y } = Vector2.from(topCenter)
            this.x = x
            this.top = y
        }

        /** Position at the top right corner of this object. */
        get topRight(): Vector2 {
            return new Vector2(this.right, this.top)
        }
        set topRight(topRight: Vector2Like) {
            const { x, y } = Vector2.from(topRight)
            this.right = x
            this.top = y
        }

        /** Position at the bottom left corner of this object. */
        get bottomLeft(): Vector2 {
            return new Vector2(this.left, this.bottom)
        }
        set bottomLeft(bottomLeft: Vector2Like) {
            const { x, y } = Vector2.from(bottomLeft)
            this.left = x
            this.bottom = y
        }

        /** Position at the bottom edge in the horizontal center of this object. */
        get bottomCenter(): Vector2 {
            return new Vector2(this.x, this.bottom)
        }
        set bottomCenter(bottomCenter: Vector2Like) {
            const { x, y } = Vector2.from(bottomCenter)
            this.x = x
            this.bottom = y
        }

        /** Position at the bottom right corner of this object. */
        get bottomRight(): Vector2 {
            return new Vector2(this.right, this.bottom)
        }
        set bottomRight(bottomRight: Vector2Like) {
            const { x, y } = Vector2.from(bottomRight)
            this.right = x
            this.bottom = y
        }

        /** Position at the vertical center of the left edge of this object. */
        get centerLeft(): Vector2 {
            return new Vector2(this.left, this.y)
        }
        set centerLeft(centerLeft: Vector2Like) {
            const { x, y } = Vector2.from(centerLeft)
            this.left = x
            this.y = y
        }

        /** Position at the vertical center of the right edge of this object. */
        get centerRight(): Vector2 {
            return new Vector2(this.right, this.y)
        }
        set centerRight(centerRight: Vector2Like) {
            const { x, y } = Vector2.from(centerRight)
            this.right = x
            this.y = y
        }

        /**
         * Align this object to another alignable object. Does not change size, only position.
         * ...
         */
        alignTo(other: Alignable, alignType: string, alignOrientation: 'inside' | 'outside') {
            alignType = alignType.toLowerCase()
            if (alignType.includes(Alignment.LEFT)) {
                this.x = other.left + this.width / 2
            }
            if (alignType.includes(Alignment.RIGHT)) {
                this.x = other.right - this.width / 2
            }
            if (alignType.includes(Alignment.TOP)) {
                this.y = other.top - this.height / 2
            }
            if (alignType.includes(Alignment.BOTTOM)) {
                this.y = other.bottom + this.height / 2
            }
            if (alignType.includes(Alignment.CENTER_H)) {
                this.x = other.x
            }
            if (alignType.includes(Alignment.CENTER_V)) {
                this.y = other.y
            }
        }

        /** 
         * Moves the object so that the corner/edge is at the specified position without changing size
         */
        alignTopLeftTo(point: Vector2Like) {
            point = Vector2.from(point)
            this.x = point.x + this.width / 2
            this.y = point.y - this.height / 2
        }
    }
}
