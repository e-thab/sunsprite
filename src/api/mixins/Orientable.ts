import type { Class } from "@mixins/shared"
import { Vector2, type Vector2Like } from "@api/Vector2"
import { cos, sin } from "../utility"

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
    direction: Vector2
}>>(base: Base) {
    return class Orientable extends base {
        constructor(...args: any[]) {
            super()
        }

        _initOrientable(props?: OrientableProps) {
            
        }

        /**
         * Point this object toward another.
         * @param other The point, vector, or positionable object to look at.
         */
        lookAt(other: Vector2Like) {
            other = Vector2.from(other)
            this.direction = Vector2.from(other.x - this.x, other.y - this.y)
        }

        /**
         * Move this object along its forward direction.
         * @param distance How far to move.
         */
        move(distance: number) {
            this.x += this.direction.x * distance
            this.y += this.direction.y * distance
        }

        /**
         * Rotate this object around a point.
         * @param other The point, vector, or positionable object to orbit.
         * @param unit The angle unit ('radians' or 'degrees'), defaults to degrees.
         */
        orbit(other: Vector2Like, angle: number, unit: 'radians' | 'degrees' = 'degrees') {
            other = Vector2.from(other)
            const x = this.x
            const y = this.y
            this.x = other.x + (x - other.x) * cos(angle, unit) - (y - other.y) * sin(angle, unit)
            this.y = other.y + (x - other.x) * sin(angle, unit) + (y - other.y) * cos(angle, unit)
        }
    }
}