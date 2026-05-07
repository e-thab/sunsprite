// Revisiting Mixins https://www.typescriptlang.org/docs/handbook/mixins.html
import { allPositionables, app, /*camera,*/ mouseX, mouseY, paused, print, Timer } from "./core"
import { deg2rad, rad2deg, randomPosition } from "./utility"
import type { Point } from "./interfaces"
import { screen, camera } from "./corephaser"

type Class<T = {}> = new (...args: any[]) => T

export type GameObjectProps = PositionableProps & SizableProps & RotatableProps & ViewableProps /* ...etc. */
export const defaults: Omit<Required<GameObjectProps>, 'pixiObj'> = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    scale: 1,
    rotation: 0,
    radians: 0,
    alpha: 100,
    layer: 0,
    cursor: 'default',
    visible: true,
    onClick: () => {}
    // ...etc.
}

type PositionableProps = {
    x?: number
    y?: number
}

export function Positionable<Base extends Class>(base: Base) {
    return class Positionable extends base {
        _pixiObj?: any
        _x: number = 0
        _y: number = 0

        constructor(...args: any[]) {
            super()
        }

        initPositionable(props?: GameObjectProps) {
            this.x = props?.x ?? 0
            this.y = props?.y ?? 0
        }

        get x() {
            return this._x
        }
        set x(x) {
            console.log(`setting x to ${x}`)
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

        goTo(position: Point): void
        goTo(x: number, y: number): void
        goTo(xOrPoint: number | Point, y?: number) {
            if (typeof xOrPoint === 'number' && y !== undefined) {
                this.x = xOrPoint
                this.y = y
            } else if (typeof xOrPoint === 'object') {
                this.x = (xOrPoint as Point).x ?? this.x
                this.y = (xOrPoint as Point).y ?? this.y
            }
        }

        goToMouse() {
            // Super slow in a forever loop, look into this
            if (this._pixiObj) this._pixiObj.x = mouseX + app.screen.width / 2
            if (this._pixiObj) this._pixiObj.y = -mouseY + app.screen.height / 2
        }

        goToRandom() {
            this.goTo(randomPosition())
        }

        _updatePosition() {
            this._updateX()
            this._updateY()
        }

        _updateX() {
            // if (this._pixiObj) this._pixiObj.x = this.x + app.screen.width / 2 - camera.x
            if (this._pixiObj) this._pixiObj.x = this.x + screen.width / 2 - camera.x
            if (this._pixiObj) console.log(`setting actual x to ${this.x + screen.width / 2 - camera.x}`)
        }

        _updateY() { 
            // if (this._pixiObj) this._pixiObj.y = -this.y + app.screen.height / 2 + camera.y
            if (this._pixiObj) this._pixiObj.y = this.y + screen.height / 2 + camera.y
        }
    }
}


type SizableProps = {
    width?: number
    height?: number
    scale?: number // - still needs testing
}

export function Sizable<Base extends Class>(base: Base) {
    return class Sizable extends base {
        _pixiObj?: any
        _width?: number
        _height?: number
        _scale?: number

        constructor(...args: any[]) {
            // What happens when both width//height and scale are provided?
            super()
        }

        initSizable(props?: GameObjectProps) {
            // Can't null-ish coalesce bc sprites set their own default width/height
            if ((props?.width !== undefined && props?.scale !== undefined) || (props?.height !== undefined && props?.scale !== undefined)) {
                // Handle conflict between width/scale
            }
            if (props?.width !== undefined) this.width = props.width
            if (props?.height !== undefined) this.height = props.height
            this.scale = props?.scale ?? 1
        }

        get width() {
            if (this._pixiObj) return this._pixiObj.width
            return this._width
        }
        set width(width) {
            this._width = width
            if (this._pixiObj) this._pixiObj.width = width
        }

        get height() {
            if (this._pixiObj) return this._pixiObj.height
            return this._height
        }
        set height(height) {
            this._height = height
            if (this._pixiObj) this._pixiObj.height = height
        }

        get scale() {
            if (this._pixiObj) return this._pixiObj.scale.x // Assuming uniform scale for now
            return this._scale
        }
        set scale(scale) {
            this._scale = scale
            this._updateScale()
        }

        _updateScale() {
            if (this._pixiObj) this._pixiObj.scale.set(this._scale)
        }
    }
}

type RotatableProps = {
    rotation?: number
    radians?: number
}

export function Rotatable<Base extends Class>(base: Base) {
    return class Rotatable extends base {
        _rotation: number = 0
        _pixiObj?: any

        constructor(...args: any[]) {
            super()
        }

        initRotatable(props?: GameObjectProps) {
            // Can't null-ish coalesce since rotation & radians overwrite each other
            if (props?.rotation && props?.radians) {
                // warn?
            } else if (props?.rotation !== undefined) {
                this.rotation = props.rotation
            } else if (props?.radians !== undefined) {
                this.radians = props.radians
            } else {
                // default
                this.rotation = 0
            }
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

type ViewableProps = {
    alpha?: number
    layer?: number
    visible?: boolean
    cursor?: string
    onClick?(): void
}

export function Viewable<Base extends Class>(base: Base) {
    return class Viewable extends base {
        _alpha: number = defaults.alpha
        _layer: number = defaults.layer
        _visible: boolean = defaults.visible
        _cursor: string = defaults.cursor
        _onClick: () => void = defaults.onClick
        _pixiObj?: any

        constructor(...args: any[]) {
            super()
        }

        initViewable(props?: GameObjectProps) {
            this.alpha = props?.alpha ?? 100
            this.layer = props?.layer ?? 0
            this.cursor = props?.cursor ?? 'default'
            this.visible = props?.visible ?? true
            this.onClick = props?.onClick ?? (() => {})
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

            if (this._pixiObj) {
                if (visible) {
                    this.show()
                } else {
                    this.hide()
                }
            }
        }

        get cursor() {
            return this._cursor
        }
        set cursor(cursor) {
            this._cursor = cursor
            if (this._pixiObj) this._pixiObj.cursor = cursor
        }

        get onClick() {
            return this._onClick
        }
        set onClick(onClick) {
            // Logic to actually RE-assign onClick instead of just assigning new every time?
            // (garbage collect)
            this._onClick = onClick
            if (this._pixiObj) {
                this._pixiObj.on('click', () => {
                    if (!paused) this.onClick()
                })
            }
        }

        resetCursor() {
            this.cursor = 'default'
        }

        show() {
            if (this._pixiObj) this._pixiObj.visible = true
        }

        hide() {
            if (this._pixiObj) this._pixiObj.visible = false
        }
    }
}

export function Timeable<Base extends Class>(base: Base) {
    return class Timeable extends base {
        _initTime: number

        constructor(...args: any[]) {
            super()
            this._initTime = Timer.time
        }

        get age() {
            return Timer.time - this._initTime
        }
    }
}