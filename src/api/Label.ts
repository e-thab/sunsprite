import type { GameObjectProps } from "./mixins"
import { scene, resizeReactors } from "@api/core"
import GameObject from "@api/GameObject"
import { deg2rad } from "@api/utility"
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
    /**
     * Which side of the label stays in place when its text, size, or font changes:
     * 'left', 'center', or 'right'. Lines of multi-line text line up on that side too.
     * @default `'center'`
     */
    alignH?: 'left' | 'center' | 'right'
    /**
     * Which edge of the label stays in place when its text, size, or font changes:
     * 'top', 'center', or 'bottom'.
     * @default `'center'`
     */
    alignV?: 'top' | 'center' | 'bottom'
}

/** Factor applied to width to reach each horizontal alignment from the label's center. */
const ALIGN_X_OFFSETS = { left: -1/2, center: 0, right: 1/2 } as const
/** Factor applied to height to reach each vertical alignment from the label's center. */
const ALIGN_Y_OFFSETS = { top: 1/2, center: 0, bottom: -1/2 } as const

export default class Label extends GameObject {
    readonly _label: Phaser.GameObjects.Text

    _size: number
    _font: string
    _color: string
    _alignH: 'left' | 'center' | 'right' = 'center'
    _alignV: 'top' | 'center' | 'bottom' = 'center'

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

        this.alignH = props?.alignH ?? 'center'
        this.alignV = props?.alignV ?? 'center'

        // Set mixin props
        this._initMixins(props)

        // Label may flicker on creation without this delay..?
        //this.queueShow()

        resizeReactors.push(this)
    }

    /** Text content of the label. */
    get text(): string {
        return this._label.text
    }
    set text(text: string | string[]) {
        this._holdAlignedPoint(() => this._label.setText(text))
    }

    // Have size support CSS strings like Phaser.Text.setFontSize, but test first
    /** Font size. */
    get size(): number {
        return this._size
    }
    set size(size: number) {
        this._size = size
        this._holdAlignedPoint(() => this._label.setFontSize(size))
    }

    // TODO
    /** Font family. */
    get font(): string {
        return this._font
    }
    set font(font: string) {
        this._holdAlignedPoint(() => this._label.setFontFamily(font))
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

    /**
     * Which side of the label stays in place when its text, size, or font changes:
     * 'left', 'center', or 'right'. Lines of multi-line text line up on that side too.
     *
     * This doesn't move the label; place it by the same side to start with, e.g.
     *
     * ```js
     * score.alignH = 'left'
     * score.left = Screen.left + 20
     * ```
     * @default `'center'`
     */
    get alignH(): 'left' | 'center' | 'right' {
        return this._alignH
    }
    set alignH(alignH: 'left' | 'center' | 'right') {
        if (!(alignH in ALIGN_X_OFFSETS)) throw new Error(`Bad alignH: ${alignH} (use 'left', 'center', or 'right')`)
        this._alignH = alignH
        // Only rearranges lines within the text's current width, so its size doesn't change
        this._label.setAlign(alignH)
    }

    /**
     * Which edge of the label stays in place when its text, size, or font changes:
     * 'top', 'center', or 'bottom'.
     *
     * This doesn't move the label; place it by the same edge to start with, e.g.
     *
     * ```js
     * log.alignV = 'top'
     * log.top = Screen.top - 20
     * ```
     * @default `'center'`
     */
    get alignV(): 'top' | 'center' | 'bottom' {
        return this._alignV
    }
    set alignV(alignV: 'top' | 'center' | 'bottom') {
        if (!(alignV in ALIGN_Y_OFFSETS)) throw new Error(`Bad alignV: ${alignV} (use 'top', 'center', or 'bottom')`)
        this._alignV = alignV
    }

    /**
     * Where the aligned point (e.g. the center of the left edge, for alignH 'left') sits
     * relative to the label's center. It's on the label's own edges, turned with it, so
     * rotated text grows along its own baseline rather than the screen's axes.
     */
    _alignedOffset(): [number, number] {
        const ax = this.width * ALIGN_X_OFFSETS[this._alignH]
        const ay = this.height * ALIGN_Y_OFFSETS[this._alignV]
        const radians = deg2rad(this._rotation - this._rotationOffset)
        const cos = Math.cos(radians)
        const sin = Math.sin(radians)
        return [ax * cos - ay * sin, ax * sin + ay * cos]
    }

    /** Runs a change that resizes the text, then moves the label so its aligned point stays put. */
    _holdAlignedPoint(change: () => void) {
        if (this._alignH === 'center' && this._alignV === 'center') {
            change()
            return
        }
        const [beforeX, beforeY] = this._alignedOffset()
        change()
        const [afterX, afterY] = this._alignedOffset()
        if (beforeX !== afterX || beforeY !== afterY) {
            this.position = [this.x + beforeX - afterX, this.y + beforeY - afterY]
        }
    }
}