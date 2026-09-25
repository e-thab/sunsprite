import { atan2, deg2rad, rad2deg } from "@api/utility"
import type { ReferenceObject } from "@api/types"
import type { Class } from "@mixins/shared"
import { Vector2, type Vector2Like } from "@api/Vector2"
import Warning from "../Warning"
import Output from "@/sandbox/output"

export type RotatableProps = {
    /** Rotation angle in degrees. */
    rotation?: number
    /** Rotation angle in radians. */
    radians?: number
    /** The direction this object is pointing as a normalized Vector2. */
    direction?: Vector2Like
}

export function Rotatable<Base extends Class>(base: Base) {
    return class Rotatable extends base {
        _refObj?: ReferenceObject
        _rotation: number = 0
        /** Added to rotation on every set, used to implement forward direction logic */
        _rotationOffset: number = 0

        constructor(...args: any[]) {
            super()
        }

        _initRotatable(props?: RotatableProps) {
            // Warn about conflicting properties overwrite hierarchy
            // if (props?.rotation !== undefined && props?.radians !== undefined && props?.direction !== undefined) {
            //     throw new Warning(`Conflicting rotation properties: (rotation + radians + direction). Only rotation will be set.`)
            // }
            // else if (props?.rotation !== undefined && props?.radians !== undefined) {
            //     throw new Warning(`Conflicting rotation properties: (rotation + radians). Only rotation will be set.`)
            // }
            // else if (props?.direction !== undefined && props?.rotation !== undefined) {
            //     throw new Warning(`Conflicting rotation properties: (rotation + direction). Only rotation will be set.`)
            // }
            // else if (props?.direction !== undefined && props?.radians !== undefined) {
            //     throw new Warning(`Conflicting rotation properties: (radians + direction). Only radians will be set.`)
            // }

            // Warn about conflicting property overwrite hierarchy
            const conflicting: Set<string> = new Set()
            if (props?.rotation !== undefined && props?.radians !== undefined) {
                conflicting.add('rotation')
                conflicting.add('radians')
            } else if (props?.direction !== undefined && props?.rotation !== undefined) {
                conflicting.add('direction')
                conflicting.add('rotation')
            } else if (props?.direction !== undefined && props?.radians !== undefined) {
                conflicting.add('direction')
                conflicting.add('radians')
            }
            if (conflicting.size > 0) {
                const order = ['rotation', 'radians', 'direction']
                const rank = new Map(order.map((value, index) => [value, index]))
                const sorted = Array.from(conflicting).sort((a, b) => (rank.get(a) ?? Infinity) - (rank.get(b) ?? Infinity))

                // TODO: Add editor line location
                throw new Warning(`Conflicting rotation properties: (${Array.from(conflicting).join(', ')}). Only ${sorted[0]} will be set.`)
                // Output.warn(`Conflicting rotation properties: (${Array.from(conflicting).join(', ')}). Only ${sorted[0]} will be set.`)
            }
            
            if (props?.rotation !== undefined) {
                this.rotation = props.rotation
            } else if (props?.radians !== undefined) {
                this.radians = props.radians
            } else if (props?.direction !== undefined) {
                this.direction = props.direction
            } else {
                // default
                this.rotation = 0
            }
        }

        /** Rotation angle in degrees. */
        get rotation(): number {
            return this._rotation
        }
        set rotation(degrees: number) {
            this._rotation = degrees/* - rad2deg(this._radiansOffset)*/
            // if (this._refObj) this._refObj.rotation = -deg2rad(degrees) - this._radiansOffset
            this._updateRefRotation()
        }

        /** Rotation angle in radians. */
        get radians(): number {
            return deg2rad(this._rotation)
            // return this._refObj ? -this._refObj.rotation : deg2rad(this._rotation)
        }
        set radians(radians: number) {
            this._rotation = rad2deg(radians)
            // if (this._refObj) this._refObj.rotation = -radians - this._radiansOffset
            this._updateRefRotation()
        }

        /** The direction this object considers to be forward. (normalized) */
        get direction(): Vector2 {
            const radians = this.radians
            const cos = Math.cos(radians)
            const sin = Math.sin(radians)

            return Vector2.from(
                Math.abs(cos) < 1e-15 ? 0 : cos,
                Math.abs(sin) < 1e-15 ? 0 : sin,
            )
        }
        set direction(dir: Vector2Like) {
            this.radians = Vector2.from(dir).radians
        }

        // Come back to this..? Maybe use something like a moveDirection()?
        // get forwardDirection(): Vector2 {
        //     const cos = Math.cos(this._radiansOffset)
        //     const sin = Math.sin(this._radiansOffset)

        //     return Vector2.from(
        //         Math.abs(cos) < 1e-15 ? 0 : cos,
        //         Math.abs(sin) < 1e-15 ? 0 : sin,
        //     )
        // }
        // set forwardDirection(dir: Vector2Like) {
        //     // const newDir = Vector2.from(dir).normal
        //     // Output.print('old off: ', this._radiansOffset)
        //     // Output.print('new off: ', newDir.theta - this._radiansOffset)
        //     // this._radiansOffset = deg2rad(newDir.theta) - this._radiansOffset
        //     this._radiansOffset = Vector2.from(dir).normal.getAngle('radians')
        //     this._updateRefRotation()
        // }

        /**
         * Rotation offset in degrees. Use this to change the neutral rotation of the object, for
         * example you may want a sprite to point along its up direction when looking at other points:
         * 
         * this.rotationOffset = Vector2.UP.rotation
         */
        get rotationOffset(): number {
            return this._rotationOffset
        }
        set rotationOffset(offsetDegrees: number) {
            this._rotationOffset = offsetDegrees
            this._updateRefRotation()
        }

        /**
         * Rotation offset in radians. Use this to change the neutral rotation of the object, for
         * example you may want a sprite to point along its up direction when looking at other points:
         * 
         * this.radiansOffset = Vector2.UP.radians
         */
        get radiansOffset(): number {
            return deg2rad(this._rotationOffset)
        }
        set radiansOffset(offsetRadians: number) {
            this._rotationOffset = rad2deg(offsetRadians)
            this._updateRefRotation
        }

        /**
         * Rotates this object by a given amount.
         * @param amount How much to rotate by.
         * @param unit The angle unit ('radians' or 'degrees'), defaults to degrees.
         */
        rotate(amount: number, unit: 'radians' | 'degrees' = 'degrees') {
            if (unit === 'radians') {
                this.radians += amount
            } else {
                this.rotation += amount
            }
        }

        _updateRefRotation() {
            if (this._refObj) this._refObj.rotation = deg2rad(this._rotationOffset - this._rotation)
        }
    }
}
