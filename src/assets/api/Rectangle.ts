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
    _graphicsRect: Graphics
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
        color = 'red'
		// left = undefined,
		// right = undefined,
		// top = undefined,
		// bottom = undefined
	} = {}) {
        const pos = {
            x: x + app.screen.width / 2 - width / 2,
            y: y + app.screen.height / 2 - height / 2
        }

		super(
            new Graphics()
                .rect(x, y, width, height)
                .fill(color),
            x, y, rotation, radians, alpha, cursor
        )
		// this._rect = this._pixiObject
        this._graphicsRect = this._pixiObject
        this._graphicsRect.visible = false
        this._color = color
        this._visible = true

        allPositionables.push(this)
        
        this._x = x
        this._y = y
        app.stage.addChild(this._graphicsRect)
		// this.width = width
		// this.height = height
	}

	_updatePosition(): void {
        // this._rect.x = 
        if (this._graphicsRect) {
            // Check user-set pivot before setting here
            this._graphicsRect.pivot.set(this.width / 2, this.height / 2)
            this._graphicsRect.x = this._x + app.screen.width / 2 - camera.x
            this._graphicsRect.y = -this._y + app.screen.height / 2 + camera.y
            if (this.visible) this._graphicsRect.visible = true
        }
	}

    get color() {
        return this._color
    }
    set color(color) {
        console.log(`drawing a ${color} rect`)
        this._color = color
        this._graphicsRect.fill(color)
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

    get visible() {
        return this._visible
    }
    set visible(visible: boolean) {
        this._visible = visible
        this._graphicsRect.visible = visible
    }

    show() {
        this.visible = true
        this._graphicsRect.visible = true
    }

    hide() {
        this.visible = false
        this._graphicsRect.visible = false
    }
}