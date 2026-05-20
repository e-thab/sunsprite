// Revisiting Mixins https://www.typescriptlang.org/docs/handbook/mixins.html
// import { allPositionables, app, /*camera,*/ mouseX, mouseY, paused, print, Timer } from "./core"
import { deg2rad, rad2deg, randomPosition } from "./utility"
import type { Action, Point } from "./interfaces"
import { screen, camera, Timer, /*mouseX, mouseY,*/ paused } from "./corephaser"

import Phaser from "phaser"

type Class<T = {}> = new (...args: any[]) => T

export type GameObjectProps = PositionableProps & SizableProps & RotatableProps & ViewableProps /* ...etc. */
export const defaults: Required<GameObjectProps> = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    scale: 1,
    rotation: 0,
    radians: 0,
    alpha: 100,
    layer: 0,
    cursor: {
        src: 'default',
        type: 'default'
    },
    visible: true,
    onClick: () => {},
    onRelease: () => {},
    onMouseEnter: () => {},
    onMouseExit: () => {},
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

// (pointer: any, localX: number, localY: number, event: any) -- args from pointer event callbacks
type PointerAction = ((x: number, y: number) => void) | undefined | null
type Cursor = { src: string, type?: string } | undefined | null
type ViewableProps = {
    alpha?: number
    layer?: number
    visible?: boolean
    cursor?: Cursor
    onClick?: PointerAction
    onRelease?: PointerAction
    onMouseEnter?: PointerAction
    onMouseExit?: PointerAction
}

export function Viewable<Base extends Class>(base: Base) {    
    return class Viewable extends base {
        // TODO:
        // - tint
        // - blend mode
        // - effects?
        // - more input events (double click, right click, scroll, mousemove, mouseup...)
        // - draggable

        _refObj?: any
        isInteractive: boolean = false
        
        // Required props
        _alpha: number = defaults.alpha
        _layer: number = defaults.layer
        _visible: boolean = defaults.visible
        
        // Optional props
        _cursor?: Cursor
        _onClick?: PointerAction
        _onRelease?: PointerAction
        _onMouseEnter?: PointerAction
        _onMouseExit?: PointerAction

        constructor(...args: any[]) {
            super()
        }

        initViewable(props?: GameObjectProps) {
            this.alpha = props?.alpha ?? defaults.alpha
            this.layer = props?.layer ?? defaults.layer
            this.visible = props?.visible ?? defaults.visible
            
            if (props?.cursor) this.cursor = props.cursor
            if (props?.onClick) this.onClick = props.onClick
            if (props?.onRelease) this.onRelease = props.onRelease
            if (props?.onMouseEnter) this.onMouseEnter = props.onMouseEnter
            if (props?.onMouseExit) this.onMouseExit = props.onMouseExit
        }

        setInteractive() {
            // Set's phaser object's interactive state if it isn't already
            if (!this._refObj) return
            
            if (!this.isInteractive) {
                this._refObj.setInteractive()
                this.isInteractive = true
            }
        }

        disableInteractive() {
            if (!this._refObj) return
            
            if (this.isInteractive) {
                this._refObj.disableInteractive()
                this.isInteractive = false
            }
        }

        // Internal, for pointer events
        _addListener(inputEvent: string, callback: PointerAction) {
            if (!this._refObj) return
            
            // TODO
            // TODO
            // TODO
            // TODO
            // TODO
            // TODO
            // Finish this; use isntead of logic inside onInput events ...

            this._refObj.on(inputEvent, (pointer: any, localX: number, localY: number, event: any) => {
                if (!paused) callback(localX, localY)
            })
        }

        _removeListener(inputEvent: string, callback: PointerAction) {
            if (!this._refObj) return
            
        }
        
        get alpha() {
            return this._alpha
        }
        set alpha(alpha: number) {
            this._alpha = alpha
            if (this._refObj) this._refObj.setAlpha(alpha / 100)
        }
        
        // Update for phaser
        get layer() {
            return this._layer
        }
        set layer(layer: number) {
            this._layer = layer
            if (this._refObj) this._refObj.setDepth(layer)
        }

        get visible() {
            return this._visible
        }
        set visible(visible: boolean) {
            this._visible = visible

            if (this._refObj) {
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
        set cursor(cursor: Cursor | string) {
            // Cursor arg is either a string or an object that allows user to define image src as well as system fallback cursor type
            // if string: just use it as the src and set type to default
            if (!this._refObj || !cursor) return
            
            let cursorObj: Cursor
            if (typeof cursor === typeof 'string') {
                cursorObj = {
                    src: cursor as string,
                    type: 'default'
                }
            } else {
                cursorObj = {
                    src: (cursor as Cursor)?.src ?? 'default',
                    type: (cursor as Cursor)?.type ?? 'default'
                }
            }
                        
            if (!cursor || cursorObj.src === 'default') {
                // Disable interactive here if no input actions are defined
                this._cursor = undefined
                this._refObj.input.cursor = false
                return
            }

            this.setInteractive()
            this._cursor = cursorObj

            // Absolutely find a better way to do this, just testing for now
            const url = `url(cursors/${cursorObj.src})`
            const offset = cursor === 'dot_large.png' ? '16 16' : '' // manual offset only needed for non-.cur images
            
            this._refObj.input.cursor = `${url} ${offset}, ${cursorObj.type}`
        }

        get onClick(): PointerAction {
            return this._onClick
        }
        set onClick(onClick: PointerAction) {
            // Using PhaserObject.off(inputEvent, fn) doesn't seem to remove specific callbacks
            // Just removing all listeners indiscriminately before assigning new for now
            if (!this._refObj) return
            
            const inputEvent = Phaser.Input.Events.POINTER_DOWN
            if (this.onClick) this._refObj.off(inputEvent/*, this.onClick*/)
            this._onClick = onClick

            if (!onClick) return
            this.setInteractive()
            this._refObj.on(inputEvent, (pointer: any, localX: number, localY: number, event: any) => {
                if (!paused) onClick(localX, localY)
            })
        }

        get onRelease() {
            return this._onRelease
        }
        set onRelease(onRelease: PointerAction) {
            if (!this._refObj) return

            const inputEvent = Phaser.Input.Events.POINTER_UP
            if (this.onRelease) this._refObj.off(inputEvent)
            this._onRelease = onRelease

            if (!onRelease) return
            this.setInteractive()
            this._refObj.on(inputEvent, (pointer: any, localX: number, localY: number, event: any) => {
                if (!paused) onRelease(localX, localY)
            })
        }

        get onMouseEnter() {
            return this._onMouseEnter
        }
        set onMouseEnter(onMouseEnter: PointerAction) {
            // When paused?
            if (!this._refObj) return

            const inputEvent = Phaser.Input.Events.POINTER_OVER
            const currentCallback = this.onMouseEnter
            this._onMouseEnter = onMouseEnter

            if (!onMouseEnter) {
                if (currentCallback) this._refObj.off(inputEvent, currentCallback)
                return
            }

            this.setInteractive()
            this._refObj.on(inputEvent, (pointer: any, localX: number, localY: number, event: any) => {
                if (!paused) onMouseEnter(localX, localY)
            })
        }

        get onMouseExit() {
            return this._onMouseExit
        }
        set onMouseExit(onMouseExit: PointerAction) {
            if (!this._refObj) return

            const inputEvent = Phaser.Input.Events.POINTER_OUT
            const currentCallback = this.onMouseExit
            this._onMouseExit = onMouseExit

            if (!onMouseExit) {
                if (currentCallback) this._refObj.off(inputEvent, currentCallback)
                return
            }
            
            this.setInteractive()
            this._refObj.on(inputEvent, (pointer: any, localX: number, localY: number, event: any) => {
                if (!paused) onMouseExit(localX, localY)
            })
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
            this._initTime = Timer.time
        }

        get age() {
            return (Timer.time - this._initTime) / 1000
        }
    }
}