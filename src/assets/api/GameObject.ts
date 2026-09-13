// import type { Touchable } from "./types"
import { Sizable, Positionable, Rotatable, Viewable, Interactable, Timeable, Alignable, type GameObjectProps } from "./mixins"

/**
 * General type for most objects actually rendered in the game. Saves the trouble of
 * typing out Sizable(Positionable(Rotatable(... every time
 */
export default abstract class GameObject extends
Rotatable(
    Viewable(
    Interactable(
    Alignable(
    Sizable(
    Positionable(
    Timeable(class {
        constructor() {
            // If at any point it becomes useful for mixins to have access to object
            // props, this constructor needs the args in order for concrete object
            // constructors to pass their props object argument to each component constructor.
        }
    }))))))) {

    constructor() {
        // This constructor would also need to receive args and pass the props object to super
        super()
    }
    
    _initMixins(props?: GameObjectProps) {
        this._initPositionable(props)
        this._initSizable(props)
        this._initRotatable(props)
        this._initInteractable(props)
        this._initViewable(props)
        this._initAlignable(props)
    }
    
    // touching(other: Touchable): boolean {
    //     return !(
    //         this.right < other.left ||
    //         this.left > other.right ||
    //         this.top < other.bottom ||
    //         this.bottom > other.top
    //     )
    // }
}