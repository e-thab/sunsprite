import GameObject from "./GameObject"
import type { GameObjectProps } from "./mixins"
import { allPositionables, game, scene } from "./corephaser"
import Phaser from 'phaser'

/**
 * Rectangle class, using position setters from that one WoofJS project
 */

type RectangleProps = GameObjectProps & {
    color?: string
    outlineColor?: string
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
        
        this._color = props?.color ?? '#fff'
        this.color = this._color

        // TEMP
        // this._rect.on('pointerover', () => this.color = '#f00')
        // this._rect.on('pointerout', () => this.color = '#fff')

        // Set mixin props
        this.initPositionable(props)
        this.initSizable(props)
        this.initRotatable(props)
        this.initViewable(props)
        
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