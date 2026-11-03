import { Alignable, Destructible, Fillable, Interactable, Orientable, Outlinable, Positionable, Rotatable, Sizable, Timeable, Viewable, type ShapeProps } from "./mixins";

export default abstract class Shape extends
    Fillable(
    Outlinable(
    Viewable(
    Interactable(
    Orientable(
    Alignable(
    Rotatable(
    Sizable(
    Positionable(
    Destructible(
    Timeable(class {
        constructor() {

        }
    }))))))))))) {
    
    constructor() {
        super()
    }

    /** Horizontal size in pixels. */
    get width(): number {
        return this._width * this._scale
    }
    set width(width: number) {
        this._width = this._unscaled(width)
        this._redraw()
    }

    /** Vertical size in pixels. */
    get height(): number {
        return this._height * this._scale
    }
    set height(height: number) {
        this._height = this._unscaled(height)
        this._redraw()
    }

    /** Factor to multiply size by. Setting scale to 2 will double its size; 0.5 will halve it. */
    get scale(): number {
        return this._scale
    }
    set scale(scale: number) {
        this._scale = scale
        this._redraw()
    }

    /** Get a size dimension as it would be without scale applied. */
    _unscaled(size: number): number {
        return this._scale === 0 ? size : size / this._scale
    }

    /**
     * Resizes the Phaser object's geometry to the shape's on-screen width and height.
     * Implement this to adjust sizing behavior from Sizable's direct property-setting.
     */ 
    abstract _redraw(): void

    _initMixins(props?: ShapeProps) {
        this._initPositionable(props)
        this._initSizable(props)
        this._initAlignable(props)
        this._initInteractable(props)
        this._initViewable(props)
        this._initRotatable(props)
        this._initFillable(props)
        this._initOutlinable(props)
    }
}