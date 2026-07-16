import GameObject from "./GameObject"
import type { GameObjectProps } from "./mixins"
import { allPositionables, scene } from "./core"
import Phaser from 'phaser'

/**
 * Circle class
 */

type CircleProps = GameObjectProps & {
    color?: string
    // outlineColor?: string
    radius?: number
}

export default class Circle extends GameObject {
    // readonly _rect: Phaser.GameObjects.Rectangle
    readonly _graphics: Phaser.GameObjects.Graphics
    _color: string
    _radius: number = 50

    // What should happen when supplying contradictory size/place properties?
    // Just pick one to overwrite and push a warning to the output panel?
    constructor(props?: CircleProps) {
        super()

        const hitArea = new Phaser.Geom.Circle(0, 0, 50)
        const gfx = scene.add.graphics()
            .fillStyle(0xFFFFFF)
            .fillCircle(0, 0, 50)
            .setInteractive(hitArea, Phaser.Geom.Circle.Contains)
            .on('pointerover', () => console.log('p'))
        
        this._refObj = gfx // Reference to Phaser object used in mixins
        this._graphics = gfx // Reference to Phaser object used within this class (for readability)

        this._color = props?.color ?? '#fff'
        this.color = this._color

        // console.log('circle', circle.input?.draggable)
        // scene.input.setDraggable(circle, true)

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
        this._graphics.clear()
        this._graphics.fillCircle(this._graphics.x, this._graphics.y, this.radius)
    }

    get radius() {
        return this._radius
    }
    set radius(radius: number) {
        this._radius = radius
        this._graphics.clear()
        this._graphics.fillCircle(this._graphics.x, this._graphics.y, radius)
    }
}