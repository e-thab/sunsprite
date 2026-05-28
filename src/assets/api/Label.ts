import type { GameObjectProps } from "./mixins"
import { scene, allPositionables } from "./core"
import GameObject from "./GameObject"
import Phaser from "phaser"

type LabelProps = GameObjectProps & {
    text?: string,
    /* ... */
}

export default class Label extends GameObject {
    readonly _label: Phaser.GameObjects.Text

    constructor(props?: LabelProps) {
        super()

        const text = scene.add.text(0, 0, 'Label' /*, { align: 'center' }*/) // Phaser Text object
        this._refObj = text // Reference to Phaser object used in mixins
        this._label = text // Reference to Phaser object used within this class (for readability)

        this.text = props?.text ?? 'Label'

        // Set mixin props
        this.initMixins(props)

        // Label may flicker on creation without this delay..?
        //this.queueShow()

        allPositionables.push(this)
    }

    get text(): string {
        return this._label.text
    }
    set text(text: string | string[]) {
        this._label.setText(text)
    }
}