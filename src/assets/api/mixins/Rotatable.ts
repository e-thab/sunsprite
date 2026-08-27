import { deg2rad, rad2deg } from "../utility"
import type { Point } from "../Point"
import type { ReferenceObject } from "../types"
import type { Class } from "./shared"

export type RotatableProps = {
    rotation?: number
    radians?: number
}

const propDescription: Record<keyof RotatableProps, string> = {
    rotation: `Rotation angle in degrees.`,
    radians: `Rotation angle in radians.`,
}

export const rotatablePropsTypeDef = `
type RotatableProps = {
    /** ${propDescription.rotation} */
    rotation?: number

    /** ${propDescription.radians} */
    radians?: number
}`
export const rotatableApi = [
    // Props
    `/** ${propDescription.rotation} */
    rotation: number`,

    `/** ${propDescription.radians} */
    radians: number`

    // Methods
    // ...
].join('\n')

export function Rotatable<Base extends Class>(base: Base) {
    return class Rotatable extends base {
        _refObj?: ReferenceObject
        _rotation: number = 0

        constructor(...args: any[]) {
            super()
        }

        initRotatable(props?: RotatableProps) {
            // Can't null-ish coalesce since rotation & radians overwrite each other
            if (props?.rotation && props?.radians) {
                // warn?
            } else if (props?.rotation !== undefined) {
                this.rotation = props.rotation
            } else if (props?.radians !== undefined) {
                this.radians = props.radians
            } else {
                // default
                this.rotation = 0
            }
        }

        get rotation(): number {
            return this._rotation
        }
        set rotation(angle: number) {
            this._rotation = angle
            if (this._refObj) this._refObj.rotation = deg2rad(angle)
        }

        get radians(): number {
            return deg2rad(this._rotation)
        }
        set radians(rad: number) {
            this._rotation = rad2deg(rad)
            if (this._refObj) this._refObj.rotation = rad
        }

        lookAt(other: Point) {
            // TODO: lookAt()
        }
    }
}
