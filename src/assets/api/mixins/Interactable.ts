import { clock, paused, getGamePoint, scene, PointerEvents } from "../core"
import type { Point } from "../Point"
import type { MouseInputAction, Optional, PointerAction, ReferenceObject } from "../types"
import type { Class } from "./shared"

import Phaser from "phaser"

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
    onMouse?: MouseInputAction
    onClick?: PointerAction
    onRelease?: PointerAction
    onDoubleClick?: PointerAction
    onLeftClick?: PointerAction
    onLeftRelease?: PointerAction
    onRightClick?: PointerAction
    onRightRelease?: PointerAction
    onMiddleClick?: PointerAction
    onMiddleRelease?: PointerAction
    onMouseEnter?: PointerAction
    onMouseExit?: PointerAction
	onMouseMove?: PointerAction
    onDrag?: PointerAction
    onDragStart?: PointerAction
    onDragEnd?: PointerAction
	onScroll?: PointerAction
}

const propDescription: Record<keyof InteractableProps, string> = {
    draggable: `Whether this object can be dragged with the mouse.`,
    cursor: `The cursor shown when the mouse is over this object.`,

    onMouse: `Register mouse event functions, used to more easily assign several actions at once.`,

    onClick: `Register a function to run when clicking this object.`,
    onRelease: `Register a function to run when releasing a click on this object.`,
    onDoubleClick: `Register a function to run when quickly left clicking twice on this object.`,

    onLeftClick: `Register a function to run when left clicking this object.`,
    onLeftRelease: `Register a function to run when releasing a left click on this object.`,

    onRightClick: `Register a function to run when right clicking this object.`,
    onRightRelease: `Register a function to run when releasing a right click on this object.`,

    onMiddleClick: `Register a function to run when middle clicking this object.`,
    onMiddleRelease: `Register a function to run when releasing a middle click on this object.`,

    onMouseEnter: `Register a function to run when the mouse first starts overlapping this object.`,
    onMouseExit: `Register a function to run when the mouse first stops overlapping this object.`,
    onMouseMove: `Register a function to run when the mouse moves while overlapping over this object.`,

    onDrag: `Register a function to run repeatedly while this object is being dragged.`,
    onDragStart: `Register a function to run when this object first starts being dragged.`,
    onDragEnd: `Register a function to run when this object first stops being dragged.`,

	onScroll: `Register a function to run when scrolling while hoevering over this object.`
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

    /** ${propDescription.onMouse} */
    onMouse?: MouseInputAction

    /** ${propDescription.onClick} */
    onClick?: PointerAction

    /** ${propDescription.onRelease} */
    onRelease?: PointerAction

    /** ${propDescription.onDoubleClick} */
    onDoubleClick?: PointerAction

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

    `/** ${propDescription.onMouse} */
    onMouse(actions: MouseInputAction): void`,

    `/** ${propDescription.onClick} */
    onClick(func?: PointerAction): void`,

    `/** ${propDescription.onRelease} */
    onRelease(func?: PointerAction): void`,

    `/** ${propDescription.onDoubleClick} */
    onDoubleClick(func?: PointerAction): void`,

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

/**
 * If an object extends Interactable, it must have { x: number, y: number }.
 * When extending Positionable and Interactable, make sure Positionable comes
 * earlier in the inheritance chain, e.g.
 * 
 * class ClassName extends
 *  ExampleMixin(
 *  Interactable(
 *  Positionable(
 *  OtherMixin(
 *  ...
 * 
 */
export function Interactable<Base extends Class<Point>>(base: Base) {
    return class Interactable extends base {
        // TODO (Interactable):
        // - more input events?
        // - drag cursor
        _refObj?: ReferenceObject
        _eventActions: Map<string, PointerAction> = new Map()
        _cursor?: Cursor
        _draggable: boolean = false
        _lastLeftClickTime: number = 0
        _lastDragFrame: number = -1
        isInteractive: boolean = false

        constructor(...args: any[]) {
            super()
        }

        initInteractable(props?: InteractableProps) {
            this.draggable = props?.draggable ?? false
            this._setInteractive()
            if (props?.cursor) this.cursor = props.cursor

            // Warning if providing onMouse along with other event registers
            if (props?.onMouse) this.onMouse(props.onMouse)

            if (props?.onClick !== undefined) this.onClick(props.onClick)
            if (props?.onRelease !== undefined) this.onRelease(props.onRelease)
            if (props?.onDoubleClick !== undefined) this.onDoubleClick(props.onDoubleClick)

            if (props?.onLeftClick !== undefined) this.onLeftClick(props.onLeftClick)
            if (props?.onLeftRelease !== undefined) this.onLeftRelease(props.onLeftRelease)

            if (props?.onRightClick !== undefined) this.onRightClick(props.onRightClick)
            if (props?.onRightRelease !== undefined) this.onRightRelease(props.onRightRelease)

            if (props?.onMiddleClick !== undefined) this.onMiddleClick(props.onMiddleClick)
            if (props?.onMiddleRelease !== undefined) this.onMiddleRelease(props.onMiddleRelease)

            if (props?.onMouseEnter !== undefined) this.onMouseEnter(props.onMouseEnter)
            if (props?.onMouseExit !== undefined) this.onMouseExit(props.onMouseExit)

            if (props?.onDrag !== undefined) this.onDrag(props.onDrag)
            if (props?.onDragStart !== undefined) this.onDragStart(props.onDragStart)
            if (props?.onDragEnd !== undefined) this.onDragEnd(props.onDragEnd)

            if (props?.onScroll !== undefined) this.onScroll(props.onScroll)
            if (props?.onMouseMove !== undefined) this.onMouseMove(props.onMouseMove)

            // if (!('x' in this && 'y' in this)) return

            // Default drag event that gets replaced once user assigns their own
            if (props?.onDrag === undefined && props?.onMouse?.Drag === undefined) {
                this.onDrag((x, y) => {
                    this.x = x
                    this.y = y
                })
            }

            // Capturing Phaser events here and emitting them as custom events for easier control
            // over sent params + auto converting pointer coords
            const getCenterOffset = (pointer: Phaser.Input.Pointer) => {
                const x = 'getCenter' in this._refObj ?
                    this._refObj.getCenter().x :
                    this._refObj.x

                const y = 'getCenter' in this._refObj ?
                    this._refObj.getCenter().y :
                    this._refObj.y

                return {
                    x: pointer.x - x,
                    y: -(pointer.y - y)
                }
            }

            // Emit custom left/right click events
            this._refObj?.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer, ...rest: any[]) => {
                if (paused) return
                const { x, y } = getCenterOffset(pointer)

                if (pointer.leftButtonDown()) {
                    this._refObj.emit(PointerEvents.POINTER_DOWN_LEFT, x, y)

                    // Double click if it's been <= 500 ms since last non-double left click
                    if (Date.now() - this._lastLeftClickTime <= 500) {
                        this._refObj.emit(PointerEvents.POINTER_DOUBLE, x, y)
                        // Reset last click time so that three quick clicks don't count as single-double-double.
                        // So two consecutive *double* clicks requires 4 individual clicks.
                        this._lastLeftClickTime = 0
                    } else {
                        this._lastLeftClickTime = Date.now()
                    }
                }

                if (pointer.rightButtonDown()) {
                    this._refObj.emit(PointerEvents.POINTER_DOWN_RIGHT, x, y)
                }

                if (pointer.middleButtonDown()) {
                    this._refObj.emit(PointerEvents.POINTER_DOWN_MIDDLE, x, y)
                }

                this._refObj.emit(PointerEvents.POINTER_DOWN, x, y)
            })

            // Emit custom left/right release events
            this._refObj?.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer, ...rest: any[]) => {
                if (paused) return
                const { x, y } = getCenterOffset(pointer)
                if (pointer.leftButtonReleased()) {
                    this._refObj.emit(PointerEvents.POINTER_UP_LEFT, x, y)
                }

                if (pointer.rightButtonReleased()) {
                    this._refObj.emit(PointerEvents.POINTER_UP_RIGHT, x, y)
                }

                if (pointer.middleButtonReleased()) {
                    this._refObj.emit(PointerEvents.POINTER_UP_MIDDLE, x, y)
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
                if (!paused && clock.frame > this._lastDragFrame) {
                    const { x, y } = getGamePoint({ x: localX, y: localY })
                    this._refObj.emit(PointerEvents.DRAG, x, y)
                    this._lastDragFrame = clock.frame
                }
            })

            // Custom drag start event
            this._refObj?.on(Phaser.Input.Events.DRAG_START, (pointer: Phaser.Input.Pointer, ...rest: any[]) => {
                if (paused) return
                const { x, y } = getCenterOffset(pointer)
                this._refObj.emit(PointerEvents.DRAG_START, x, y)
            })

            // Custom drag end event
            this._refObj?.on(Phaser.Input.Events.DRAG_END, (pointer: Phaser.Input.Pointer, ...rest: any[]) => {
                if (paused) return
                const { x, y } = getCenterOffset(pointer)
                this._refObj.emit(PointerEvents.DRAG_END, x, y)
            })

            // Custom pointer over / mouse enter event
            this._refObj?.on(Phaser.Input.Events.POINTER_OVER, (pointer: Phaser.Input.Pointer, ...rest: any[]) => {
                if (paused) return
                const { x, y } = getCenterOffset(pointer)
                this._refObj.emit(PointerEvents.POINTER_OVER, x, y)
            })

            // Custom pointer out / mouse exit event
            this._refObj?.on(Phaser.Input.Events.POINTER_OUT, (pointer: Phaser.Input.Pointer, ...rest: any[]) => {
                if (paused) return
                const { x, y } = getCenterOffset(pointer)
                this._refObj.emit(PointerEvents.POINTER_OUT, x, y)
            })

			this._refObj?.on(Phaser.Input.Events.POINTER_MOVE, (pointer: Phaser.Input.Pointer, ...rest: any[]) => {
                if (paused) return
                const { x, y } = getCenterOffset(pointer)
				this._refObj.emit(PointerEvents.POINTER_MOVE, x, y)
			})

            // Custom scroll event
            this._refObj?.on(Phaser.Input.Events.POINTER_WHEEL, (pointer: Phaser.Input.Pointer, deltaX: number, deltaY: number, deltaZ: number, ...rest: any[]) => {
                if (paused) return
				// deltaZ..?
                this._refObj.emit(PointerEvents.POINTER_WHEEL, deltaX, -deltaY)
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
		onMouse(actions: MouseInputAction) {
			if (actions.Click !== undefined) this.onClick(actions.Click)
            if (actions.Release !== undefined) this.onRelease(actions.Release)
            if (actions.DoubleClick !== undefined) this.onDoubleClick(actions.DoubleClick)

            if (actions.LeftClick !== undefined) this.onLeftClick(actions.LeftClick)
            if (actions.LeftRelease !== undefined) this.onLeftRelease(actions.LeftRelease)

            if (actions.RightClick !== undefined) this.onRightClick(actions.RightClick)
            if (actions.RightRelease !== undefined) this.onRightRelease(actions.RightRelease)

            if (actions.MiddleClick !== undefined) this.onMiddleClick(actions.MiddleClick)
            if (actions.MiddleRelease !== undefined) this.onMiddleRelease(actions.MiddleRelease)

            if (actions.Enter !== undefined) this.onMouseEnter(actions.Enter)
            if (actions.Exit !== undefined) this.onMouseExit(actions.Exit)

            if (actions.Drag !== undefined) this.onDrag(actions.Drag)
            if (actions.DragStart !== undefined) this.onDragStart(actions.DragStart)
            if (actions.DragEnd !== undefined) this.onDragEnd(actions.DragEnd)

            if (actions.Scroll !== undefined) this.onScroll(actions.Scroll)
            if (actions.Move !== undefined) this.onMouseMove(actions.Move)

            // if (actions.Click) {
            //     console.log('actions.CLICK evaluates to true')
            // } else {
            //     console.log('actions.CLICK evaluates to false')
            // }

            // if (actions.hasOwnProperty('CLICK')) {
            //     console.log('hasOwnProp evaluates to true')
            // } else {
            //     console.log('hasOwnProp evaluates to false')
            // }
		}

        onMouseHold() {
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

        /** Captures only left button double clicks (two left clicks within 500ms). */
        onDoubleClick(action?: PointerAction) {
            if (!this._refObj) return
            this._replacePointerListener(PointerEvents.POINTER_DOUBLE, action)
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

        /** Captures only middle button press. */
        onMiddleClick(action?: PointerAction) {
            if (!this._refObj) return
            this._replacePointerListener(PointerEvents.POINTER_DOWN_MIDDLE, action)
        }

        /** Captures only middle button release. */
        onMiddleRelease(action?: PointerAction) {
            if (!this._refObj) return
            this._replacePointerListener(PointerEvents.POINTER_UP_MIDDLE, action)
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
            // console.log('ondrag')
            this._replacePointerListener(PointerEvents.DRAG, action)
            // console.log((this._refObj as Phaser.GameObjects.Sprite).listeners(PointerEvents.DRAG))
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
        _replacePointerListener(eventName: string, userAction?: PointerAction | null) {
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
