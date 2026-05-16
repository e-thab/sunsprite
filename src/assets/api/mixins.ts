// Revisiting Mixins https://www.typescriptlang.org/docs/handbook/mixins.html
// import { allPositionables, app, /*camera,*/ mouseX, mouseY, paused, print, Timer } from "./core"
import { deg2rad, rad2deg, randomPosition } from "./utility"
import type { Point } from "./interfaces"
import { screen, camera, Timer, /*mouseX, mouseY,*/ paused } from "./corephaser"

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
    // position: Point
}

export function Positionable<Base extends Class>(base: Base) {
    return class Positionable extends base {
        _refObj?: any
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

        get position(): Point {
            // test this
            return {
                x: this._x,
                y: this._y
            }
        }

        get screenX() {
            // CHECK PHASER IMPLEMENTATION
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

        // test these
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
            // CHECK PHASER IMPLEMENTATION
            // if (this._refObj) this._refObj.x = mouseX + app.screen.width / 2
            // if (this._refObj) this._refObj.y = -mouseY + app.screen.height / 2
        }

        goToRandom() {
            this.goTo(randomPosition())
        }

        _updatePosition() {
            this._updateX()
            this._updateY()
        }

        _updateX() {
            // if (this._refObj) this._refObj.x = this.x + app.screen.width / 2 - camera.x
            if (this._refObj) this._refObj.x = this.x + screen.width / 2 - camera.x
            // if (this._refObj) console.log(`setting actual x to ${this.x + screen.width / 2 - camera.x}`)
        }

        _updateY() { 
            // if (this._refObj) this._refObj.y = -this.y + app.screen.height / 2 + camera.y
            if (this._refObj) this._refObj.y = -this.y + screen.height / 2 + camera.y
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
        _refObj?: any
        _width?: number
        _height?: number
        _scale?: number
        // scaleX / scaleY ?

        constructor(...args: any[]) {
            // What happens when both width//height and scale are provided?
            super()
        }

        initSizable(props?: GameObjectProps) {
            // Can't null-ish coalesce bc sprites set their own default width/height
            if ((props?.width !== undefined && props?.scale !== undefined) || (props?.height !== undefined && props?.scale !== undefined)) {
                // Handle conflict between width/scale
            } else {
                if (props?.width !== undefined) this.width = props.width
                if (props?.height !== undefined) this.height = props.height
                if (props?.scale !== undefined) this.scale = props.scale
            }
            // if (props?.width !== undefined) this.width = props.width
            // if (props?.height !== undefined) this.height = props.height
            // this.scale = props?.scale ?? 1 // Can't add this until potential conflict is handled
        }

        get width() {
            if (this._refObj) return this._refObj.displayWidth
            return this._width
        }
        set width(width) {
            this._width = width
            if (this._refObj) this._refObj.displayWidth = width
        }

        get height() {
            if (this._refObj) return this._refObj.displayHeight
            return this._height
        }
        set height(height) {
            this._height = height
            if (this._refObj) this._refObj.displayHeight = height
        }

        get scale() {
            if (this._refObj) return this._refObj.scale // Assuming uniform scale for now
            return this._scale
        }
        set scale(scale) {
            this._scale = scale
            this._updateScale()
        }

        _updateScale() {
            // if (this._refObj) this._refObj.scale.set(this._scale)
            if (this._refObj) this._refObj.scale = this._scale
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
        _refObj?: any

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

        get rotation() {
            return this._rotation
        }
        set rotation(angle) {
            this._rotation = angle
            if (this._refObj) this._refObj.rotation = deg2rad(angle)
        }
        
        get radians() {
            return deg2rad(this._rotation)
        }
        set radians(rad) {
            this._rotation = rad2deg(rad)
            if (this._refObj) this._refObj.rotation = rad
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
        // TODO:
        // - tint
        // - blend mode
        // - effects?

        _alpha: number = defaults.alpha
        _layer: number = defaults.layer
        _visible: boolean = defaults.visible
        _cursor: string = defaults.cursor
        _onClick: () => void = defaults.onClick
        _refObj?: any

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
            if (this._refObj) this._refObj.alpha = alpha / 100
        }
        
        // Update for phaser
        get layer() {
            return this._layer
        }
        set layer(layer) {
            this._layer = layer
            if (this._refObj) this._refObj.depth = layer
        }

        get visible() {
            return this._visible
        }
        set visible(visible) {
            this._visible = visible

            if (this._refObj) {
                if (visible) {
                    this.show()
                } else {
                    this.hide()
                }
            }
        }

        // Update for Phaser
        get cursor() {
            return this._cursor
        }
        set cursor(cursor) {
            this._cursor = cursor
            if (this._refObj) this._refObj.cursor = cursor
        }


        get onClick() {
            return this._onClick
        }
        set onClick(onClick) {
            // Logic to actually RE-assign onClick instead of just assigning new every time?
            // (garbage collect)
            this._onClick = onClick
            if (this._refObj) {
                this._refObj.setInteractive().on('pointerdown', (pointer: any, localX: number, localY: number, event: any) => {
                    if (!paused) onClick()
                });
            }
        }

        resetCursor() {
            this.cursor = 'default'
        }

        show() {
            if (this._refObj) this._refObj.visible = true
        }

        hide() {
            if (this._refObj) this._refObj.visible = false
        }

        sendToFrontLayer() {
            // TODO: Send to front layer
        }
        
        sendToBackLayer() {
            // TODO: Send to back layer
        }

        // layerUp() {
        // }
        // layerDown() {
        // }
        sendToLayerAbove(other: Viewable) {
            // TODO: Send to layer above other
        }
        sendToLayerBelow(other: Viewable) {
            // TODO: Send to layer below other
        }
    }
}

export function Timeable<Base extends Class>(base: Base) {
    return class Timeable extends base {
        _initTime: number

        constructor(...args: any[]) {
            super()
            // this._initTime = Timer.time
            this._initTime = Date.now()
        }

        get age() {
            // return Timer.time - this._initTime
            return (Date.now() - this._initTime) / 1000
        }
    }
}