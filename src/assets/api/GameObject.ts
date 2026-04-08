import type { Positionable, Rotatable, Viewable } from "./interfaces"
import { app, camera, Timer } from "./core"
import { deg2rad, rad2deg } from "./utility"

export default abstract class GameObject implements Positionable, Rotatable, Viewable {
    protected _pixiObject: any
    protected _x: number
    protected _y: number
    protected _rotation: number
    // protected _pivotX: number
    // protected _pivotY: number
    protected _alpha: number
    // protected _cursor: string
    // protected _radians: number
    protected _initTime: number

    constructor(
        pixiObject: any,
        x: number, y: number,
        rotation: number, radians: number, // do something with radians
        // pivotX: number, pivotY: number,
        alpha: number,
        cursor: string
    ) {
        // Internal
        this._pixiObject = pixiObject
        this._x = x
        this._y = y
        this._rotation = rotation
        // this._pivotX = pivotX
        // this._pivotY = pivotY
        this._alpha = alpha
        // this._cursor = cursor
        this._initTime = Timer.time
        
        // Setters
        this.x = x
        this.y = y
        this.rotation = rotation
        this.radians = radians
        this.cursor = cursor
    }

    get x() {
        return this._x
    }
    set x(newX) {
        this._x = newX
        // this._pixiObject.x = this.x + app.screen.width / 2 - camera.x 
        this._updatePosition()
    }

    get y() {
        return this._y
    }
    set y(newY) {
        this._y = newY
        // this._pixiObject.y = -this.y + app.screen.height / 2 + camera.y
        this._updatePosition()
    }

    get width() {
        return this._pixiObject.width
    }
    set width(n) {
        const lastWidth = this.width
        // this._pixiObject.pivot.set(0.5)
        this._pixiObject.width = n
        this._updatePosition()
    }

    get height() {
        return this._pixiObject.height
    }
    set height(n) {
        const lastHeight = this.height
        this._pixiObject.pivot.set(0.5)
        this._pixiObject.height = n
    }

    get screenX() {
        return this._x - camera.x
    }
    set screenX(newX) {
        this.x = camera.x - newX
    }

    get screenY() {
        return this._y - camera.y
    }
    set screenY(newY) {
        this.y = camera.y - newY
    }

    get rotation() {
        return this._rotation
    }
    set rotation(angle) {
        this._rotation = angle
        this._pixiObject.rotation = deg2rad(angle)
    }

    get radians() {
        return deg2rad(this._rotation)
    }
    set radians(rad) {
        this._rotation = rad2deg(rad)
        // this._radians = rad
        this._pixiObject.rotation = rad
    }

    // Pivot implementation WIP
    get pivotX() {
        return this._pixiObject.pivot.x
        // return this._pivotX
    }
    set pivotX(newX) {
        this._pixiObject.pivot.x = newX
    }

    get pivotY() {
        return this._pixiObject.pivot._y
    }
    set pivotY(newY) {
        this._pixiObject.pivot.y = newY
    }

    get visible() {
        return this._pixiObject.visible
    }
    set visible(b: boolean) {
        this._pixiObject.visible = b
    }

    get alpha() {
        return this._alpha
    }
    set alpha(n: number) {
        this._alpha = n
        this._pixiObject.alpha = n / 100
    }

    get cursor() {
        return this._pixiObject.cursor
    }
    set cursor(cursor) {
        this._pixiObject.cursor = cursor
    }

    get layer() {
        return this._pixiObject.zIndex
    }
    set layer(layer: number) {
        this._pixiObject.zIndex = layer
    }

    get age() {
        return Timer.time - this._initTime
    }
    
    // Come back to this?
    setScale(scale: number) {
        this._pixiObject.scale.set(scale)
    }

    show(): void {
        this._pixiObject.visible = true
    }

    hide(): void {
        this._pixiObject.visible = false
    }

    goTo(x: number, y: number): void {
        this.x = x
        this.y = y
    }

    rotate(angle: number, unit: string = 'degrees'): void {
        unit = unit.toLowerCase()
        if (unit === 'degrees') {
            this.rotation += angle
        } else if (unit === 'radians') {
            this.rotation += rad2deg(angle)
        }
    }

    // rotateAround(point: Positionable, angle: number): {degrees: Function, radians: Function} {
    // 	// this._sprite.pivot.x = app.screen.width / 2 + point.x
    // 	// this._sprite.pivot.y = app.screen.height / 2 + point.y
    // 	console.log(`rotating around ${point.x}, ${point.y}`)
    // 	this._pixiObject.pivot.x = this._pixiObject.x - point.x
    // 	this._pixiObject.pivot.y = this._pixiObject.y - point.y
        
    // 	// Thinking of syntax like:
    // 	// sprite.rotateAround({x:5, y:10}, 45).degrees()
    // 	// and
    // 	// sprite.rotateAround(point(5, 10), PI/8).radians()
    // 	//
    // 	// Just do the math here instead of trying to use pivots
    // 	return {
    // 		degrees() {
    // 			this.rotation += angle
    // 			this._setPivotCenter()
    // 		},
    // 		radians() {
    // 			this.radians += angle
    // 			this._setPivotCenter()
    // 		}
    // 	}
    // }
    
    _updatePosition(): void {
        this._pixiObject.x = this.x + app.screen.width / 2 - camera.x 
        this._pixiObject.y = -this.y + app.screen.height / 2 + camera.y
    }

    // _updateRotation(): void {

    // }
}