import GameObject from "./GameObject"
import type { GameObjectProps } from "./mixins"
import { allPositionables, camera, game, getGamePoint, scene, screen } from "./core"
import Phaser from 'phaser'

/**
 * Rectangle class, using position setters from that one WoofJS project
 */

type RectangleProps = GameObjectProps & {
    color?: string
    // outlineColor?: string
}

export default class Rectangle extends GameObject {
    readonly _rect: Phaser.GameObjects.Rectangle
    _color: string

	// What should happen when supplying contradictory size/place properties?
	// Just pick one to overwrite and push a warning to the output panel?
	constructor(props?: RectangleProps) {
        super()

        const rect = scene.add.rectangle() // Phaser Rectangle
        this._refObj = rect // Reference to Phaser object used in mixins
        this._rect = rect   // Reference to Phaser object used within this class (for readability)

        console.log('rect', rect.input?.draggable)

        this._color = props?.color ?? '#fff'
        this.color = this._color

        // Set mixin props
        this.initMixins(props)

        // Rectangles may flicker on creation without this delay
        this.queueShow()
        
        allPositionables.push(this)
	}

    get color() {
        return this._color
    }
    set color(color: string) {
        // May move color logic to a mixin
        // Also need to implement support for CSS color names for phaser objects
        this._color = color
        // this._rect.fill(color)
        const phaserColor = Phaser.Display.Color.HexStringToColor(color).color
        this._rect.setFillStyle(phaserColor)
    }
}