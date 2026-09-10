import { clock } from "@api/core"
import type { Class } from "@mixins/shared"

export function Timeable<Base extends Class>(base: Base) {
    return class Timeable extends base {
        _initTime: number

        constructor(...args: any[]) {
            super()
            this._initTime = clock.time
        }

        /** How long this object has existed, in seconds (not including paused time). */
        get age(): number {
            return (clock.time - this._initTime) / 1000
        }

        /** How long this object has existed, in milliseconds (not including paused time). */
        get ageMs(): number {
            return clock.time - this._initTime
        }
    }
}
