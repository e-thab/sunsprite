// import type { Touchable } from "./types"
import { Sizable, Positionable, Rotatable, Viewable, Interactable, Timeable, type GameObjectProps } from "./mixins/index"

/**
 * General type for most objects actually rendered in the game. Saves the trouble of
 * typing out Sizable(Positionable(Rotatable(... every time
 */
export default abstract class GameObject extends
    Sizable(
    Rotatable(
    Viewable(
    Interactable(
    Positionable(
    Timeable(class {
        constructor() {
            // If at any point it becomes useful for mixins to have access to object
            // props, this constructor needs the args in order for concrete object
            // constructors to pass their props object argument to each component constructor.
        }
    })))))) {

    constructor() {
        // This constructor would also need to receive args and pass the props object to super
        super()
    }
    
    // WIP
    _initMixins(props?: GameObjectProps) {
        this._initPositionable(props)
        this._initSizable(props)
        this._initRotatable(props)
        this._initInteractable(props)
        this._initViewable(props)

        // if (props?.onDrag) {
        //     this.onDrag = props.onDrag
        // } else
        
        // TODO: test this; originally had the if/else above connected, don't
        // remember why but it seems redundant since it already does that in the mixin
        // if (this._refObj && !props?.onDrag) {
        //     this.onDrag = (x: number, y: number) => {
        //         // this._refObj.x = x + screen.right
        //         // this._refObj.y = -y + screen.top
        //         this.x = x
        //         this.y = y
        //     }
        // }
    }

    // TODO: move these position getters to a mixin, Boundable or something like that
    // get left(): number {
    //     return this.x - this.width / 2
    // }
    //set left(left: number)

    // get right(): number {
    //     return this.x + this.width / 2
    // }
    //set right(right: number)

    // get top(): number {
    //     return this.y + this.height / 2
    // }
    //set top(top: number)
    
    // get bottom(): number {
    //     return this.y - this.height / 2
    // }
    //set bottom(bottom: number)

    // get topLeft(): Point {
    //     return {
    //         x: this.left,
    //         y: this.top
    //     }
    // }
    // set topLeft(topLeft: Point)

    // get topCenter(): Point {
    //     return {
    //         x: this.x,
    //         y: this.top
    //     }
    // }
    // set topCenter(topCenter: Point)

    // get topRight(): Point {
    //     return {
    //         x: this.right,
    //         y: this.top
    //     }
    // }
    // set topRight(topRight: Point)

    // get leftCenter(): Point {
    //     return {
    //         x: this.left,
    //         y: this.y
    //     }
    // }
    // set leftCenter(leftCenter: Point)

    // get rightCenter(): Point {
    //     return {
    //         x: this.right,
    //         y: this.y
    //     }
    // }
    // set rightCenter(rightCenter: Point)

    // get bottomLeft(): Point {
    //     return {
    //         x: this.left,
    //         y: this.bottom
    //     }
    // }
    // set bottomLeft(bottomLeft: Point)

    // get bottomCenter(): Point {
    //     return {
    //         x: this.x,
    //         y: this.bottom
    //     }
    // }
    // set bottomCenter(bottomCenter: Point)
    
    // get bottomRight(): Point {
    //     return {
    //         x: this.right,
    //         y: this.bottom
    //     }
    // }
    // set bottomRight(bottomRight: Point)
    
    // touching(other: Touchable): boolean {
    //     return !(
    //         this.right < other.left ||
    //         this.left > other.right ||
    //         this.top < other.bottom ||
    //         this.bottom > other.top
    //     )
    // }
}