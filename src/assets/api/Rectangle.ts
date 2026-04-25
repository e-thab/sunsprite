import { Graphics } from "pixi.js"
import { allPositionables, app, camera, print } from "./core"
import GameObject from "./GameObject"
import { defaults, type GameObjectProps } from "./mixins"

/**
 * Rectangle class, using position setters from that one WoofJS project
 */

type RectangleProps = GameObjectProps & {
    color?: string
}

export default class Rectangle extends GameObject {
    readonly _rect: Graphics
    _color: string
	// left: number
	// right: number
	// top: number
	// bottom: number

	// What should happen when supplying contradictory size/place properties?
	// Just pick one to overwrite and push a warning to the output panel?
	constructor(props: RectangleProps) {
        super(props)
        const color = props.color ?? 'white'
        this._color = color

        this._rect = new Graphics()
            .rect(0, 0, defaults.width, defaults.height)
            .fill(color)
        this._pixiObj = this._rect
        this.hide()

        this.x = props.x ?? defaults.x
        this.y = props.y ?? defaults.y

        this.setPivotCenter()
		this.width = props.width ?? defaults.width
		this.height = props.height ?? defaults.height

        // !--Cursor and onClick not working (maybe Graphics limitations)
        this.cursor = props.cursor ?? defaults.cursor
        this.alpha = props.alpha ?? defaults.alpha
        this.onClick = () => { print('Rect click') }

        if (props.rotation && props.radians) {
            // warn?
        } else if (props.rotation) {
            this.rotation = props.rotation
        } else if (props.radians) {
            this.radians = props.radians
        }
        
        allPositionables.push(this)
        app.stage.addChild(this._rect)
        this.show()
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