import { Sizable, Positionable, Rotatable, Viewable, Timeable } from "./mixins"

/**
 * General type for most objects actually rendered in the game. Saves the trouble of
 * typing out Sizable(Positionable(Rotatable(... every time
 */
export default abstract class GameObject extends
    Sizable(
    Positionable(
    Rotatable(
    Viewable(
    Timeable(class {
        constructor(...args: any[]) {
            // Constructor needs the args in order for concrete object constructors
            // to pass their props object argument to each component constructor.
        }
    }))))) {

    constructor(...args: any[]) {
        // This constructor also needs to receive args and pass it to super
        super(args)
    }
}