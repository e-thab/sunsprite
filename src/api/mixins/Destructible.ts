import type { Class } from "@mixins/shared"

export function Destructible<Base extends Class>(base: Base) {
    return class Destructible extends base {
        _refObj?: { destroy: () => void }
        _isDestroyed: boolean = false

        constructor(...args: any[]) {
            super()
        }

        get isDestroyed(): boolean {
            return this._isDestroyed
        }

        /**
         * Remove this object from the game. Does not automatically destroy any variables
         * it might be assigned to or remove it from any arrays it might belong to. You'll
         * have to do that yourself.
         * 
         * If you need to destroy a variable, set it to null. e.g.
         * let variable = new Sprite()
         * // later, when ready to destroy:
         * variable = null
         * 
         * [See the docs page on removing an object from an array.]()
         */
        destroy() {
            this._refObj?.destroy()
            this._isDestroyed = true
        }
    }
}
