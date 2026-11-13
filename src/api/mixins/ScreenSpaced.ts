import type { Class } from "@mixins/shared"
import type { ReferenceObject } from "@api/types"
import { _spaceView, SAME_SPACE, SCREEN_TO_WORLD, type AlignableScreenSpace, type AlignableWorldSpace, type AnchorPoint } from "@mixins/Alignable"
import { camera, uiCamera } from "@api/core"
import { Vector2, type Vector2Like } from "@api/Vector2"

/**
 * Hands a Phaser object over to the UI camera (see core.ts's create()): drawn by it and hit-tested
 * against it, and no longer by the main camera, which every object starts out on.
 */
export function _drawOnUiCamera(refObj: ReferenceObject | undefined) {
    // cameraFilter is a mask of the cameras that *skip* an object
    if (refObj) refObj.cameraFilter = camera._cam.id
}

/**
 * Turns a world object class into its UI counterpart (Label -> UI.Label): an object whose x/y,
 * edges and size are screen pixels, drawn by the UI camera, which never moves or zooms. Nothing
 * about the object's own geometry changes; the UI camera shows Phaser coordinates as-is, which
 * is exactly where Positionable already puts them for a camera at [0, 0] and zoom 1.
 *
 * Mostly doc-comment overrides, so the editor says "on the screen" rather than "in the world",
 * plus what doesn't apply to a UI object: pinning (it's always on the screen), and converting
 * to and from the camera's space.
 *
 * Its members are layered over the class it wraps by the declaration generator
 * (scripts/api-codegen/extract.ts's resolveComposedMembers), like any mixin's.
 */
// x/y/position are declared as accessors, not properties, so this can override them with accessors
export function ScreenSpaced<Base extends Class<
    Record<Exclude<keyof AlignableScreenSpace, 'x' | 'y' | 'position'>, any> & {
        _refObj?: ReferenceObject
        get _ui(): boolean
        get x(): number
        set x(x: number)
        get y(): number
        set y(y: number)
        get position(): Vector2
        set position(position: Vector2Like)
        get pinned(): boolean
        set pinned(pinned: boolean)
        pin(): void
        unpin(): void
        _pinPosition(): void
        _pinScale(): void
        get screenSpace(): AlignableScreenSpace
        goTo(x: number, y: number): void
        goTo(other: Vector2Like, anchor?: AnchorPoint): void
        goToScreen(x: number, y: number): void
        goToScreen(other: Vector2Like, anchor?: AnchorPoint): void
        _fromPhaserPoint(x: number, y: number): { x: number, y: number }
    }
>>(base: Base) {
    return class ScreenSpaced extends base {
        constructor(...args: any[]) {
            super(...args)
            _drawOnUiCamera(this._refObj)
        }

        get _ui(): boolean {
            return true
        }

        /** Horizontal position on the screen, in pixels from its center. The camera doesn't affect it. */
        get x(): number {
            return super.x
        }
        set x(x: number) {
            super.x = x
        }

        /** Vertical position on the screen, in pixels from its center. The camera doesn't affect it. */
        get y(): number {
            return super.y
        }
        set y(y: number) {
            super.y = y
        }

        /** Position on the screen, in pixels from its center. The camera doesn't affect it. */
        get position(): Vector2 {
            return super.position
        }
        set position(position: Vector2Like) {
            super.position = position
        }

        /**
         * Always true. UI object always follow the camera and ignore zoom, so pinning does nothing.
         * To have something move with the world, use a world object like Sprite instead of UI.Sprite.
         */
        get pinned(): boolean {
            return true
        }
        set pinned(pinned: boolean) {}

        /**
         * Does nothing. UI objects already follow the camera and ignore zoom. To have something
         * move with the world, use a world object like Sprite instead of UI.Sprite
         */
        pin() {}

        /**
         * Does nothing. UI objects already follow the camera and ignore zoom. To have something
         * move with the world, use a world object like Sprite instead of UI.Sprite
         */
        unpin() {}

        // Also keeps a `pinned: true` prop from pinning anything during construction
        _pinPosition() {}
        _pinScale() {}

        /**
         * This object's positioning data relative to the screen. A UI object's own position is
         * already relative to the screen, so these are the same as its x, y, edges and corners;
         * they're here so code that works with any object can use screenSpace on this one too.
         */
        get screenSpace(): AlignableScreenSpace {
            return _spaceView(this, SAME_SPACE)
        }

        /**
         * Used to access and/or modify this object's positioning data in world coordinates: the
         * spot in the world it's over, given where the camera is and how far it's zoomed.
         *
         * For example, finding the point in the world under a crosshair:
         *
         * ```js
         * const target = crosshair.worldSpace.position
         * ```
         */
        get worldSpace(): AlignableWorldSpace {
            return _spaceView(this, SCREEN_TO_WORLD)
        }

        /**
         * Set position on the screen.
         * @param x New horizontal position, in pixels from the center of the screen.
         * @param y New vertical position, in pixels from the center of the screen.
         */
        goTo(x: number, y: number): void
        /**
         * Set position on the screen.
         * @param other New position on the screen. If it's a world object, this goes to where
         * that object appears on the screen.
         * @param anchor Where to anchor this object in its new position. e.g., if using 'topleft'
         * (or 'topLeft' — either casing is accepted), this object's top left point will be placed
         * at other's position. If rotated, the point is on its axis-aligned bounding box.
         */
        goTo(other: Vector2Like, anchor?: AnchorPoint): void
        goTo(xOrOther: number | Vector2Like, yOrAnchor?: number | AnchorPoint) {
            super.goTo(xOrOther as any, yOrAnchor as any)
        }

        /**
         * Same as goTo: a UI object's position is already relative to the screen.
         * @param x New horizontal position, in pixels from the center of the screen.
         * @param y New vertical position, in pixels from the center of the screen.
         */
        goToScreen(x: number, y: number): void
        /**
         * Same as goTo: a UI object's position is already relative to the screen.
         * @param other New position on the screen.
         * @param anchor Where to anchor this object in its new position. e.g., if using 'topleft'
         * (or 'topLeft' — either casing is accepted), this object's top left point will be placed
         * at other's position. If rotated, the point is on its axis-aligned bounding box.
         */
        goToScreen(other: Vector2Like, anchor?: AnchorPoint): void
        goToScreen(xOrOther: number | Vector2Like, yOrAnchor?: number | AnchorPoint) {
            super.goTo(xOrOther as any, yOrAnchor as any)
        }

        /** The UI camera's Phaser coordinates are screen pixels from the top left, y down. */
        _fromPhaserPoint(x: number, y: number): { x: number, y: number } {
            return new Vector2(x - uiCamera.width / 2, -(y - uiCamera.height / 2))
        }
    }
}
