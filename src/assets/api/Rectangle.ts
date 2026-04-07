import { Rectangle as PixiRect, Graphics, Color } from "pixi.js"
import { allPositionables, app, camera } from "./core"
import GameObject from "./GameObject"

/**
 * Rectangle class, using position setters from that one WoofJS project
 */
export default class Rectangle extends GameObject {
	readonly _rect: PixiRect
	_x: number
	_y: number
    _graphics: Graphics
    _color: string
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
        const left = x + app.screen.width / 2 - width / 2
        const top = y + app.screen.height / 2 - height / 2

		super(new PixiRect(left, top, width, height), x, y, rotation, radians, alpha, cursor)
		this._rect = this._pixiObject
        this._color = color

        this._graphics = new Graphics()
        this._graphics
            .rect(left, top, width, height)
            .fill(color)
        app.stage.addChild(this._graphics)

        allPositionables.push(this)

		this._x = x
		this._y = y
		// this.width = width
		// this.height = height
	}

	_updatePosition(): void {
        // this._rect.x = 
        // this._graphics.moveTo(
        //     this._x + app.screen.width / 2 - this.width / 2,
        //     this._y + app.screen.height / 2 - this.height / 2
        // )

        // this._graphics.destroy()
        app.stage.removeChild(this._graphics)
        
        const left = this._x + app.screen.width / 2 - this.width / 2 - camera.x
        const top = -this._y + app.screen.height / 2 - this.height / 2 + camera.y
        // this._graphics.moveTo(left, top).fill(this.color)
        this._graphics = new Graphics()
            .rect(left, top, this.width, this.height)
            .fill(this.color)
        app.stage.addChild(this._graphics)
	}

    get color() {
        return this._color
    }
    set color(color) {
        console.log(`drawing a ${color} rect`)
        this._color = color
        this._graphics.fill(color)
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
}