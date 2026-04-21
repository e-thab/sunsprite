import { Sizable, Positionable, Rotatable, Viewable, Timeable } from "./mixins"

/**
 * General type for most objects actually rendered in the game. Saves the trouble of
 * typing out Sizable(Positionable(Rotatable(... every time
 */
export default abstract class GameObject extends Sizable(Positionable(Rotatable(Viewable(Timeable(class {}))))) {}