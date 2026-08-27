import { clock } from "../core"
import type { Class } from "./shared"

export function Timeable<Base extends Class>(base: Base) {
    return class Timeable extends base {
        _initTime: number

        constructor(...args: any[]) {
            super()
            this._initTime = clock.time
        }

        get age(): number {
            // Returns this object's age in seconds not including pause time
            return (clock.time - this._initTime) / 1000
        }

        get ageMs(): number {
            return clock.time - this._initTime
        }
    }
}
export const timeableApi = [
    // Props
    `/** How long this object has existed in seconds. */
    age: number`,

    // Methods
    // ...
].join('\n')
