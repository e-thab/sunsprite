import type { Point } from "./Point"

export default class Screen {
    _cam: Phaser.Cameras.Scene2D.Camera

    constructor(cam: Phaser.Cameras.Scene2D.Camera) {
        this._cam = cam
    }
    
    get width(): number {
        return this._cam.width
    }
    get height(): number {
        return this._cam.height
    }
    
    get top(): number {
        return this._cam.height / 2
    }
    get bottom(): number {
        return -this._cam.height / 2
    }
    get left(): number {
        return -this._cam.width / 2
    }
    get right(): number {
        return this._cam.width / 2
    }

    _setCam(cam: Phaser.Cameras.Scene2D.Camera) {
        this._cam = cam
    }
}