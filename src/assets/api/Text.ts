import { Text as PixiText } from "pixi.js";
import GameObject from "./GameObject";
import type { GameObjectProps } from "./mixins";
import { allPositionables, app } from "./core";

/**
 * Text class
 */

type TextProps = GameObjectProps & {
    text?: string
    color?: string
    size?: number
    font?: string
    outline?: { color: string, thickness: number }
    // outlineColor?: string
    // outlineWidth?: number
}

export default class Text extends GameObject {
    readonly _pixiObj: PixiText
    
    constructor(props?: TextProps) {
        super()

        const text = new PixiText()
        this._pixiObj = text
        // this.hide()
        this.text = props?.text ?? 'Text'
        this.color = props?.color ?? 'Black'
        this.size = props?.size ?? 24
        this.font = props?.font ?? 'Arial'
        if (props?.outline) this.outline = props.outline

        // Set mixin props
        this.initPositionable(props)
        this.setAnchorCenter()
        this.initSizable(props)
        this.initRotatable(props)
        this.initViewable(props)

        app.stage.addChild(text)
        allPositionables.push(this)
    }

    get text() {
        return this._pixiObj.text
    }
    set text(text) {
        this._pixiObj.text = text
    }

    get color() {
        return this._pixiObj.style.fill as string
    }
    set color(color) {
        this._pixiObj.style.fill = color
    }

    get size() {
        return this._pixiObj.style.fontSize as number
    }
    set size(size) {
        this._pixiObj.style.fontSize = size
    }

    get font() {
        return this._pixiObj.style.fontFamily as string
    }
    set font(font) {
        this._pixiObj.style.fontFamily = font
    }

    // get outlineColor() {
    //     return this._pixiObj.style.stroke as string
    // }
    // set outlineColor(outlineColor) {
    //     this._pixiObj.style.stroke = outlineColor
    // }

    // get outlineWidth() {
    //     return this._pixiObj.style.stroke.width
    // }
    // set outlineWidth(outlineThickness) {
    //     this._pixiObj.style.outlineWidth = outlineThickness
    // }

    get outline() {
        return this._pixiObj.style.stroke
    }
    set outline(outline) {
        this._pixiObj.style.stroke = outline
    }

    setAnchorCenter(): void {
        this._pixiObj.anchor.set(0.5)
    }
}