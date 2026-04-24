// Revisiting Mixins https://www.typescriptlang.org/docs/handbook/mixins.html
import { Sprite as PixiSprite, Assets } from "pixi.js"
import { allPositionables, app, camera, print, Timer } from "./core"
import { deg2rad, rad2deg } from "./utility"

type Class<T = {}> = new (...args: any[]) => T

export type GameObjectProps = PositionableProps & SizableProps & RotatableProps & ViewableProps // ...etc.
export const defaults: Required<GameObjectProps> = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    cursor: 'default',
    rotation: 0,
    radians: 0,
    alpha: 100,
    layer: 0,
    visible: true
    // ...etc.
}

// mixin constructors take props objects, but will be the deepest element in an arbitrarily
// nested array of the form [[...[PropsObject]]] (nest order depends on composition order
// in the derived class args is coming from). Next, constructors need a way to deconstruct
// this array to get just the base object. Then var initialization can be moved into the
// constructors

export function Positionable<Base extends Class>(base: Base) {
    return class Positionable extends base {
        _x: number = 0
        _y: number = 0
        _cursor: string = 'default'
        _pixiObj?: any

        constructor(...args: any[]) {
            console.log(`Positionable args:`)
            console.log(args)
            super(args)
        }

        get x() {
            return this._x
        }
        set x(x) {
            this._x = x
            this._updateX()
        }

        get y() {
            return this._y
        }
        set y(y) {
            this._y = y
            this._updateY()
        }

        get screenX() {
            return this.x - camera.x
        }
        set screenX(newX) {
            this.x = camera.x - newX
        }
    
        get screenY() {
            return this.y - camera.y
        }
        set screenY(newY) {
            this.y = camera.y - newY
        }

        get cursor() {
            return this._cursor
        }
        set cursor(cursor) {
            this._cursor = cursor
            if (this._pixiObj) this._pixiObj.cursor = cursor
        }

        goTo(x: number, y: number) {
            this.x = x
            this.y = y
        }

        resetCursor() {
            this.cursor = 'default'
        }

        _updatePosition() {
            this._updateX()
            this._updateY()
        }

        _updateX() {
            if (this._pixiObj) {
                this._pixiObj.x = this.x + app.screen.width / 2 - camera.x
                // console.log(`Setting x to ${this.x}: (${this._pixiObj.x})`)
            }
        }

        _updateY() { 
            if (this._pixiObj) {
                this._pixiObj.y = -this.y + app.screen.height / 2 + camera.y
                // console.log(`Setting y to ${this.y}: (${this._pixiObj.y})`)
            }
        }
    }
}

type PositionableProps = {
    x?: number
    y?: number
    cursor?: string
}

export function Sizable<Base extends Class>(base: Base) {
    return class Sizable extends base {
        _pixiObj?: any

        constructor(...args: any[]) {
            super(args)
        }

        get width() {
            return this._pixiObj.width
        }
        set width(n) {
            this._pixiObj.width = n
        }

        get height() {
            return this._pixiObj.height
        }
        set height(n) {
            this._pixiObj.height = n
        }

        // get scale(): { x: number, y: number } {
        //     return this._sprite.scale
        // }
        set scale(value: number) {
            this._pixiObj.scale.set(value)
        }
    }
}

type SizableProps = {
    width?: number
    height?: number
    //scale? - still needs testing
}

export function Rotatable<Base extends Class>(base: Base) {
    return class Rotatable extends base {
        _rotation: number = 0
        _pixiObj?: any

        constructor(...args: any[]) {
            super(args)
        }

        // Rotation doesn't work
        get rotation() {
            return this._rotation
        }
        set rotation(angle) {
            this._rotation = angle
            if (this._pixiObj) this._pixiObj.rotation = deg2rad(angle)
        }
        
        // ...but radians does?? Why?
        get radians() {
            return deg2rad(this._rotation)
        }
        set radians(rad) {
            this._rotation = rad2deg(rad)
            if (this._pixiObj) this._pixiObj.rotation = rad
        }
    }
}

type RotatableProps = {
    rotation?: number
    radians?: number
}

export function Viewable<Base extends Class>(base: Base) {
    return class Viewable extends base {
        _alpha: number = 100
        _layer: number = 0
        _visible: boolean = true
        _pixiObj?: any

        constructor(...args: any[]) {
            super(args)
        }

        get alpha() {
            return this._alpha
        }
        set alpha(alpha) {
            this._alpha = alpha
            if (this._pixiObj) this._pixiObj.alpha = alpha / 100
        }
        
        get layer() {
            return this._layer
        }
        set layer(layer) {
            this._layer = layer
            if (this._pixiObj) this._pixiObj.zIndex = layer
        }

        get visible() {
            return this._visible
        }
        set visible(visible) {
            this._visible = visible
            if (this._pixiObj) this._pixiObj.visible = visible
        }

        show() {
            if (this._pixiObj) this._pixiObj.visible = true
        }

        hide() {
            if (this._pixiObj) this._pixiObj.visible = false
        }
    }
}

type ViewableProps = {
    alpha?: number
    layer?: number
    visible?: boolean
}

export function Timeable<Base extends Class>(base: Base) {
    return class Timeable extends base {
        _initTime: number

        constructor(...args: any[]) {
            super(args)
            this._initTime = Timer.time
        }

        get age() {
            return Timer.time - this._initTime
        }
    }
}