import type { GameObjectProps } from "./mixins/index"
import { scene, allPositionables } from "./core"
import GameObject from "./GameObject"
import Phaser from "phaser"

type LabelProps = GameObjectProps & {
    /** Text content of the label. */
    text?: string | string[]
    /** Font size. */
    size?: number
    /** Font family. */
    font?: string
    /** Fill color. */
    color?: string
}

export default class Label extends GameObject {
    readonly _label: Phaser.GameObjects.Text

    _size: number
    _font: string
    _color: string

    constructor(props?: LabelProps) {
        super()

        const text = scene.add.text(0, 0, 'Label') // Phaser Text object
        this._refObj = text // Reference to Phaser object used in mixins
        this._label = text // Reference to Phaser object used within this class (for readability)

        this._label.setOrigin(0.5)

        this.text = props?.text ?? 'Label'

        this._size = props?.size ?? 32
        this.size = this._size

        this._font = props?.font ?? 'sans-serif'
        this.font = this._font

        this._color = props?.color ?? '#fff'
        this.color = this._color

        // Set mixin props
        this._initMixins(props)

        // Label may flicker on creation without this delay..?
        //this.queueShow()

        allPositionables.push(this)
    }

    /** Text content of the label. */
    get text(): string {
        return this._label.text
    }
    set text(text: string | string[]) {
        this._label.setText(text)
    }

    // Have size support CSS strings like Phaser.Text.setFontSize, but test first
    /** Font size. */
    get size(): number {
        return this._size
    }
    set size(size: number) {
        this._size = size
        this._label.setFontSize(size)
    }

    // TODO
    /** Font family. */
    get font(): string {
        return this._font
    }
    set font(font: string) {
        this._label.setFontFamily(font)
        this._font = font
    }

    /** Fill color. */
    get color(): string {
        return this._color
    }
    set color(color: string) {
        this._label.setColor(color)
        this._color = color
    }
}