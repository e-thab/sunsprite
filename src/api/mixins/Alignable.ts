// import type { ReferenceObject } from "@api/types"
import type { Class } from "@mixins/shared"
import type { PositionableScreenSpace } from "@mixins/Positionable"
import { isVector2Like, Vector2, type Vector2Like } from "@api/Vector2"
import { camera } from "@api/core"
import { deg2rad } from "@api/utility"

/** The nine anchor points on an object, usable anywhere an anchor name is accepted. */
export enum Anchor {
    TopLeft = 'topleft',
    TopCenter = 'topcenter',
    TopRight = 'topright',
    CenterLeft = 'centerleft',
    Center = 'center',
    CenterRight = 'centerright',
    BottomLeft = 'bottomleft',
    BottomCenter = 'bottomcenter',
    BottomRight = 'bottomright',
}

/** The nine anchor points in their canonical, all-lowercase spelling. */
type CanonicalAnchor = `${Anchor}`

/**
 * Any of the nine anchor points on an object. Accepted either in the canonical
 * all-lowercase spelling ('topleft') or in the camelCase spelling of the
 * property naming the same point ('topLeft'), since anchorOffsets lowercases
 * the name before looking it up. Only the lowercase half is a real key of
 * ANCHOR_OFFSETS; the camelCase half exists so the type matches what the
 * runtime has always accepted. libTypes.ts keeps a hand-written copy of this
 * union for the editor — widen both together.
 */
export type AnchorPoint =
    | CanonicalAnchor
    | 'topLeft'
    | 'topCenter'
    | 'topRight'
    | 'centerLeft'
    | 'centerRight'
    | 'bottomLeft'
    | 'bottomCenter'
    | 'bottomRight'

/** An object with enough geometry to resolve anchor points on. */
type AlignableLike = { x: number, y: number, width: number, height: number }

/** Factors applied to an object's width/height to reach each anchor point from its center. */
const ANCHOR_OFFSETS: Record<CanonicalAnchor, readonly [number, number]> = {
    [Anchor.TopLeft]:      [-1/2,  1/2],
    [Anchor.TopCenter]:    [  0 ,  1/2],
    [Anchor.TopRight]:     [ 1/2,  1/2],
    [Anchor.CenterLeft]:   [-1/2,   0 ],
    [Anchor.Center]:       [  0,    0 ],
    [Anchor.CenterRight]:  [ 1/2,   0 ],
    [Anchor.BottomLeft]:   [-1/2, -1/2],
    [Anchor.BottomCenter]: [  0,  -1/2],
    [Anchor.BottomRight]:  [ 1/2, -1/2],
}

export function isAlignable(obj: any): obj is AlignableLike {
    return typeof (obj).x === 'number'
        && typeof (obj).y === 'number'
        && typeof (obj as AlignableLike).width === "number"
        && typeof (obj as AlignableLike).height === "number"
}

/** Resolve an anchor name to its width/height factors, tolerating any casing. */
export function anchorOffsets(anchor: AnchorPoint): readonly [number, number] {
    const offsets = ANCHOR_OFFSETS[anchor.toLowerCase() as CanonicalAnchor]
    if (offsets === undefined) throw new Error(`Bad anchor: ${anchor}`)
    return offsets
}

/**
 * How to view an object's position from another space (e.g. a world object's position as
 * screen pixels): toX/toY convert one axis from the object's own space to the other,
 * and fromX/fromY convert back.
 */
export type SpaceConversion = {
    toX(x: number): number
    toY(y: number): number
    fromX(x: number): number
    fromY(y: number): number
}

/** Viewing a world object from the screen: what its screenSpace uses. */
export const WORLD_TO_SCREEN: SpaceConversion = {
    toX: x => camera._worldToScreenX(x),
    toY: y => camera._worldToScreenY(y),
    fromX: x => camera._screenToWorldX(x),
    fromY: y => camera._screenToWorldY(y),
}

/** Viewing a UI object from the world: what its worldSpace uses. */
export const SCREEN_TO_WORLD: SpaceConversion = {
    toX: x => camera._screenToWorldX(x),
    toY: y => camera._screenToWorldY(y),
    fromX: x => camera._worldToScreenX(x),
    fromY: y => camera._worldToScreenY(y),
}

/** Viewing an object from the space it's already in: a UI object's screenSpace. */
export const SAME_SPACE: SpaceConversion = {
    toX: x => x,
    toY: y => y,
    fromX: x => x,
    fromY: y => y,
}

/**
 * Builds a screenSpace/worldSpace object: every position, edge and corner of target, read and
 * written through conversion. Edges convert along their own axis; setting one still resizes
 * the object, just as setting it directly does.
 */
export function _spaceView(target: Record<keyof AlignableScreenSpace, any>, conversion: SpaceConversion): AlignableScreenSpace {
    const { toX, toY, fromX, fromY } = conversion
    const to = ({ x, y }: Vector2): Vector2 => new Vector2(toX(x), toY(y))
    const from = (point: Vector2Like): Vector2 => {
        const { x, y } = Vector2.from(point)
        return new Vector2(fromX(x), fromY(y))
    }

    return {
        get x(): number { return toX(target.x) },
        set x(x: number) { target.x = fromX(x) },

        get y(): number { return toY(target.y) },
        set y(y: number) { target.y = fromY(y) },

        get position(): Vector2 { return to(target.position) },
        set position(position: Vector2Like) { target.position = from(position) },

        get left(): number { return toX(target.left) },
        set left(left: number) { target.left = fromX(left) },

        get right(): number { return toX(target.right) },
        set right(right: number) { target.right = fromX(right) },

        get top(): number { return toY(target.top) },
        set top(top: number) { target.top = fromY(top) },

        get bottom(): number { return toY(target.bottom) },
        set bottom(bottom: number) { target.bottom = fromY(bottom) },

        get topLeft(): Vector2 { return to(target.topLeft) },
        set topLeft(topLeft: Vector2Like) { target.topLeft = from(topLeft) },

        get topCenter(): Vector2 { return to(target.topCenter) },
        set topCenter(topCenter: Vector2Like) { target.topCenter = from(topCenter) },

        get topRight(): Vector2 { return to(target.topRight) },
        set topRight(topRight: Vector2Like) { target.topRight = from(topRight) },

        get bottomLeft(): Vector2 { return to(target.bottomLeft) },
        set bottomLeft(bottomLeft: Vector2Like) { target.bottomLeft = from(bottomLeft) },

        get bottomCenter(): Vector2 { return to(target.bottomCenter) },
        set bottomCenter(bottomCenter: Vector2Like) { target.bottomCenter = from(bottomCenter) },

        get bottomRight(): Vector2 { return to(target.bottomRight) },
        set bottomRight(bottomRight: Vector2Like) { target.bottomRight = from(bottomRight) },

        get centerLeft(): Vector2 { return to(target.centerLeft) },
        set centerLeft(centerLeft: Vector2Like) { target.centerLeft = from(centerLeft) },

        get centerRight(): Vector2 { return to(target.centerRight) },
        set centerRight(centerRight: Vector2Like) { target.centerRight = from(centerRight) },
    }
}

// Vector2 properties are written as accessor pairs so they can be assigned any
// Vector2Like (e.g. an [x, y] array) while still reading back as a Vector2.
export type AlignableScreenSpace = {
    /** This object's horizontal position relative to the screen. */
    x: number
    /** This object's vertical position relative to the screen. */
    y: number
    /** This object's position relative to the screen. */
    get position(): Vector2
    set position(position: Vector2Like)

    /** X coordinate at the left edge of this object, relative to the screen. */
    left: number
    /** X coordinate at the right edge of this object, relative to the screen. */
    right: number
    /** Y coordinate at the top edge of this object, relative to the screen. */
    top: number
    /** Y coordinate at the bottom edge of this object, relative to the screen. */
    bottom: number

    /** Position at the top left corner of this object, relative to the screen. */
    get topLeft(): Vector2
    set topLeft(topLeft: Vector2Like)
    /** Position at the top edge in the horizontal center of this object, relative to the screen. */
    get topCenter(): Vector2
    set topCenter(topCenter: Vector2Like)
    /** Position at the top right corner of this object, relative to the screen. */
    get topRight(): Vector2
    set topRight(topRight: Vector2Like)

    /** Position at the bottom left corner of this object, relative to the screen. */
    get bottomLeft(): Vector2
    set bottomLeft(bottomLeft: Vector2Like)
    /** Position at the bottom edge in the horizontal center of this object, relative to the screen. */
    get bottomCenter(): Vector2
    set bottomCenter(bottomCenter: Vector2Like)
    /** Position at the bottom right corner of this object, relative to the screen. */
    get bottomRight(): Vector2
    set bottomRight(bottomRight: Vector2Like)

    /** Position at the vertical center of the left edge of this object, relative to the screen. */
    get centerLeft(): Vector2
    set centerLeft(centerLeft: Vector2Like)
    /** Position at the vertical center of the right edge of this object, relative to the screen. */
    get centerRight(): Vector2
    set centerRight(centerRight: Vector2Like)
}

/** A UI object's positioning data in world coordinates: see its worldSpace. */
export type AlignableWorldSpace = {
    /** Horizontal world position of whatever's under this object on the screen. */
    x: number
    /** Vertical world position of whatever's under this object on the screen. */
    y: number
    /** World position of whatever's under this object on the screen. */
    get position(): Vector2
    set position(position: Vector2Like)

    /** World x coordinate at the left edge of this object. */
    left: number
    /** World x coordinate at the right edge of this object. */
    right: number
    /** World y coordinate at the top edge of this object. */
    top: number
    /** World y coordinate at the bottom edge of this object. */
    bottom: number

    /** World position at the top left corner of this object. */
    get topLeft(): Vector2
    set topLeft(topLeft: Vector2Like)
    /** World position at the top edge in the horizontal center of this object. */
    get topCenter(): Vector2
    set topCenter(topCenter: Vector2Like)
    /** World position at the top right corner of this object. */
    get topRight(): Vector2
    set topRight(topRight: Vector2Like)

    /** World position at the bottom left corner of this object. */
    get bottomLeft(): Vector2
    set bottomLeft(bottomLeft: Vector2Like)
    /** World position at the bottom edge in the horizontal center of this object. */
    get bottomCenter(): Vector2
    set bottomCenter(bottomCenter: Vector2Like)
    /** World position at the bottom right corner of this object. */
    get bottomRight(): Vector2
    set bottomRight(bottomRight: Vector2Like)

    /** World position at the vertical center of the left edge of this object. */
    get centerLeft(): Vector2
    set centerLeft(centerLeft: Vector2Like)
    /** World position at the vertical center of the right edge of this object. */
    get centerRight(): Vector2
    set centerRight(centerRight: Vector2Like)
}

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

    /**
     * Keeps this object in place and the same size on the screen as the camera moves and
     * zooms, like a UI element.
     */
    pinned?: boolean
}

/**
 * A trait that defines position alignment and anchor point behaviors.
 *
 * Edges and corners are those of the object's axis-aligned bounding box: once it's rotated,
 * left is the x of its leftmost point, topLeft is (left, top), and so on.
 * 
 * If a class composes Alignable, it must have { x: number, y: number, width: number, height: number }.
 * When extending Positionable, Sizable, Rotatable, and Alignable, make sure Positionable, Sizable,
 * and Rotatable come earlier in the inheritance chain, e.g.
 * 
 * class ClassName extends
 *  ExampleMixin(
 *  Alignable(
 *  Rotatable(
 *  Sizable(
 *  Positionable(
 *  OtherMixin(
 *  ...
 */
// width/height are declared as accessors, not properties, so a class further
// down the chain can override them with accessors of its own
export function Alignable<Base extends Class<{
    x: number
    y: number
    get position(): Vector2
    set position(position: Vector2Like)
    get width(): number
    set width(width: number)
    get height(): number
    set height(height: number)
    get screenSpace(): PositionableScreenSpace
    // Pinning comes in halves from Positionable (position) and Sizable (scale); Alignable
    // pins both, so an aligned edge or corner stays put on the screen too
    _positionPinned: boolean
    _pinPosition(): void
    _unpinPosition(): void
    _scalePinned: boolean
    _pinScale(): void
    _unpinScale(): void
    // From Rotatable; the object is drawn at (_rotation - _rotationOffset) degrees
    _rotation: number
    _rotationOffset: number
}>>(base: Base) {
    return class Alignable extends base {
        constructor(...args: any[]) {
            super()
        }

        _initAlignable(props?: AlignableProps) {
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
            // Positionable and Sizable each pin their own half from props.pinned already
        }

        /**
         * Whether this object stays in place and the same size on the screen as the camera moves
         * and zooms, like a UI element. Moving or resizing a pinned object pins it at its new
         * position and size. Setting this is the same as calling pin() or unpin().
         */
        get pinned(): boolean {
            return this._positionPinned || this._scalePinned
        }
        set pinned(pinned: boolean) {
            if (pinned) this.pin()
            else this.unpin()
        }

        /**
         * Keep this object in place and the same size on the screen, wherever and however big it
         * is right now, as the camera moves and zooms. Good for something that only needs to
         * stick to the screen temporarily. For UI that always stays on the screen, use a UI
         * object instead, like `new UI.Label()`.
         *
         * ```js
         * marker.goToScreen(Screen.topLeft, 'topLeft')
         * marker.pin()
         * ```
         */
        pin() {
            this._pinPosition()
            this._pinScale()
        }

        /** Stop keeping this object in place on the screen. It stays where it is, at its current size, in the world. */
        unpin() {
            this._unpinPosition()
            this._unpinScale()
        }

        /**
         * The angle, in radians, that bounds are worked out at. Shapes that look the same at
         * any rotation (circles) override this to return 0.
         */
        _boundsRadians(): number {
            return deg2rad(this._rotation - this._rotationOffset)
        }

        /**
         * |cos| and |sin| of _boundsRadians(), snapped at right angles so an object rotated by
         * a multiple of 90 degrees gets exact bounds instead of ones off by float error.
         */
        _boundsTrig(): [number, number] {
            const radians = this._boundsRadians()
            const cos = Math.abs(Math.cos(radians))
            const sin = Math.abs(Math.sin(radians))
            if (sin < 1e-12) return [1, 0]
            if (cos < 1e-12) return [0, 1]
            return [cos, sin]
        }

        /** Half the width and height of this object's axis-aligned bounding box. */
        _halfBounds(): [number, number] {
            const [cos, sin] = this._boundsTrig()
            const { width, height } = this
            return [(width * cos + height * sin) / 2, (width * sin + height * cos) / 2]
        }

        /**
         * Resize this object so its bounding box is `size` wide (axis 'x') or tall (axis 'y'),
         * changing its own width and height by the smallest amount that does it. Unrotated, that's
         * just width for 'x' and height for 'y'; at 90 degrees they swap, and in between both change.
         */
        _setBoundsSize(axis: 'x' | 'y', size: number) {
            const [cos, sin] = this._boundsTrig()
            // How much the bounding box grows per unit of width and of height
            const [perWidth, perHeight] = axis === 'x' ? [cos, sin] : [sin, cos]
            const { width, height } = this
            const change = size - (width * perWidth + height * perHeight)

            let newWidth = width + change * perWidth
            let newHeight = height + change * perHeight
            // Shrinking far enough would take one side below zero; past that point, the other side
            // alone makes up the difference (this is continuous with the case above)
            if (newWidth < 0) {
                newWidth = 0
                newHeight = perHeight > 0 ? size / perHeight : 0
            } else if (newHeight < 0) {
                newHeight = 0
                newWidth = perWidth > 0 ? size / perWidth : 0
            }

            // Only set what changed: some objects tie the two together (Circle's height sets its width)
            if (newWidth !== width) this.width = newWidth
            if (newHeight !== height) this.height = newHeight
        }

        /**
         * X coordinate at the left edge of this object (its leftmost point, if rotated).
         * Setting it resizes the object, keeping the right edge in place.
         */
        get left(): number {
            return this.x - this._halfBounds()[0]
        }
        set left(left: number) {
            this._setBoundsSize('x', Math.abs(this.right - left))
            this.x = left + this._halfBounds()[0]
        }

        /**
         * X coordinate at the right edge of this object (its rightmost point, if rotated).
         * Setting it resizes the object, keeping the left edge in place.
         */
        get right(): number {
            return this.x + this._halfBounds()[0]
        }
        set right(right: number) {
            this._setBoundsSize('x', Math.abs(this.left - right))
            this.x = right - this._halfBounds()[0]
        }

        /**
         * Y coordinate at the top edge of this object (its highest point, if rotated).
         * Setting it resizes the object, keeping the bottom edge in place.
         */
        get top(): number {
            return this.y + this._halfBounds()[1]
        }
        set top(top: number) {
            this._setBoundsSize('y', Math.abs(this.bottom - top))
            this.y = top - this._halfBounds()[1]
        }

        /**
         * Y coordinate at the bottom edge of this object (its lowest point, if rotated).
         * Setting it resizes the object, keeping the top edge in place.
         */
        get bottom(): number {
            return this.y - this._halfBounds()[1]
        }
        set bottom(bottom: number) {
            this._setBoundsSize('y', Math.abs(this.top - bottom))
            this.y = bottom + this._halfBounds()[1]
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
         * Used to access and/or modify this object's positioning data in screen-space coordinates.
         * This allows you to position something relative to the screen itself.
         *
         * For example, placing a sprite's top left corner in the center of the screen:
         *
         * ```js
         * sprite.screenSpace.topLeft = [0, 0]
         * ```
         */
        get screenSpace(): AlignableScreenSpace {
            return _spaceView(this, WORLD_TO_SCREEN)
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
         * @param anchor Where to anchor this object in its new position. e.g., if using 'topleft'
         * (or 'topLeft' — either casing is accepted), this object's top left point will be placed
         * at other's position. If rotated, the point is on its axis-aligned bounding box.
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
                // A UI object going to a world object (or vice versa) goes where it appears on the screen
                const point = camera._toSpaceOf(this, other)

                // Going to a Vector2Like with no anchor; e.g. goTo(sprite)
                if (anchor === undefined) {
                    this.x = point.x
                    this.y = point.y
                }
                // Going to a Vector2Like with a self-anchor; e.g. goTo([10, 25], 'topleft')
                else if (typeof(anchor) === 'string') {
                    const [ xFact, yFact ] = anchorOffsets(anchor)
                    const [ halfWidth, halfHeight ] = this._halfBounds()
                    this.x = point.x - 2 * halfWidth * xFact
                    this.y = point.y - 2 * halfHeight * yFact
                }
            }
        }

        /**
         * Set position relative to the screen, without resizing.
         * @param x New horizontal position relative to the screen.
         * @param y New vertical position relative to the screen.
         */
        goToScreen(x: number, y: number): void
        /**
         * Set position relative to the screen, without resizing.
         * @param other New position relative to the screen.
         * @param anchor Where to anchor this object in its new position. e.g., if using 'topleft'
         * (or 'topLeft' — either casing is accepted), this object's top left point will be placed
         * at other's position. If rotated, the point is on its axis-aligned bounding box.
         */
        goToScreen(other: Vector2Like, anchor?: AnchorPoint): void
        goToScreen(xOrOther: number | Vector2Like, yOrAnchor?: number | AnchorPoint) {
            if (typeof(xOrOther) === 'number' && typeof(yOrAnchor) === 'number') {
                this.goTo(camera._screenToWorld([xOrOther, yOrAnchor]))
            }
            else if (isVector2Like(xOrOther) && typeof(yOrAnchor) !== 'number') {
                this.goTo(camera._screenToWorld(xOrOther), yOrAnchor)
            }
        }
    }
}
