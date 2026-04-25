import { Positionable } from "./mixins"
import { updateSpritePositions } from "./core"

export default class Camera extends Positionable(class {}) {
    zoom: number
    
    constructor() {
        super()
        this.zoom = 0
    }

    // get x() {
    //     return this._x
    // }
    // set x(x) {
    //     this._x = x
    //     this._updateX()
    //     updateSpritePositions()
    // }

    // get y() {
    //     return this._y
    // }
    // set y(y) {
    //     this._y = y
    //     this._updateY()
    //     updateSpritePositions()
    // }

    _updateX() {
        updateSpritePositions()
    }

    _updateY() {
        updateSpritePositions()
    }
}

// export default class Camera extends Positionable(class {}) {
//     // TODO: zoom, rotate, smoothing
//     zoom: number
//     _x: number = 0
//     _y: number = 0

//     constructor() {
//         super()
//         this.zoom = 0
//     }

//     get x() {
//         return this._x
//     }
//     set x(x) {
//         this._x = x
//         updateSpritePositions()
//     }

//     get y() {
//         return this._y
//     }
//     set y(y) {
//         this._y = y
//         updateSpritePositions()
//     }

//     _updatePosition(): void {
//         updateSpritePositions()
//     }
// }