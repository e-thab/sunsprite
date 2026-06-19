// Revisiting Mixins https://www.typescriptlang.org/docs/handbook/mixins.html
// import { allPositionables, app, /*camera,*/ mouseX, mouseY, paused, print, Timer } from "./core"
import { deg2rad, rad2deg, random } from "./utility"
// import { Point, type AnyPoint } from "./interfaces"
import { Point, type AnyPoint } from "./Point"
import { screen, camera, timer, paused, getGamePoint } from "./core"

import Phaser from "phaser"

type Class<T = {}> = new (...args: any[]) => T

export type GameObjectProps = PositionableProps & SizableProps & RotatableProps & InteractableProps & ViewableProps /* ...etc. */
// export const defaults: Required<GameObjectProps> = {
//     x: 0,
//     y: 0,
//     width: 100,
//     height: 100,
//     scale: 1,
//     rotation: 0,
//     radians: 0,
//     alpha: 100,
//     layer: 0,
//     cursor: {
//         src: 'default',
//         type: 'default'
//     },
//     visible: true,
//     onClick: () => {},
//     onRelease: () => {},
//     onMouseEnter: () => {},
//     onMouseExit: () => {},
//     // ...etc.
// }
const propDescription: Record<keyof GameObjectProps, string> = {
    // Positionable
    x: `Horizontal position in the world.`,
    y: `Vertical position in the world.`,
    pos: `Position in the world.`,
    position: `Position in the world (alias of position).`,

    // Sizable
    width: `Horizontal size in pixels.`,
    height: `Vertical size in pixels.`,
    scale: `Factor to multiply size by. Setting scale to 2 will double its size; 0.5 will halve it.`,

    // Rotatable
    rotation: `Rotation angle in degrees.`,
    radians: `Rotation angle in radians.`,

    // Viewable
    alpha: `Transparency, decimal value that ranges from 0.0 (transparent) to 1.0 (opaque).`,
    layer: `The render order. Objects with higher layer values will show in front of objects with lower values.`,
    visible: `Whether this object is currently visible.`,

    // Interactable
    draggable: `Whether this object can be dragged with the mouse.`,
    cursor: `The cursor shown when the mouse is over this object.`,
    onClick: `Register a function to run when clicking this object.`,
    onRelease: `Register a function to run when releasing a click on this object.`,
    onMouseEnter: `Register a function to run when the mouse first starts overlapping this object.`,
    onMouseExit: `Register a function to run when the mouse first stops overlapping this object.`,
    onDrag: `Register a function to run repeatedly while this object is being dragged.`,
    onDragStart: `Register a function to run when this object first starts being dragged.`,
    onDragEnd: `Register a function to run when this object first stops being dragged.`,
}

export type PositionableProps = {
    x?: number
    y?: number
    pos?: AnyPoint
    position?: AnyPoint
}
export const positionablePropsTypeDef = `
type PositionableProps = {
    /** ${propDescription.x} */
    x?: number

    /** ${propDescription.y} */
    y?: number

    /** ${propDescription.pos} */
    pos?: AnyPoint

    /** ${propDescription.position} */
    position?: AnyPoint
}`
export const positionableApi = [
    // Props
    `/** ${propDescription.x} */
    x: number`,

    `/** ${propDescription.y} */
    y: number`,

    `/** ${propDescription.pos} */
    pos: { x: number, y: number }`,

    `/** ${propDescription.position} */
    position: { x: number, y: number }`,

    // Methods
    `/**
     * Set world position.
     * @param x New horizontal world position.
     * @param y New vertical world position.
     */
    goTo(x: number, y: number): void`,

    `/**
     * Set world position.
     * @param position New world position.
     */
    goTo(position: Point): void`,

    `/** Set position to a random point within the current visible screen area. */
    goToRandom(): void`,

].join('\n')

export function Positionable<Base extends Class>(base: Base) {
    return class Positionable extends base {
        _refObj?: any
        _x: number = 0
        _y: number = 0
        
        constructor(...args: any[]) {
            super()
        }

        initPositionable(props?: GameObjectProps) {
            // Warn when setting:
            // pos & position
            // pos & (x | y)
            // position & (x | y)
            this.x = props?.x ?? 0
            this.y = props?.y ?? 0
            if (props?.position) this.position = props.position
            if (props?.pos) this.pos = props.pos
        }

        get x(): number {
            return this._x
        }
        set x(x: number) {
            this._x = x
            this._updateX()
        }

        get y(): number {
            return this._y
        }
        set y(y: number) {
            this._y = y
            this._updateY()
        }

        get position(): Point {
            return {
                x: this.x,
                y: this.y
            }
        }
        set position(pos: AnyPoint) {
            pos = Point.from(pos)
            this._x = pos.x
            this._y = pos.y
            this._updatePosition()
        }

        // Alias for position: pos
        get pos(): Point {
            return this.position
        }
        set pos(pos: AnyPoint) {
            this.position = pos
        }

        get screenX(): number {
            // CHECK PHASER IMPLEMENTATION
            return this.x - camera.x
        }
        set screenX(newX: number) {
            this.x = camera.x - newX
        }
    
        get screenY(): number {
            return this.y - camera.y
        }
        set screenY(newY: number) {
            this.y = camera.y - newY
        }

        // goTo overloads, can go to:
        //  - A Point instance (any object containing x/y props)
        //  - A point defined with 2 args
        // Also test these
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
            // CHECK PHASER IMPLEMENTATION
            // Super slow in a forever loop, look into this
            // if (this._refObj) this._refObj.x = mouseX + app.screen.width / 2
            // if (this._refObj) this._refObj.y = -mouseY + app.screen.height / 2
        }

        goToRandom() {
            this.goTo(random.position())
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


export type SizableProps = {
    width?: number
    height?: number
    scale?: number // - still needs testing
}
export const sizablePropsTypeDef = `
type SizableProps = {
    /** ${propDescription.width} */
    width?: number

    /** ${propDescription.height} */
    height?: number

    /** ${propDescription.scale} */
    scale?: number
}`
export const sizableApi = [
    // Props
    `/** ${propDescription.width} */
    width: number`,

    `/** ${propDescription.height} */
    height: number`,

    `/** ${propDescription.scale} */
    scale: number`,

    // Methods
    // ...
].join('\n')

export function Sizable<Base extends Class>(base: Base) {
    return class Sizable extends base {
        _refObj?: any
        _width: number = 0
        _height: number = 0
        _scale: number = 0
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

        get width(): number {
            if (this._refObj) return this._refObj.displayWidth
            return this._width
        }
        set width(width: number) {
            this._width = width
            if (this._refObj) this._refObj.displayWidth = width
        }

        // A way to reset sprite size to default? Just use scale = 1?
        get height(): number {
            if (this._refObj) return this._refObj.displayHeight
            return this._height
        }
        set height(height: number) {
            this._height = height
            if (this._refObj) this._refObj.displayHeight = height
        }

        get scale(): number {
            if (this._refObj) return this._refObj.scale // Assuming uniform scale for now
            return this._scale
        }
        set scale(scale: number) {
            this._scale = scale
            this._updateScale()
        }

        // TODO: fitInside(?): XI setSize logic, fit this shape within another shape, preserving aspect

        _updateScale() {
            // if (this._refObj) this._refObj.scale.set(this._scale)
            if (this._refObj) this._refObj.scale = this._scale
        }
    }
}

export type RotatableProps = {
    rotation?: number
    radians?: number
}
export const rotatablePropsTypeDef = `
type RotatableProps = {
    /** ${propDescription.rotation} */
    rotation?: number

    /** ${propDescription.radians} */
    radians?: number
}`
export const rotatableApi = [
    // Props
    `/** ${propDescription.rotation} */
    rotation: number`,

    `/** ${propDescription.radians} */
    radians: number`

    // Methods
    // ...
].join('\n')

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

        get rotation(): number {
            return this._rotation
        }
        set rotation(angle: number) {
            this._rotation = angle
            if (this._refObj) this._refObj.rotation = deg2rad(angle)
        }
        
        get radians(): number {
            return deg2rad(this._rotation)
        }
        set radians(rad: number) {
            this._rotation = rad2deg(rad)
            if (this._refObj) this._refObj.rotation = rad
        }

        lookAt(other: Point) {
            // TODO
        }
    }
}

export type ViewableProps = {
    alpha?: number
    layer?: number
    visible?: boolean
}
export const viewablePropsTypeDef = `
type ViewableProps = {
    /** ${propDescription.alpha} */
    alpha?: number

    /** ${propDescription.layer} */
    layer?: number

    /** ${propDescription.visible} */
    visible?: boolean
}`
export const viewableApi = [
    // Props
    `/** ${propDescription.alpha} */
    alpha: number`,

    `/** ${propDescription.layer} */
    layer: number`,

    `/** ${propDescription.visible} */
    visible: boolean`,

    // Methods
    `/** Show this object. */
    show(): void`,

    `/** Hide this object. */
    hide(): void`,
].join('\n')

export function Viewable<Base extends Class>(base: Base) {    
    return class Viewable extends base {
        // TODO:
        // - tint
        // - blend mode
        // - effects?

        _refObj?: any
        _alpha: number = 1
        _layer: number = 0
        _visible: boolean = true

        constructor(...args: any[]) {
            super()
        }

        initViewable(props?: GameObjectProps) {
            if (props?.alpha != null) this.alpha = props.alpha
            if (props?.layer) this.layer = props.layer
            if (props?.visible) this.visible = props.visible
        }

        queueShow() {
            // Visible objects may flicker on create without this delay
            if (!this._refObj) return

            if (this.visible) {
                this._refObj.setVisible(false)
                new Promise(resolve => setTimeout(resolve, 0)).then(() => this._refObj.setVisible(true))
            }
        }

        get alpha(): number {
            return this._alpha
        }
        set alpha(alpha: number) {
            this._alpha = alpha
            if (this._refObj) this._refObj.setAlpha(alpha)
        }
        
        // Update for phaser
        get layer(): number {
            return this._layer
        }
        set layer(layer: number) {
            this._layer = layer
            if (this._refObj) this._refObj.setDepth(layer)
        }

        get visible(): boolean {
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

// (pointer: any, localX: number, localY: number, event: any) -- args from pointer event callbacks
type PointerAction = ((x: number, y: number) => void) | undefined | null

enum CursorType {
    AUTO = 'auto',
    DEFAULT = 'default',
    NONE = 'none',
    CONTEXT_MENU = 'context-menu',
    HELP = 'help',
    POINTER = 'pointer',
    // ETC = 'etc',
}

type Cursor = {
    src: string,
    type?: CursorType | 'auto' | 'default' | 'none' | 'context-menu' | 'help' | 'pointer' | 'progress' | 'wait' | 'cell' | 'crosshair' | 'text' | 'vertical-text' | 'copy' | 'move' | 'no-drop' | 'not-allowed' | 'grab' | 'grabbing' | 'all-scroll' | 'col-resize' | 'row-resize' | 'n-resize' | 'e-resize' | 's-resize' | 'w-resize' | 'ne-resize' | 'nw-resize' | 'se-resize' | 'sw-resize' | 'ew-resize' | 'ns-resize' // ...TODO
} | undefined | null

// const cursorApiString = '{  }'

export type InteractableProps = {
    draggable?: boolean
    cursor?: Cursor
    onClick?: PointerAction
    onRelease?: PointerAction
    onMouseEnter?: PointerAction
    onMouseExit?: PointerAction
    onDrag?: PointerAction
    onDragStart?: PointerAction
    onDragEnd?: PointerAction
}
export const interactablePropsTypeDef = `
type PointerAction = (
    /**
     * @param x The x position of the mouse during the click.
     * @param y The y position of the mouse during the click.
     */
    (x: number, y: number) => void
) | undefined | null

enum CursorType {
    AUTO = 'auto',
    DEFAULT = 'default',
    NONE = 'none',
    CONTEXT_MENU = 'context-menu',
    HELP = 'help',
    POINTER = 'pointer',
    ETC = 'etc',
}
type Cursor = {
    src: string,
    type?: CursorType | 'auto' | 'default' | 'none' | 'context-menu' | 'help' | 'pointer' | 'progress' | 'wait' | 'cell' | 'crosshair' | 'text' | 'vertical-text' | 'copy' | 'move' | 'no-drop' | 'not-allowed' | 'grab' | 'grabbing' | 'all-scroll' | 'col-resize' | 'row-resize' | 'n-resize' | 'e-resize' | 's-resize' | 'w-resize' | 'ne-resize' | 'nw-resize' | 'se-resize' | 'sw-resize' | 'ew-resize' | 'ns-resize' // ...TODO
} | undefined | null

type InteractableProps = {
    /** ${propDescription.draggable} */
    draggable?: boolean

    /** ${propDescription.cursor} */
    cursor?: Cursor
    
    /** ${propDescription.onClick} */
    onClick?: PointerAction

    /** ${propDescription.onRelease} */
    onRelease?: PointerAction

    /** ${propDescription.onMouseEnter} */
    onMouseEnter?: PointerAction

    /** ${propDescription.onMouseExit} */
    onMouseExit?: PointerAction

    /** ${propDescription.onDrag} */
    onDrag?: PointerAction

    /** ${propDescription.onDragStart} */
    onDragStart?: PointerAction

    /** ${propDescription.onDragEnd} */
    onDragEnd?: PointerAction
}`
export const interactableApi = [
    // Props
    `/** ${propDescription.draggable} */
    draggable: boolean`,

    `/** ${propDescription.cursor} */
    cursor: Cursor`,

    `/** ${propDescription.onClick} */
    onClick: PointerAction`,

    `/** ${propDescription.onRelease} */
    onRelease: PointerAction`,

    `/** ${propDescription.onMouseEnter} */
    onMouseEnter: PointerAction`,

    `/** ${propDescription.onMouseExit} */
    onMouseExit: PointerAction`,

    `/** ${propDescription.onDrag} */
    onDrag: PointerAction`,

    `/** ${propDescription.onDragStart} */
    onDragStart: PointerAction`,

    `/** ${propDescription.onDragEnd} */
    onDragEnd: PointerAction`,

    // Methods
    `/** Set this object's hover cursor back to the default pointer. */
    resetCursor(): void`,
].join('\n')

export function Interactable<Base extends Class>(base: Base) {
    return class Interactable extends base {
        // TODO:
        // - more input events (double click, right click, scroll, mousemove...)
        // - drag cursor
        // - look into context menu interrupting, i.e. right click while dragging doesn't end drag (should it? should i just disable canvas context menu)

        _refObj?: any
        _cursor?: Cursor

        _onClick?: PointerAction
        _onRelease?: PointerAction
        _onMouseEnter?: PointerAction
        _onMouseExit?: PointerAction

        _onDrag?: PointerAction
        _onDragStart?: PointerAction
        _onDragEnd?: PointerAction
        
        _draggable: boolean = false
        isInteractive: boolean = false
        
        constructor(...args: any[]) {
            super()
        }

        initInteractable(props?: GameObjectProps) {
            if (props?.draggable) this.draggable = props.draggable
            if (props?.cursor) this.cursor = props.cursor

            if (props?.onClick) this.onClick = props.onClick
            if (props?.onRelease) this.onRelease = props.onRelease
            if (props?.onMouseEnter) this.onMouseEnter = props.onMouseEnter
            if (props?.onMouseExit) this.onMouseExit = props.onMouseExit

            if (props?.onDrag) this.onDrag = props.onDrag
            if (props?.onDragStart) this.onDragStart = props.onDragStart
            if (props?.onDragEnd) this.onDragEnd = props.onDragEnd
        }

        get cursor(): Cursor {
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
                    type: CursorType.DEFAULT
                }
            } else {
                cursorObj = {
                    src: (cursor as Cursor)?.src ?? 'default',
                    type: (cursor as Cursor)?.type ?? CursorType.DEFAULT
                }
            }
            
            if (!cursor || cursorObj.src === 'default') {
                // Disable interactive here if no input actions are defined?
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

            this._replacePointerListener(
                Phaser.Input.Events.POINTER_DOWN,
                onClick
            )
            this._onClick = onClick
        }
        
        get onRelease(): PointerAction {
            return this._onRelease
        }
        set onRelease(onRelease: PointerAction) {
            if (!this._refObj) return

            this._replacePointerListener(
                Phaser.Input.Events.POINTER_UP,
                onRelease
            )
            this._onRelease = onRelease
        }

        get onMouseEnter(): PointerAction {
            return this._onMouseEnter
        }
        set onMouseEnter(onMouseEnter: PointerAction) {
            if (!this._refObj) return

            this._replacePointerListener(
                Phaser.Input.Events.POINTER_OVER,
                onMouseEnter
            )
            this._onMouseEnter = onMouseEnter
        }

        get onMouseExit(): PointerAction {
            return this._onMouseExit
        }
        set onMouseExit(onMouseExit: PointerAction) {
            if (!this._refObj) return
            
            this._replacePointerListener(
                Phaser.Input.Events.POINTER_OUT,
                onMouseExit
            )
            this._onMouseExit = onMouseExit
        }

        get onDrag(): PointerAction {
            return this._onDrag
        }
        set onDrag(onDrag: PointerAction) {
            if (!this._refObj) return

            this._replacePointerListener(
                Phaser.Input.Events.DRAG,
                onDrag
            )
            this._onDrag = onDrag
        }

        get onDragStart(): PointerAction {
            return this._onDragStart
        }
        set onDragStart(onDragStart: PointerAction) {
            if (!this._refObj) return

            this._replacePointerListener(
                Phaser.Input.Events.DRAG_START,
                onDragStart
            )
            this._onDragStart = onDragStart
        }

        get onDragEnd(): PointerAction {
            return this._onDragStart
        }
        set onDragEnd(onDragEnd: PointerAction) {
            if (!this._refObj) return

            this._replacePointerListener(
                Phaser.Input.Events.DRAG_END,
                onDragEnd
            )
            this._onDragEnd = onDragEnd
        }

        get draggable(): boolean {
            return this._draggable
        }
        set draggable(draggable: boolean) {
            if (!this._refObj) return
            if (draggable === this._draggable) return

            this._draggable = draggable
            // if (!draggable && !this.isInteractive) {
                this.setInteractive()
            // }
        }
        
        resetCursor() {
            this.cursor = 'default'
        }
        
        setInteractive() {
            // Set's phaser object's interactive state if it isn't already
            if (!this._refObj) return
            
            if (!this.isInteractive) {
                if (this._draggable) {
                    this._refObj.setInteractive({draggable: true})
                } else {
                    this._refObj.setInteractive()
                }
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
        _replacePointerListener(inputEvent: string, callback: PointerAction) {
            if (!this._refObj) return
            
            // Look for a way to disable the specific listener to be replaced. Maybe if
            // callback is a function, store a reference somewhere then retrieve here?
            // For now, just remove all listeners
            this._refObj.off(inputEvent)

            if (!callback) return
            this.setInteractive()
            this._refObj.on(inputEvent, (pointer: any, localX: number, localY: number, event: any) => {
                if (paused) return
                const eventPoint = getGamePoint({
                    x: localX,
                    y: localY
                })
                callback(eventPoint.x, eventPoint.y)
            })
        }

        // _removeListener(inputEvent: string, callback: PointerAction) {
        //     if (!this._refObj) return
        // }
    }
}

export function Timeable<Base extends Class>(base: Base) {
    return class Timeable extends base {
        _initTime: number

        constructor(...args: any[]) {
            super()
            this._initTime = timer.time
        }

        get age(): number {
            // Returns this object's age in seconds not including pause time
            return (timer.time - this._initTime) / 1000
        }
    }
}
export const timeableApi = [
    // Props
    `/** How long this object has existed in seconds. */
    age: number`,

    // Methods
    // ...
].join('\n')

export const gameObjectApi = [
    positionableApi,
    sizableApi,
    rotatableApi,
    viewableApi,
    interactableApi,
    timeableApi
].join('\n')

export const gameObjectPropsTypeDef = [
    positionablePropsTypeDef,
    sizablePropsTypeDef,
    rotatablePropsTypeDef,
    viewablePropsTypeDef,
    interactablePropsTypeDef,
    `type GameObjectProps = PositionableProps & SizableProps & RotatableProps & InteractableProps & ViewableProps`
]