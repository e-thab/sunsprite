import { Rectangle as PixiRect, Graphics, Color } from "pixi.js"
import { allPositionables, app, camera } from "./core"
import GameObject from "./GameObject"

/**
 * Rectangle class, using position setters from that one WoofJS project
 */
export default class Rectangle extends GameObject {
	// readonly _rect: PixiRect
	_x: number
	_y: number
    _rect: Graphics
    _color: string
    _visible: boolean
	// left: number
	// right: number
	// top: number
	// bottom: number

	// What should happen when supplying contradictory size/place properties?
	// A warning in the editor?
	constructor({
		x = 0,
		y = 0,
		width = 100,
		height = 100,
        rotation = 0,
        radians = 0,
        alpha = 100,
        cursor = 'default',
        color = 'white'
		// left = undefined,
		// right = undefined,
		// top = undefined,
		// bottom = undefined
	} = {}) {
        const rect = new Graphics()
            .rect(x, y, width, height)
            .fill(color)
            
		super(rect, x, y, rotation, radians, alpha, cursor)
        this._rect = this._pixiObject
        this._rect.visible = false
        this._color = color
        this._visible = true

        allPositionables.push(this)
        
        this._x = x
        this._y = y
		this.width = width
		this.height = height
        this._rect.pivot.set(this.width / 2, this.height / 2)
        this._updatePosition()

        app.stage.addChild(this._rect)
	}

	_updatePosition(): void {
        if (this._rect) {
            // Check user-set pivot before setting here
            this._rect.x = this._x + app.screen.width / 2 - camera.x
            this._rect.y = -this._y + app.screen.height / 2 + camera.y
            if (this.visible) this._rect.visible = true
        }
	}

    get color() {
        return this._color
    }
    set color(color) {
        this._color = color
        this._rect.fill(color)
    }

    get x() {
        return this._x
    }
    set x(newX) {
        this._x = newX
        this._updatePosition()
    }

    get y() {
        return this._y
    }
    set y(newY) {
        this._y = newY
        this._updatePosition()
    }

    get width() {
        return this._rect.width
    }
    set width(n) {
        this._rect.width = n
    }

    get height() {
        return this._rect.height
    }
    set height(n) {
        this._rect.height = n
    }

    // get scale() {
    //     return this._rect.scale
    // }
    set scale(value: number) {
        this._rect.scale.set(value)
    }

    get visible() {
        return this._visible
    }
    set visible(visible: boolean) {
        this._visible = visible
        this._rect.visible = visible
    }

    get pivotX() {
        return this._rect.pivot.x
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

    setPivotCenter(): void {
    	this._rect.pivot.x = this._pixiObject.width / 2
    	this._rect.pivot.y = this._pixiObject.height / 2
    }

    show() {
        this.visible = true
        this._rect.visible = true
    }

    hide() {
        this.visible = false
        this._rect.visible = false
    }
}