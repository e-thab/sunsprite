import { Alignable, Fillable, Interactable, Outlinable, Positionable, Rotatable, Sizable, Timeable, Viewable, type ShapeProps } from "./mixins";

export default abstract class Shape extends
    Fillable(
    Outlinable(
    Rotatable(
    Viewable(
    Interactable(
    Alignable(
    Sizable(
    Positionable(
    Timeable(class {
        constructor() {

        }
    }))))))))) {
    
    constructor() {
        super()
    }

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