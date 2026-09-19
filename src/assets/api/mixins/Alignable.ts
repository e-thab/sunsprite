// import type { ReferenceObject } from "@api/types"
import type { Class } from "@mixins/shared"
import { isVector2Like, Vector2, type Vector2Like } from "@api/Vector2"

export enum Anchor {
    TOP_LEFT = 'topleft',
    TOP_CENTER = 'topcenter',
    TOP_RIGHT = 'topright',
    CENTER_LEFT = 'centerleft',
    CENTER = 'center',
    CENTER_RIGHT = 'centerright',
    BOTTOM_LEFT = 'bottomleft',
    BOTTOM_CENTER = 'bottomcenter',
    BOTTOM_RIGHT = 'bottomright',
}

/** Any of the nine anchor points on an object, as a lowercase string. */
export type AnchorPoint = `${Anchor}`

/** An object with enough geometry to resolve anchor points on. */
type AlignableLike = { x: number, y: number, width: number, height: number }

/** Factors applied to an object's width/height to reach each anchor point from its center. */
const ANCHOR_OFFSETS: Record<AnchorPoint, readonly [number, number]> = {
    [Anchor.TOP_LEFT]:      [-1/2,  1/2],
    [Anchor.TOP_CENTER]:    [  0 ,  1/2],
    [Anchor.TOP_RIGHT]:     [ 1/2,  1/2],
    [Anchor.CENTER_LEFT]:   [-1/2,   0 ],
    [Anchor.CENTER]:        [  0,    0 ],
    [Anchor.CENTER_RIGHT]:  [ 1/2,   0 ],
    [Anchor.BOTTOM_LEFT]:   [-1/2, -1/2],
    [Anchor.BOTTOM_CENTER]: [  0,  -1/2],
    [Anchor.BOTTOM_RIGHT]:  [ 1/2, -1/2],
}

function isAlignable(obj: any): obj is AlignableLike {
    return typeof (obj).x === 'number'
        && typeof (obj).y === 'number'
        && typeof (obj as AlignableLike).width === "number"
        && typeof (obj as AlignableLike).height === "number"
}

/** Resolve an anchor name to its width/height factors, tolerating any casing. */
function anchorOffsets(anchor: AnchorPoint): readonly [number, number] {
    const offsets = ANCHOR_OFFSETS[anchor.toLowerCase() as AnchorPoint]
    if (offsets === undefined) throw new Error(`Bad goTo anchor: ${anchor}`)
    return offsets
}

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

            if (props?.topLeft) this.topLeft = props.topLeft
            if (props?.topCenter) this.topCenter = props.topCenter
            if (props?.topRight) this.topRight = props.topRight
            if (props?.centerLeft) this.centerLeft = props.centerLeft
            if (props?.centerRight) this.centerRight = props.centerRight
            if (props?.bottomLeft) this.bottomLeft = props.bottomLeft
            if (props?.bottomCenter) this.bottomCenter = props.bottomCenter
            if (props?.bottomRight) this.bottomRight = props.bottomRight
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
         * Set world position.
         * @param x New horizontal world position.
         * @param y New vertical world position.
         */
        goTo(x: number, y: number): void
        /**
         * Set world position.
         * @param other New world position.
         * @param anchor Where to anchor this object in its new position. e.g., if using 'topleft',
         * this object's top left point will be placed at other's position.
         */
        goTo(other: Vector2Like, anchor?: AnchorPoint): void
        goTo(xOrOther: number | Vector2Like, yOrAnchor?: number | AnchorPoint) {
            // Going to a point; e.g. goTo(100, -200)
            if (typeof(xOrOther) === 'number' && typeof(yOrAnchor) === 'number') {
                this.x = xOrOther
                this.y = yOrAnchor
            }
            else if (isVector2Like(xOrOther)) {
                const [other, anchor] = [xOrOther, yOrAnchor]
                const point = Vector2.from(other)
                
                // Going to a Vector2Like with no anchor; e.g. goTo(sprite)
                if (anchor === undefined) {
                    this.x = point.x
                    this.y = point.y
                }
                // Going to a Vector2Like with a self-anchor; e.g. goTo([10, 25], 'topleft')
                else if (typeof(anchor) === 'string') {
                    const [ xFact, yFact ] = anchorOffsets(anchor)
                    this.x = point.x - this.width * xFact
                    this.y = point.y - this.height * yFact
                }
            }
        }
    }
}
