import Phaser from "phaser"
import Camera from "@api/Camera"
import { _imageSourceStatus, type ImageSource } from "@api/assets"
import { Vector2 } from "./Vector2"

/** Also what assets.ts paints behind its loading bar, so loading and the game's first frame match. */
export const _defaultColor = '#444444'

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
    /** Repeat the image in a grid, each cell using the original image size and aspect ratio. Switching to this turns on canZoom. */
    Tile: 'tile',
} as const

/** A background image style, see Background.Styles. */
export type BackgroundStyle = typeof Styles[keyof typeof Styles]

/** Background setter props. */
export type BackgroundProps = {
    /** Color of the background. */
    color?: string

    /** The background's image: the name of an image file in your project, like 'sky.png', or a URL. */
    image?: ImageSource

    /** Size/placement style of the background image. */
    style?: BackgroundStyle

    /**
     * Whether the background image honors camera zoom level. When this is true, the
     * background will get larger as you zoom in and smaller as you zoom out. When
     * it's false, the background stays the same size on screen regardless of zoom.
     */
    canZoom?: boolean

    /**
     * Whether the background image follows the camera. When this is true, the
     * background will stay on the screen as the camera moves around. When it's
     * false, the background will be stuck in place in the world.
     */
    followCamera?: boolean
}

/** The game background. TODO: Describe / add docs link */
export default class Background {
    /** Phaser Scene. */
    _scene: Phaser.Scene
    /** API Camera (this._cam._cam for Phaser cam). */
    _cam: Camera
    /** Internal color. */
    _color: string
    /** A TileSprite while style is Tile, an Image otherwise. */
    _img?: Phaser.GameObjects.Image | Phaser.GameObjects.TileSprite
    _src?: string
    _style: BackgroundStyle
    _baseScale: Vector2 = new Vector2(1, 1)
    /** World point the image is centered on. Tracks the view's center while followCamera is on. */
    _anchor: Vector2 = new Vector2(0, 0)

    /**
     * Whether the background image honors camera zoom level. When this is true, the
     * background will get larger as you zoom in and smaller as you zoom out. When
     * it's false, the background stays the same size regardless of zoom.
     * Switching style to Tile turns this on.
     *
     * _Default:_  false
     */
    canZoom: boolean = false

    /**
     * Whether the background image follows the camera. When this is true, the
     * background will stay on the screen as the camera moves around. When it's
     * false, the background will be stuck in place in the world.
     * 
     * _Default:_  true
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

    /** Assign new scene/cam, reset props to default. */
    _reset(scene: Phaser.Scene, cam: Camera) {
        this._scene = scene
        this._cam = cam

        this._color = _defaultColor
        this.color = this._color
        this._style = this.Styles.Fill
        this.style = this._style
        this.clearImage()

        this.canZoom = false
        this.followCamera = true
    }

    /**
     * Set any number of background properties at once.
     * @param props The background properties to set. Any property left out is unchanged.
     */
    set(props: BackgroundProps) {
        if (props.color !== undefined) this.color = props.color
        if (props.image !== undefined) this.image = props.image
        if (props.style !== undefined) this.style = props.style
        if (props.canZoom !== undefined) this.canZoom = props.canZoom
        if (props.followCamera !== undefined) this.followCamera = props.followCamera
    }

    /**
     * Every available background image style, for use with Background.style. For example:
     * 
     * `Background.style = Background.Styles.Fit`
     */
    get Styles() {
        return Styles
    }

    /**
     * The background image's source, if one exists.
     * 
     * _Default:_  undefined
     */
    get image(): string | undefined {
        return this._src
    }
    /**
     * Set the background image.
     * @param src Image source to use for the background. If src is not provided, the background image is cleared instead.
     * 
     * _Default:_  undefined
     */
    set image(src: ImageSource | undefined | null) {
        this._src = src === null ? undefined : src

        if (!src) {
            this.clearImage()
            return
        }

        // Create the background image if it doesn't already exist
        if (!this._img) {
            this._anchor.set(this._cam.width / 2, this._cam.height / 2)
            this._img = this._createImage('__DEFAULT')
        }

        // A project file (preloaded under its own name) or an already-loaded
        // texture applies right away; a bare name matching neither has been
        // reported, and clears the image rather than showing a stale one.
        const status = _imageSourceStatus(this._scene.textures, src)
        if (status === 'ready') {
            this._img.setTexture(src)
            this._updateStyle()
            return
        }
        if (status === 'missing') {
            this.clearImage()
            return
        }

        // Otherwise, loading a new texture from path
        this._scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
            if (!this._img || this._src !== src) return
            this._img.setTexture(src)
            this._updateStyle()
        })
        this._scene.load.image(src, src)
        this._scene.load.start()
    }

    /**
     * Size/placement style of the background image.
     * 
     * _Default:_  'fill'
     */
    get style(): BackgroundStyle {
        return this._style
    }
    set style(style: BackgroundStyle) {
        // if (style === this._style) return
        // Tile defaults to zooming with the world; canZoom can still be turned off after
        if (style === this.Styles.Tile && this._style !== style) this.canZoom = true
        this._style = style
        // Tile draws through a TileSprite, every other style through a plain Image
        if (this._img && (this._img instanceof Phaser.GameObjects.TileSprite) !== (style === this.Styles.Tile)) {
            this._createImage(this._img.texture.key)
        }
        this._updateStyle()
    }

    /**
     * Color of the background.
     * 
     * _Default:_  #444444
     */
    get color(): string {
        return this._color
    }
    /**
     * Set the background color.
     * @param color Color to fill the background with.
     * 
     * _Default:_  #444444
     */
    set color(color: string) {
        this._color = color
        this._cam._cam.setBackgroundColor(color)
    }

    /** (Re)create _img as the kind of object the current style needs, showing the given texture. */
    _createImage(texture: string) {
        this._img?.destroy()
        const cam = this._cam._cam
        this._img = this._style === this.Styles.Tile
            ? this._scene.add.tileSprite(0, 0, cam.width, cam.height, texture)
            : this._scene.add.image(0, 0, texture)
        this._img.setDepth(-Infinity)
        return this._img
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
            this._anchor.set(
                cam.scrollX + cam.width / 2,
                cam.scrollY + cam.height / 2
            )
        }

        this._updateStyle()
    }

    _updateStyle() {
        if (!this._img) return
        const cam = this._cam._cam
        // World units per image pixel: undoes camera zoom unless the image honors it
        const unzoom = this.canZoom ? 1 : 1 / cam.zoom

        if (this._img instanceof Phaser.GameObjects.TileSprite) {
            this._updateTile(this._img, unzoom)
            return
        }

        this._img.setPosition(this._anchor.x, this._anchor.y)
        this._baseScale.fill(1)
        const style = this._style
        const { width, height } = this._img

        if (style === this.Styles.Fit || style === this.Styles.Fill) {
            // Min for fit, max for fill
            const extremum = style === this.Styles.Fit ? Math.min : Math.max
            this._baseScale.fill(extremum(cam.width / width, cam.height / height))
        }

        if (style === this.Styles.Stretch) {
            this._baseScale.set(cam.width / width, cam.height / height)
        }

        this._img.setScale(this._baseScale.x * unzoom, this._baseScale.y * unzoom)
    }

    /**
     * The TileSprite always covers exactly the camera's view, so the grid looks endless;
     * tilePosition then slides the grid so one tile stays centered on the anchor.
     */
    _updateTile(tile: Phaser.GameObjects.TileSprite, unzoom: number) {
        const cam = this._cam._cam
        const viewWidth = cam.width / cam.zoom
        const viewHeight = cam.height / cam.zoom
        // Phaser zooms around the camera's center, so the view stays centered there
        const viewLeft = cam.scrollX + (cam.width - viewWidth) / 2
        const viewTop = cam.scrollY + (cam.height - viewHeight) / 2

        // Size is in image pixels, scale turns those into world units
        const width = Math.ceil(viewWidth / unzoom)
        const height = Math.ceil(viewHeight / unzoom)
        if (tile.width !== width || tile.height !== height) tile.setSize(width, height)
        tile.setOrigin(0, 0)
        tile.setPosition(viewLeft, viewTop)
        tile.setScale(unzoom)

        // Image pixel at the view's corner, chosen so the anchor lands mid-tile.
        // Wrapped to one tile so it stays small no matter how far the camera roams.
        const { width: tileWidth, height: tileHeight } = tile.frame
        const wrap = (n: number, size: number) => ((n % size) + size) % size
        tile.setTilePosition(
            wrap(tileWidth / 2 - (this._anchor.x - viewLeft) / unzoom, tileWidth),
            wrap(tileHeight / 2 - (this._anchor.y - viewTop) / unzoom, tileHeight)
        )
    }
}
