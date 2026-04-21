import { Graphics } from "pixi.js"
import { allPositionables, app, camera } from "./core"
import GameObject from "./GameObject"

/**
 * Rectangle class, using position setters from that one WoofJS project
 */
export default class Rectangle extends GameObject {
    readonly _rect: Graphics
    _color: string
	// left: number
	// right: number
	// top: number
	// bottom: number

	// What should happen when supplying contradictory size/place properties?
	// Just pick one to overwrite and push a warning to the output panel?
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
        super()
        const rect = new Graphics()
            .rect(x, y, width, height)
            .fill(color)
            
        this._pixiObj = rect
        this._rect = rect
        this.hide()
        
        this._color = color

        allPositionables.push(this)
        
        this._x = x
        this._y = y
		if (width) this.width = width
		if (height) this.height = height

        this._rect.pivot.set(this.width / 2, this.height / 2)
        this._updatePosition()

        app.stage.addChild(this._rect)
        this.show()
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

    get pivotX() {
        return this._rect.pivot.x
    }
    set pivotX(newX) {
        this._pixiObj.pivot.x = newX
    }

    get pivotY() {
        return this._pixiObj.pivot._y
    }
    set pivotY(newY) {
        this._pixiObj.pivot.y = newY
    }

    setPivotCenter(): void {
    	this._rect.pivot.x = this.width / 2
    	this._rect.pivot.y = this.height / 2
    }
}