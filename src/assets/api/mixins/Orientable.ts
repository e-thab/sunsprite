import type { Class } from "@mixins/shared"
import { Vector2, type Vector2Like } from "@api/Vector2"

export type OrientableProps = {
    
}

/**
 * A trait that defines rotational behaviors that need positional context.
 * 
 * If class composes Orientable, it must have { x: number, y: number, width: number, height: number }.
 * When extending Positionable, Rotatable, and Orientable, make sure Positionable and Rotatable come
 * earlier in the inheritance chain, e.g.
 * 
 * class ClassName extends
 *  ExampleMixin(
 *  Orientable(
 *  Rotatable(
 *  Positionable(
 *  OtherMixin(
 *  ...
 */
export function Orientable<Base extends Class<{
    x: number
    y: number
    rotation: number
    radians: number
}>>(base: Base) {
    return class Orientable extends base {
        constructor(...args: any[]) {
            super()
        }

        _initOrientable(props?: OrientableProps) {
            
        }

        /** The direction this object will move when using move(). */
        get forwardDirection(): Vector2 {
            return Vector2.RIGHT // temp
        }
        set forwardDirection(dir: Vector2Like) {

        }

        /**
         * Point this object's forward direction toward a specified point.
         * @param other The point, object, or vector endpoint to look at.
         */
        lookAt(other: Vector2Like) {

        }

        /**
         * Move this object along its forward direction.
         * @param distance How far to move.
         */
        move(distance: number) {

        }
    }
}