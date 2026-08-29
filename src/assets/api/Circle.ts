import GameObject from "./GameObject"
import type { GameObjectProps } from "./mixins"
import { allPositionables, scene } from "./core"
import Phaser from 'phaser'

function getPhaserColor(colorString: string) {
    return Phaser.Display.Color.HexStringToColor(colorString).color
}

/**
 * Circle class
 */
type CircleProps = GameObjectProps & {
    /** The fill color. */
    color?: string
    // outlineColor?: string
    /** The distance from the center of the circle to the edge. */
    radius?: number
}

export default class Circle extends GameObject {
    // readonly _rect: Phaser.GameObjects.Rectangle
    readonly _graphics: Phaser.GameObjects.Graphics
    _color: string
    _phaserColor: number = 0xFFFFFF
    _radius: number = 50
    _hitArea: Phaser.Geom.Circle

    // What should happen when supplying contradictory size/place properties?
    // Just pick one to overwrite and push a warning to the output panel?
    constructor(props?: CircleProps) {
        super()

        this._hitArea = new Phaser.Geom.Circle(0, 0, 50)
        const gfx = scene.add.graphics()
            .fillStyle(this._phaserColor)
            .fillCircle(0, 0, 50)
            .setInteractive(this._hitArea, Phaser.Geom.Circle.Contains)
            // .on('pointerover', () => console.log('p'))
        
        this._refObj = gfx // Reference to Phaser object used in mixins
        this._graphics = gfx // Reference to Phaser object used within this class (for readability)

        this._color = props?.color ?? '#fff'
        this.color = this._color

        if (props?.radius != null) this.radius = props.radius

        // console.log('circle', circle.input?.draggable)
        // scene.input.setDraggable(circle, true)

        // Set mixin props
        this._initMixins(props)

        // Rectangles may flicker on creation without this delay
        this._queueShow()
        
        allPositionables.push(this)
    }

    /** The fill color. */
    get color() {
        return this._color
    }
    set color(color: string) {
        // May move color logic to a mixin
        // Also need to implement support for CSS color names for phaser objects
        this._color = color
        this._updateFill()
    }

    /** Transparency, decimal value that ranges from 0.0 (transparent) to 1.0 (opaque). */
    get alpha() {
        return this._graphics.alpha
    }
    set alpha(alpha: number) {
        this._alpha = alpha
        this._graphics.setAlpha(alpha)
    }

    /** The distance from the center of the circle to the edge. */
    get radius() {
        return this._radius
    }
    set radius(radius: number) {
        this._radius = radius
        this._hitArea.radius = radius
        this._updateFill()
    }

    _updateFill() {
        this._graphics.clear()
        this._graphics.fillStyle(getPhaserColor(this.color), this._alpha)
        this._graphics.fillCircle(0, 0, this._radius)
    }
}