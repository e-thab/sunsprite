import { Vector2 } from "./Vector2"
import Camera from "./Camera"

// Every value here is in screen pixels, measured from the center of the screen (y up), and is
// unaffected by where the camera is or how far it's zoomed. That's the space UI objects live in,
// and the one a world object's screenSpace converts to.

/** Game screen reference. */
export default class Screen {
    #cam: Camera

    constructor(cam: Camera) {
        this.#cam = cam
    }

    /**
     * Game screen width in pixels. Camera zoom doesn't change it.
     * @readonly
     */
    get width(): number {
        // The Phaser camera's viewport, not Camera.width, which shrinks as the camera zooms in
        return this.#cam._cam.width
    }
    /**
     * Game screen height in pixels. Camera zoom doesn't change it.
     * @readonly
     */
    get height(): number {
        return this.#cam._cam.height
    }

    /**
     * Y value of the top edge of the game screen, in pixels from the center of the screen.
     *
     * **NOTE:** This value changes with screen size, *not* camera position or zoom.
     * Use it to place UI objects, as in `title.y = Screen.top - 40`, or with a world
     * object's screenSpace, as in `rect.screenSpace.y = Screen.top - 40`. Using
     * `rect.y = Screen.top` on a world object only puts rect at the top edge of the
     * screen if the camera is at [0, 0] and zoom 1.
     *
     * @readonly
     */
    get top(): number {
        return this.height / 2
    }

    /**
     * Y value of the bottom edge of the game screen, in pixels from the center of the screen.
     *
     * **NOTE:** This value changes with screen size, *not* camera position or zoom.
     * Use it to place UI objects, as in `hint.y = Screen.bottom + 40`, or with a world
     * object's screenSpace, as in `rect.screenSpace.y = Screen.bottom + 40`. Using
     * `rect.y = Screen.bottom` on a world object only puts rect at the bottom edge of
     * the screen if the camera is at [0, 0] and zoom 1.
     *
     * @readonly
     */
    get bottom(): number {
        return -this.height / 2
    }

    /**
     * X value of the left edge of the game screen, in pixels from the center of the screen.
     *
     * **NOTE:** This value changes with screen size, *not* camera position or zoom.
     * Use it to place UI objects, as in `menu.x = Screen.left + 100`, or with a world
     * object's screenSpace, as in `rect.screenSpace.x = Screen.left + 100`. Using
     * `rect.x = Screen.left` on a world object only puts rect at the left edge of the
     * screen if the camera is at [0, 0] and zoom 1.
     *
     * @readonly
     */
    get left(): number {
        return -this.width / 2
    }

    /**
     * X value of the right edge of the game screen, in pixels from the center of the screen.
     *
     * **NOTE:** This value changes with screen size, *not* camera position or zoom.
     * Use it to place UI objects, as in `menu.x = Screen.right - 100`, or with a world
     * object's screenSpace, as in `rect.screenSpace.x = Screen.right - 100`. Using
     * `rect.x = Screen.right` on a world object only puts rect at the right edge of
     * the screen if the camera is at [0, 0] and zoom 1.
     *
     * @readonly
     */
    get right(): number {
        return this.width / 2
    }

    /**
     * Position of the top left corner of the game screen, in pixels from the center of the screen.
     *
     * **NOTE:** This value changes with screen size, *not* camera position or zoom.
     * Use it to place UI objects, as in `scoreLabel.goTo(Screen.topLeft, 'topLeft')`, or a
     * world object by its screen position, as in `rect.goToScreen(Screen.topLeft, 'topLeft')`.
     *
     * @readonly
     */
    get topLeft(): Vector2 {
        return new Vector2(this.left, this.top)
    }

    /**
     * Position of the center of the top edge of the game screen, in pixels from the center of the screen.
     *
     * **NOTE:** This value changes with screen size, *not* camera position or zoom.
     * Use it to place UI objects, as in `title.goTo(Screen.topCenter, 'topCenter')`, or a
     * world object by its screen position, as in `rect.goToScreen(Screen.topCenter, 'topCenter')`.
     *
     * @readonly
     */
    get topCenter(): Vector2 {
        return new Vector2(0, this.top)
    }

    /**
     * Position of the top right corner of the game screen, in pixels from the center of the screen.
     *
     * **NOTE:** This value changes with screen size, *not* camera position or zoom.
     * Use it to place UI objects, as in `scoreLabel.goTo(Screen.topRight, 'topRight')`, or a
     * world object by its screen position, as in `rect.goToScreen(Screen.topRight, 'topRight')`.
     *
     * @readonly
     */
    get topRight(): Vector2 {
        return new Vector2(this.right, this.top)
    }

    /**
     * Position of the bottom left corner of the game screen, in pixels from the center of the screen.
     *
     * **NOTE:** This value changes with screen size, *not* camera position or zoom.
     * Use it to place UI objects, as in `healthBar.goTo(Screen.bottomLeft, 'bottomLeft')`, or a
     * world object by its screen position, as in `rect.goToScreen(Screen.bottomLeft, 'bottomLeft')`.
     *
     * @readonly
     */
    get bottomLeft(): Vector2 {
        return new Vector2(this.left, this.bottom)
    }

    /**
     * Position of the center of the bottom edge of the game screen, in pixels from the center of the screen.
     *
     * **NOTE:** This value changes with screen size, *not* camera position or zoom.
     * Use it to place UI objects, as in `hint.goTo(Screen.bottomCenter, 'bottomCenter')`, or a
     * world object by its screen position, as in `rect.goToScreen(Screen.bottomCenter, 'bottomCenter')`.
     *
     * @readonly
     */
    get bottomCenter(): Vector2 {
        return new Vector2(0, this.bottom)
    }

    /**
     * Position of the bottom right corner of the game screen, in pixels from the center of the screen.
     *
     * **NOTE:** This value changes with screen size, *not* camera position or zoom.
     * Use it to place UI objects, as in `minimap.goTo(Screen.bottomRight, 'bottomRight')`, or a
     * world object by its screen position, as in `rect.goToScreen(Screen.bottomRight, 'bottomRight')`.
     *
     * @readonly
     */
    get bottomRight(): Vector2 {
        return new Vector2(this.right, this.bottom)
    }

    /**
     * Position of the center of the left edge of the game screen, in pixels from the center of the screen.
     *
     * **NOTE:** This value changes with screen size, *not* camera position or zoom.
     * Use it to place UI objects, as in `menu.goTo(Screen.centerLeft, 'centerLeft')`, or a
     * world object by its screen position, as in `rect.goToScreen(Screen.centerLeft, 'centerLeft')`.
     *
     * @readonly
     */
    get centerLeft(): Vector2 {
        return new Vector2(this.left, 0)
    }

    /**
     * Position of the center of the right edge of the game screen, in pixels from the center of the screen.
     *
     * **NOTE:** This value changes with screen size, *not* camera position or zoom.
     * Use it to place UI objects, as in `menu.goTo(Screen.centerRight, 'centerRight')`, or a
     * world object by its screen position, as in `rect.goToScreen(Screen.centerRight, 'centerRight')`.
     *
     * @readonly
     */
    get centerRight(): Vector2 {
        return new Vector2(this.right, 0)
    }

    _setCam(cam: Camera) {
        this.#cam = cam
    }
}
