// Revisiting Mixins https://www.typescriptlang.org/docs/handbook/mixins.html
// import { allPositionables, app, /*camera,*/ mouseX, mouseY, paused, print, Timer } from "./core"
import { deg2rad, rad2deg, random } from "./utility"
// import { Point, type AnyPoint } from "./interfaces"
import { pointFrom, type Point, type PointArg } from "./Point"
import { screen, camera, timer, paused, getGamePoint, game, scene, PointerEvents } from "./core"

import Phaser from "phaser"
import type { Action, MouseAction, Optional } from "./interfaces"

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

    onLeftClick: `Register a function to run when left clicking this object.`,
    onLeftRelease: `Register a function to run when releasing a left click on this object.`,

    onRightClick: `Register a function to run when right clicking this object.`,
    onRightRelease: `Register a function to run when releasing a right click on this object.`,

    onMouseEnter: `Register a function to run when the mouse first starts overlapping this object.`,
    onMouseExit: `Register a function to run when the mouse first stops overlapping this object.`,
    onMouseMove: `Register a function to run when the mouse moves while overlapping over this object.`,

    onDrag: `Register a function to run repeatedly while this object is being dragged.`,
    onDragStart: `Register a function to run when this object first starts being dragged.`,
    onDragEnd: `Register a function to run when this object first stops being dragged.`,

	onScroll: `Register a function to run when scrolling while hoevering over this object.`
}

export type PositionableProps = {
    x?: number
    y?: number
    pos?: PointArg
    position?: PointArg
}
export const positionablePropsTypeDef = `
declare type PositionableProps = {
    /** ${propDescription.x} */
    x?: number

    /** ${propDescription.y} */
    y?: number

    /** ${propDescription.pos} */
    pos?: PointArg

    /** ${propDescription.position} */
    position?: PointArg
}`
export const positionableApi = [
    // Props
    `/** ${propDescription.x} */
    x: number`,

    `/** ${propDescription.y} */
    y: number`,

    `/** ${propDescription.pos} */
    pos: Point`,

    `/** ${propDescription.position} */
    position: Point`,

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
        set position(pos: PointArg) {
            pos = pointFrom(pos)
            this._x = pos.x
            this._y = pos.y
            this._updatePosition()
        }

        // Alias for position: pos
        get pos(): Point {
            return this.position
        }
        set pos(pos: PointArg) {
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
declare type SizableProps = {
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
            // TODO: lookAt()
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
        // TODO (Viewable):
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

type PointerAction = ((x: number, y: number) => void) | (() => void)

enum CursorType {
    AUTO = 'auto',
    DEFAULT = 'default',
    NONE = 'none',
    CONTEXT_MENU = 'context-menu',
    HELP = 'help',
    POINTER = 'pointer',
    // ETC = 'etc',
}

type Cursor = Optional<{
    src: string,
    type?: CursorType | 'auto' | 'default' | 'none' | 'context-menu' | 'help' | 'pointer' | 'progress' | 'wait' | 'cell' | 'crosshair' | 'text' | 'vertical-text' | 'copy' | 'move' | 'no-drop' | 'not-allowed' | 'grab' | 'grabbing' | 'all-scroll' | 'col-resize' | 'row-resize' | 'n-resize' | 'e-resize' | 's-resize' | 'w-resize' | 'ne-resize' | 'nw-resize' | 'se-resize' | 'sw-resize' | 'ew-resize' | 'ns-resize' // ...TODO
}>

export type InteractableProps = {
    draggable?: boolean
    cursor?: Cursor
    onClick?: PointerAction
    onRelease?: PointerAction
    onLeftClick?: PointerAction
    onLeftRelease?: PointerAction
    onRightClick?: PointerAction
    onRightRelease?: PointerAction
    onMouseEnter?: PointerAction
    onMouseExit?: PointerAction
	onMouseMove?: PointerAction
    onDrag?: PointerAction
    onDragStart?: PointerAction
    onDragEnd?: PointerAction
	onScroll?: PointerAction
}
export const interactablePropsTypeDef = `
declare type PointerAction = (
    /**
     * @param x The x position of the mouse during the click.
     * @param y The y position of the mouse during the click.
     */
    (x: number, y: number) => void
)

declare type ScrollAction = (
    /**
     * @param x The horizontal distance scrolled.
     * @param y The vertical distance scrolled.
     */
    (x: number, y: number) => void
)

declare enum CursorType {
    AUTO = 'auto',
    DEFAULT = 'default',
    NONE = 'none',
    CONTEXT_MENU = 'context-menu',
    HELP = 'help',
    POINTER = 'pointer',
    ETC = 'etc',
}
declare type Cursor = {
    src: string,
    type?: CursorType | 'auto' | 'default' | 'none' | 'context-menu' | 'help' | 'pointer' | 'progress' | 'wait' | 'cell' | 'crosshair' | 'text' | 'vertical-text' | 'copy' | 'move' | 'no-drop' | 'not-allowed' | 'grab' | 'grabbing' | 'all-scroll' | 'col-resize' | 'row-resize' | 'n-resize' | 'e-resize' | 's-resize' | 'w-resize' | 'ne-resize' | 'nw-resize' | 'se-resize' | 'sw-resize' | 'ew-resize' | 'ns-resize' // ...TODO
} | undefined | null

declare type InteractableProps = {
    /** ${propDescription.draggable} */
    draggable?: boolean

    /** ${propDescription.cursor} */
    cursor?: Cursor | string
    
    /** ${propDescription.onClick} */
    onClick?: PointerAction

    /** ${propDescription.onRelease} */
    onRelease?: PointerAction

    /** ${propDescription.onLeftClick} */
    onLeftClick?: PointerAction

    /** ${propDescription.onLeftRelease} */
    onLeftRelease?: PointerAction

    /** ${propDescription.onRightClick} */
    onRightClick?: PointerAction

    /** ${propDescription.onRightRelease} */
    onRightRelease?: PointerAction

    /** ${propDescription.onMouseEnter} */
    onMouseEnter?: PointerAction

    /** ${propDescription.onMouseExit} */
    onMouseExit?: PointerAction

	/** ${propDescription.onMouseMove} */
    onMouseMove?: PointerAction

    /** ${propDescription.onDrag} */
    onDrag?: PointerAction

    /** ${propDescription.onDragStart} */
    onDragStart?: PointerAction

    /** ${propDescription.onDragEnd} */
    onDragEnd?: PointerAction

	/** ${propDescription.onScroll} */
    onScroll?: PointerAction
}`
export const interactableApi = [
    // Props
    `/** ${propDescription.draggable} */
    draggable: boolean`,

    `/** ${propDescription.cursor} */
    cursor: Cursor`,

    `/** ${propDescription.onClick} */
    onClick(func?: PointerAction): void`,

    `/** ${propDescription.onRelease} */
    onRelease(func?: PointerAction): void`,

    `/** ${propDescription.onLeftClick} */
    onLeftClick(func?: PointerAction): void`,

    `/** ${propDescription.onLeftRelease} */
    onLeftRelease(func?: PointerAction): void`,

    `/** ${propDescription.onRightClick} */
    onRightClick(func?: PointerAction): void`,

    `/** ${propDescription.onRightRelease} */
    onRightRelease(func?: PointerAction): void`,

    `/** ${propDescription.onMouseEnter} */
    onMouseEnter(func?: PointerAction): void`,

    `/** ${propDescription.onMouseExit} */
    onMouseExit(func?: PointerAction): void`,

	`/** ${propDescription.onMouseMove} */
    onMouseMove(func?: PointerAction): void`,

    `/** ${propDescription.onDrag} */
    onDrag(func?: PointerAction): void`,

    `/** ${propDescription.onDragStart} */
    onDragStart(func?: PointerAction): void`,

    `/** ${propDescription.onDragEnd} */
    onDragEnd(func?: PointerAction): void`,

	`/** ${propDescription.onScroll} */
    onScroll(func?: ScrollAction): void`,

    // Methods
    `/** Set this object's hover cursor back to the default pointer. */
    resetCursor(): void`,
].join('\n')

export function Interactable<Base extends Class>(base: Base) {
    return class Interactable extends base {
        // TODO (Interactable):
        // - more input events (double click, right click, scroll, mousemove...)
        // - drag cursor
        // - look into context menu interrupting, i.e. right click while dragging doesn't end drag (should it? should i just disable canvas context menu)
        _refObj?: any
        _eventActions: Map<string, PointerAction> = new Map()
        _cursor?: Cursor
        _draggable: boolean = false
        isInteractive: boolean = false
        
        constructor(...args: any[]) {
            super()
        }

        initInteractable(props?: GameObjectProps) {
            if (props?.draggable) this.draggable = props.draggable
            this._setInteractive()
            if (props?.cursor) this.cursor = props.cursor

            if (props?.onClick) this.onClick(props.onClick)
            if (props?.onRelease) this.onRelease(props.onRelease)

            if (props?.onLeftClick) this.onLeftClick(props.onLeftClick)
            if (props?.onLeftRelease) this.onLeftRelease(props.onLeftRelease)

            if (props?.onRightClick) this.onRightClick(props.onRightClick)
            if (props?.onRightRelease) this.onRightRelease(props.onRightRelease)

            if (props?.onMouseEnter) this.onMouseEnter(props.onMouseEnter)
            if (props?.onMouseExit) this.onMouseExit(props.onMouseExit)

            if (props?.onDrag) this.onDrag(props.onDrag)
            if (props?.onDragStart) this.onDragStart(props.onDragStart)
            if (props?.onDragEnd) this.onDragEnd(props.onDragEnd)
            if (props?.onScroll) this.onScroll(props.onScroll)
            
            if (!('x' in this && 'y' in this)) return

            // Capturing Phaser events here and emitting them as custom events for easier control
            // over sent params + auto converting pointer coords
            const getCenterOffset = (pointer: Phaser.Input.Pointer) => {
                return {
                    x: pointer.x - this._refObj.getCenter().x,
                    y: -(pointer.y - this._refObj.getCenter().y)
                }
            }

            // Emit custom left/right click events
            this._refObj?.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer, ...rest: any[]) => {
                const { x, y } = getCenterOffset(pointer)
                if (pointer.leftButtonDown()) {
                    this._refObj.emit(PointerEvents.POINTER_DOWN_LEFT, x, y)
                }
                if (pointer.rightButtonDown()) {
                    this._refObj.emit(PointerEvents.POINTER_DOWN_RIGHT, x, y)
                }
                this._refObj.emit(PointerEvents.POINTER_DOWN, x, y)
            })
            
            // Emit custom left/right release events
            this._refObj?.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer, ...rest: any[]) => {
                const { x, y } = getCenterOffset(pointer)
                if (pointer.leftButtonReleased()) {
                    this._refObj.emit(PointerEvents.POINTER_UP_LEFT, x, y)
                }
                if (pointer.rightButtonReleased()) {
                    this._refObj.emit(PointerEvents.POINTER_UP_RIGHT, x, y)
                }
                this._refObj.emit(PointerEvents.POINTER_UP, x, y)
            })

            // Custom drag event
            this._refObj?.on(Phaser.Input.Events.DRAG, (pointer: Phaser.Input.Pointer, localX: number, localY: number, ...rest: any[]) => {
                // Note: In the listener for drag events, the x and y args sent to the callback represent
                // a calculated position using the offset of the pointer to the object origin when initially
                // starting the drag. i.e. the arguments are provided as
                // x = pointerX - initialPointerOffsetX
                // y = pointerY - initialPointerOffsetY
                const { x, y } = getGamePoint({ x: localX, y: localY })
                this._refObj.emit(PointerEvents.DRAG, x, y)
            })

            // Custom drag start event
            this._refObj?.on(Phaser.Input.Events.DRAG_START, (pointer: Phaser.Input.Pointer, ...rest: any[]) => {
                const { x, y } = getCenterOffset(pointer)
                this._refObj.emit(PointerEvents.DRAG_START, x, y)
            })

            // Custom drag end event
            this._refObj?.on(Phaser.Input.Events.DRAG_END, (pointer: Phaser.Input.Pointer, ...rest: any[]) => {
                const { x, y } = getCenterOffset(pointer)
                this._refObj.emit(PointerEvents.DRAG_END, x, y)
            })

            // Custom pointer over / mouse enter event
            this._refObj?.on(Phaser.Input.Events.POINTER_OVER, (pointer: Phaser.Input.Pointer, ...rest: any[]) => {
                const { x, y } = getCenterOffset(pointer)
                this._refObj.emit(PointerEvents.POINTER_OVER, x, y)
            })

            // Custom pointer out / mouse exit event
            this._refObj?.on(Phaser.Input.Events.POINTER_OUT, (pointer: Phaser.Input.Pointer, ...rest: any[]) => {
                const { x, y } = getCenterOffset(pointer)
                this._refObj.emit(PointerEvents.POINTER_OUT, x, y)
            })

			this._refObj?.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer, ...rest: any[]) => {
                const { x, y } = getCenterOffset(pointer)
				this._refObj.emit(PointerEvents.POINTER_MOVE, x, y)
			})

            // Custom scroll event
            this._refObj?.on(Phaser.Input.Events.POINTER_WHEEL, (pointer: Phaser.Input.Pointer, deltaX: number, deltaY: number, deltaZ: number, ...rest: any[]) => {
				// deltaZ..?
                this._refObj.emit(PointerEvents.POINTER_WHEEL, deltaX, deltaY)
            })

            // Default drag event that gets replaced once user assigns their own
            this.onDrag((x, y) => {
                this.x = x
                this.y = y
            })
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

            this._cursor = cursorObj

            // Absolutely find a better way to do this, just testing for now
            const url = `url(cursors/${cursorObj.src})`
            const offset = cursor === 'dot_large.png' ? '16 16' : '' // manual offset only needed for non-.cur images
            
            this._refObj.input.cursor = `${url} ${offset}, ${cursorObj.type}`
        }

		/**
		 * TEST SCRIPT (temp)
		const card = new Sprite({
			src: './images/cards/joker_red.png',
			cursor: 'dot.cur',
			draggable: true
		})
		// card.draggable = true

		card.onClick((x, y) => print(`click1: (${x}, ${y})`))
		// card.onClick = (x, y) => print(`click: (${x}, ${y})`)

		// card.onRelease = (x, y) => print(`rel1: (${x}, ${y})`)
		// card.onRelease = (x, y) => print(`rel: (${x}, ${y})`)

		card.onLeftClick((x, y) => print(`Lclick1: (${x}, ${y})`))
		card.onLeftClick((x, y) => print(`Lclick: (${x}, ${y})`))

		card.onLeftRelease((x, y) => print(`Lrel1: (${x}, ${y})`))
		card.onLeftRelease((x, y) => print(`Lrel: (${x}, ${y})`))

		card.onRightClick((x, y) => print(`Rclick1: (${x}, ${y})`))
		card.onRightClick((x, y) => print(`Rclick: (${x}, ${y})`))

		card.onRightRelease((x, y) => print(`Rrel1: (${x}, ${y})`))
		card.onRightRelease((x, y) => print(`Rrel: (${x}, ${y})`))

		card.onMouseEnter((x, y) => print(`enter1: (${x}, ${y})`))
		card.onMouseEnter((x, y) => print(`enter: (${x}, ${y})`))

		card.onMouseExit((x, y) => print(`exit1: (${x}, ${y})`))
		card.onMouseExit((x, y) => print(`exit: (${x}, ${y})`))

		// card.onMouseMove((x, y) => print(`move: (${x}, ${y})`))
		card.onScroll((x, y) => print(`scroll: (${x}, ${y})`))

		// card.onDragStart = (x, y) => {
		//     card.pos = { x, y }
		//     print(`(${x}, ${y})`)
		// }
		// card.onDragEnd = (x, y) => {
		// //     // card.pos = { x, y }
		//     print(`(${x}, ${y})`)
		// }
		// card.onDrag = (x, y) => print(`onDrag-1 (${x}, ${y})`)
		// card.onDrag = (x, y) => {
			// card.pos = { x, y }
			// print(`(${x}, ${y})`)
		// }

		onKeyPress({
			SPACE: () => card.draggable = !card.draggable,
			F: () => card.onClick()
		})
		 */

		/** Generalized dict function for assigning to multiple events at once. */
		onMouse(actions?: MouseAction) {
			// TODO
		}

        /** Captures any pointer down event, either left or right mouse button. */
        onClick(action?: PointerAction) {
            if (!this._refObj) return
            this._replacePointerListener(PointerEvents.POINTER_DOWN, action)
        }

        /** Captures any pointer release event, either left or right mouse button. */
        onRelease(action?: PointerAction) {
            if (!this._refObj) return
            this._replacePointerListener(PointerEvents.POINTER_UP, action)
        }

        /** Captures only left button press. */
        onLeftClick(action?: PointerAction) {
            if (!this._refObj) return
            this._replacePointerListener(PointerEvents.POINTER_DOWN_LEFT, action)
        }
        
        /** Captures only left button release. */
        onLeftRelease(action?: PointerAction) {
            if (!this._refObj) return
            this._replacePointerListener(PointerEvents.POINTER_UP_LEFT, action)
        }

        /** Captures only right button press. */
        onRightClick(action?: PointerAction) {
            if (!this._refObj) return
            this._replacePointerListener(PointerEvents.POINTER_DOWN_RIGHT, action)
        }

        /** Captures only right button release. */
        onRightRelease(action?: PointerAction) {
            if (!this._refObj) return
            this._replacePointerListener(PointerEvents.POINTER_UP_RIGHT, action)
        }

        /** Captures the pointer entering the object. */
        onMouseEnter(action?: PointerAction) {
            if (!this._refObj) return
            this._replacePointerListener(PointerEvents.POINTER_OVER, action)
        }

        /** Captures the pointer exiting the object. */
        onMouseExit(action?: PointerAction) {
            if (!this._refObj) return
            this._replacePointerListener(PointerEvents.POINTER_OUT, action)
        }

        /** Captures the pointer dragging the object. */
        onDrag(action?: PointerAction) {
            if (!this._refObj) return
            this._replacePointerListener(PointerEvents.DRAG, action)
        }

		/** Captures the beginning of the drag event. */
        onDragStart(action?: PointerAction) {
			// Note: In the listeners for drag start and end, x and y args are not the same as
			// the x and y args passed during drag
            if (!this._refObj) return
            this._replacePointerListener(PointerEvents.DRAG_START, action)
        }
		
		/** Captures the end of the drag event. */
        onDragEnd(action?: PointerAction) {
            if (!this._refObj) return
            this._replacePointerListener(PointerEvents.DRAG_END, action)
        }
		
		/** Captures scroll events while hovering over this object. */
		onScroll(action?: PointerAction) {
            if (!this._refObj) return
            this._replacePointerListener(PointerEvents.POINTER_WHEEL, action)
		}

		onMouseMove(action?: PointerAction) {
			if (!this._refObj) return
			this._replacePointerListener(PointerEvents.POINTER_MOVE, action)
		}

        get draggable(): boolean {
            return this._draggable
        }
        set draggable(draggable: boolean) {
            if (!this._refObj) return
            if (draggable === this._draggable) return
            
            this._draggable = draggable
            this._setInteractive()
            // scene.input.setDraggable(this._refObj, draggable)
        }
        
        resetCursor() {
            this.cursor = 'default'
        }
        
        _setInteractive() {
            // Set's phaser object's interactive state if it isn't already
            if (!this._refObj) return
            
            if (!this.isInteractive) {
                this._refObj.setInteractive()
                this.isInteractive = true
            }
            scene.input.setDraggable(this._refObj, this._draggable)
        }

        _disableInteractive() {
            if (!this._refObj) return
            
            if (this.isInteractive) {
                this._refObj.disableInteractive()
                this.isInteractive = false
            }
        }

        /**
         * Replace a pointer event listener with a new one.
         * @param eventName The name of the event to replace.
         * @param userAction The new callback function.
         */
        _replacePointerListener(eventName: string, userAction?: PointerAction) {
            if (!this._refObj) return

            if (this._eventActions.get(eventName)) {
                this._refObj.off(eventName, this._eventActions.get(eventName), this)
            }

            if (userAction) {
                this._eventActions.set(eventName, userAction)
				this._refObj.on(eventName, userAction, this)
            } else {
                this._eventActions.delete(eventName)
            }
        }
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

export const gameObjectPropsTypeDef = 'type GameObjectProps = PositionableProps & SizableProps & RotatableProps & InteractableProps & ViewableProps'
// [
//     positionablePropsTypeDef,
//     sizablePropsTypeDef,
//     rotatablePropsTypeDef,
//     viewablePropsTypeDef,
//     interactablePropsTypeDef,
//     `type GameObjectProps = PositionableProps & SizableProps & RotatableProps & InteractableProps & ViewableProps`
// ]