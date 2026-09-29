import Phaser from "phaser"
import Camera from "@api/Camera"
import { Vector2 } from "./Vector2"

const _defaultColor = '#444444'

/** Every background image style. The one source of truth: BackgroundStyle and Background.Styles both derive from this. */
const Styles = {
    /** Place image in the center at its original size, screen size does not affect image size. */
    Center: 'center',
    /** Size image to fill the screen, keeping its aspect ratio. */
    Fill: 'fill',
    /** Size image to fit within the screen, keeping its aspect ratio. */
    Fit: 'fit',
    /** Stretch image to match the screen's aspect ratio. */
    Stretch: 'stretch',
    /** Repeat the image in a grid, each cell using the original image size and aspect ratio. */
    Tile: 'tile',
} as const

/** A background image style, see Background.Styles. */
export type BackgroundStyle = typeof Styles[keyof typeof Styles]

/** Singleton game background reference */
export default class Background {
    _scene: Phaser.Scene
    _cam: Camera
    _color: string
    _img?: Phaser.GameObjects.Image
    _src?: string
    _style: BackgroundStyle
    _baseScale: Vector2 = new Vector2(1, 1)

    /**
     * Whether the background image ignores camera zoom level. When this is true,
     * the background stays the same size regardless of zoom. When it's false, the
     * background will get larger as you zoom in and smaller as you zoom out.
     */
    ignoreZoom: boolean = true

    /**
     * Whether the background image follows the camera. When this is true, the
     * background will stay on the screen as the camera moves around. When it's
     * false, the background will be stuck in place in the world.
     */
    followCamera: boolean = true

    constructor(scene: Phaser.Scene, cam: Camera) {
        this._scene = scene
        this._cam = cam

        this._color = _defaultColor
        this.color = this._color

        this._style = this.Styles.Fill
        this.style = this._style
    }

    _reset(scene: Phaser.Scene, cam: Camera) {
        this._scene = scene
        this._cam = cam
        this._color = _defaultColor
        this.color = this._color
        this.clearImage()
    }

    /**
     * Every available background image style, for use with Background.style. For example:
     * 
     * Background.style = Background.Styles.Fit
     */
    get Styles() {
        return Styles
    }

    /** The background image's source, if one exists. */
    get image(): string | undefined {
        return this._src
    }
    /**
     * Set the background image.
     * @param src Image source to use for the background. If src is not provided, the background image is cleared instead.
     */
    set image(src: string | undefined | null) {
        this._src = src === null ? undefined : src

        if (!src) {
            this.clearImage()
            return
        }

        // Create the background image if it doesn't already exist
        if (!this._img) {
            this._img = this._scene.add.image(this._cam.width / 2, this._cam.height / 2, '__DEFAULT')
            this._img.setDepth(-Infinity)
        }

        // If using a key, apply existing texture
        if (this._scene.textures.exists(src)) {
            this._img.setTexture(src)
            this._updateStyle()
            return
        }

        // Otherwise, loading a new texture from path
        this._scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
            if (!this._img) return
            this._img.setTexture(src)
            this._updateStyle()
        })
        this._scene.load.image(src, src)
        this._scene.load.start()
    }

    /** Current background style */
    get style(): BackgroundStyle {
        return this._style
    }
    set style(style: BackgroundStyle) {
        // if (style === this._style) return
        this._style = style
        this._updateStyle()
    }

    /** Background color, default is #444444. */
    get color(): string {
        return this._color
    }
    /**
     * Set the background color.
     * @param color Color to fill the background with.
     */
    set color(color: string) {
        this._color = color
        this._cam._cam.setBackgroundColor(color)
    }

    /** Removes the background image if one exists. */
    clearImage() {
        if (!this._img) return
        this._img.destroy()
        this._img = undefined
    }

    _update() {
        if (!this._img) return
        const cam = this._cam._cam

        if (this.followCamera) {
            this._img.setPosition(
                cam.scrollX + cam.width / 2,
                cam.scrollY + cam.height / 2
            )
        }

        this._updateStyle()
        if (this.ignoreZoom) {
            // this._img.scale = this._baseScale / cam.zoom
            this._img.setScale(
                this._baseScale.x / cam.zoom,
                this._baseScale.y / cam.zoom
            )
        }
    }

    _updateStyle() {
        if (!this._img) return
        this._img.scale = 1
        this._baseScale.fill(1)
        const style = this._style

        if (style === this.Styles.Center) {

        }

        const cam = this._cam._cam
        const { width, height } = this._img

        if (style === this.Styles.Fit || style === this.Styles.Fill) {
            // Min for fit, max for fill
            const extremum = style === this.Styles.Fit ? Math.min : Math.max
            const scale = extremum(cam.width / width, cam.height / height)

            this._baseScale.fill(scale)
            this._img.setScale(scale)
        }

        if (style === this.Styles.Stretch) {
            const [x, y] = [cam.width / width, cam.height / height]
            this._baseScale.set(x, y)
            this._img.setScale(x, y)
        }
    }
}
