import { Sizable, Positionable, Rotatable, Viewable, Timeable } from "./mixins"

/**
 * General type for most objects actually rendered in the game. Saves the trouble of
 * typing out Sizable(Positionable(Rotatable(... every time
 */
interface Props {

}
export default abstract class GameObject extends
    Sizable(
    Positionable(
    Rotatable(
    Viewable(
    Timeable(class {
        constructor(...args: any[]) {
            // console.log(args)
        }
    }))))) {

    constructor(...args: any[]) {
        super(args)
    }
}