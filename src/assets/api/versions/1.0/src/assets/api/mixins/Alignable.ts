// import type { ReferenceObject } from "@api/types"
import type { Class } from "./shared"
import { Vector2, type Vector2Like } from "../Vector2"

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

        get left(): number {
            return this.x - this.width / 2
        }
        set left(left: number) {
            this.width = Math.abs(this.right - left)
            this.x = left + this.width / 2
        }

        get right(): number {
            return this.x + this.width / 2
        }
        set right(right: number) {
            this.width = Math.abs(this.left - right)
            this.x = right - this.width / 2
        }

        get top(): number {
            return this.y + this.height / 2
        }
        set top(top: number) {
            this.height = Math.abs(this.bottom - top)
            this.y = top - this.height / 2
        }

        get bottom(): number {
            return this.y - this.height / 2
        }
        set bottom(bottom: number) {
            this.height = Math.abs(this.top - bottom)
            this.y = bottom + this.height / 2
        }

        get topLeft(): Vector2 {
            return new Vector2(this.left, this.top)
        }
        set topLeft(topLeft: Vector2Like) {
            const { x, y } = Vector2.from(topLeft)
            this.left = x
            this.top = y
        }

        get topCenter(): Vector2 {
            return new Vector2(this.x, this.top)
        }
        set topCenter(topCenter: Vector2Like) {
            const { x, y } = Vector2.from(topCenter)
            this.x = x
            this.top = y
        }

        get topRight(): Vector2 {
            return new Vector2(this.right, this.top)
        }
        set topRight(topRight: Vector2Like) {
            const { x, y } = Vector2.from(topRight)
            this.right = x
            this.top = y
        }

        get bottomLeft(): Vector2 {
            return new Vector2(this.left, this.bottom)
        }
        set bottomLeft(bottomLeft: Vector2Like) {
            const { x, y } = Vector2.from(bottomLeft)
            this.left = x
            this.bottom = y
        }

        get bottomCenter(): Vector2 {
            return new Vector2(this.x, this.bottom)
        }
        set bottomCenter(bottomCenter: Vector2Like) {
            const { x, y } = Vector2.from(bottomCenter)
            this.x = x
            this.bottom = y
        }

        get bottomRight(): Vector2 {
            return new Vector2(this.right, this.bottom)
        }
        set bottomRight(bottomRight: Vector2Like) {
            const { x, y } = Vector2.from(bottomRight)
            this.right = x
            this.bottom = y
        }

        get centerLeft(): Vector2 {
            return new Vector2(this.left, this.y)
        }
        set centerLeft(centerLeft: Vector2Like) {
            const { x, y } = Vector2.from(centerLeft)
            this.left = x
            this.y = y
        }

        get centerRight(): Vector2 {
            return new Vector2(this.right, this.y)
        }
        set centerRight(centerRight: Vector2Like) {
            const { x, y } = Vector2.from(centerRight)
            this.right = x
            this.y = y
        }
    }
}