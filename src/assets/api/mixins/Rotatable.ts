import { deg2rad, rad2deg } from "@api/utility"
import type { ReferenceObject } from "@api/types"
import type { Class } from "@mixins/shared"
import { Vector2, type Vector2Like } from "@api/Vector2"
import Warning from "../Warning"

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

                throw new Warning(`Conflicting rotation properties: (${Array.from(conflicting).join(', ')}). Only ${sorted[0]} will be set.`)
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
            this._rotation = degrees
            if (this._refObj) this._refObj.rotation = -deg2rad(degrees)
        }

        /** Rotation angle in radians. */
        get radians(): number {
            // return deg2rad(this._rotation)
            return this._refObj ? -this._refObj.rotation : deg2rad(this._rotation)
        }
        set radians(radians: number) {
            this._rotation = rad2deg(radians)
            if (this._refObj) this._refObj.rotation = -radians
        }

        get direction(): Vector2 {
            const cos = Math.cos(this.radians)
            const sin = Math.sin(this.radians)

            return Vector2.from(
                Math.abs(cos) < 1e-15 ? 0 : cos,
                Math.abs(sin) < 1e-15 ? 0 : sin,
            )
        }
        set direction(dir: Vector2Like) {
            const { x, y } = Vector2.from(dir).normal
            this.radians = Math.atan2(y, x)
        }

        /** Rotate this object  */
        rotate(amount: number, unit: 'radians' | 'degrees' = 'degrees') {
            if (unit === 'radians') {
                this.radians += amount
            } else {
                this.rotation += amount
            }
        }
    }
}
