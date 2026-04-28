import { Graphics } from "pixi.js"
import { allPositionables, app, print } from "./core"
import GameObject from "./GameObject"
import type { GameObjectProps } from "./mixins"

/**
 * Rectangle class, using position setters from that one WoofJS project
 */

type RectangleProps = GameObjectProps & {
    color?: string
}

export default class Rectangle extends GameObject {
    readonly _rect: Graphics
    _color: string

	// What should happen when supplying contradictory size/place properties?
	// Just pick one to overwrite and push a warning to the output panel?
	constructor(props?: RectangleProps) {
        super()
        const color = props?.color ?? 'white'
        this._color = color

        this._rect = new Graphics()
            .rect(0, 0, 100, 100)
            .fill(color)
        this._pixiObj = this._rect
        this.hide()

        // Set mixin props
        this.initPositionable(props)
        this.setPivotCenter()
        this.initSizable(props)
        this.initRotatable(props)
        this.initViewable(props)

        // !--Cursor and onClick not working (maybe Graphics limitations)
        // this.cursor = props.cursor ?? defaults.cursor
        // this.alpha = props.alpha ?? defaults.alpha
        // this.onClick = () => { print('Rect click') }
        
        allPositionables.push(this)
        app.stage.addChild(this._rect)
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