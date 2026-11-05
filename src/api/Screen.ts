import { Vector2 } from "./Vector2"
import Camera from "./Camera"

/** Game screen reference. */
export default class Screen {
    #cam: Camera

    constructor(cam: Camera) {
        this.#cam = cam
    }
    
    /**
     * Game screen width.
     * @readonly
     */
    get width(): number {
        return this.#cam.width
    }
    /**
     * Game screen height.
     * @readonly
     */
    get height(): number {
        return this.#cam.height
    }
    
    /**
     * Y value of the top edge of the game screen, in screen-space coordinates.
     * 
     * **NOTE:** This value changes with screen size, *not* camera position.
     * It's meant to be used with screen-based position setters, as in
     * `rect.screenY = Screen.top`. Using `rect.y = Screen.top` only puts
     * rect at the top edge of the screen if Camera.y is 0.
     * 
     * @readonly
     */
    get top(): number {
        return this.#cam.height / 2
    }

    /**
     * Y value of the bottom edge of the game screen, in screen-space coordinates.
     * 
     * **NOTE:** This value changes with screen size, *not* camera position.
     * It's meant to be used with screen-based position setters, as in
     * `rect.screenY = Screen.bottom`. Using `rect.y = Screen.bottom` only puts
     * rect at the bottom edge of the screen if Camera.y is 0.
     * 
     * @readonly
     */
    get bottom(): number {
        return -this.#cam.height / 2
    }

    /**
     * X value of the left edge of the game screen, in screen-space coordinates.
     * 
     * **NOTE:** This value changes with screen size, *not* camera position.
     * It's meant to be used with screen-based position setters, as in
     * `rect.screenX = Screen.left`. Using `rect.x = Screen.left` only puts
     * rect at the left edge of the screen if Camera.x is 0.
     * 
     * @readonly
     */
    get left(): number {
        return -this.#cam.width / 2
    }

    /**
     * X value of the right edge of the game screen, in screen-space coordinates.
     * 
     * **NOTE:** This value changes with screen size, *not* camera position.
     * It's meant to be used with screen-based position setters, as in
     * `rect.screenX = Screen.right`. Using `rect.x = Screen.right` only puts
     * rect at the right edge of the screen if Camera.x is 0.
     * 
     * @readonly
     */
    get right(): number {
        return this.#cam.width / 2
    }

    /**
     * Position of the top left corner of the game screen, in screen-space coordinates.
     * 
     * **NOTE:** This value changes with screen size, *not* camera position.
     * It's meant to be used with screen-based position setters, as in
     * `rect.screenTopLeft = Screen.topLeft`. Using `rect.topLeft = Screen.topLeft` only puts
     * rect at the top left corner of the screen if Camera.position is [0, 0].
     * 
     * @readonly
     */
    get topLeft(): Vector2 {
        return new Vector2(this.left, this.top)
    }

    /**
     * Position of the center of the top edge of the game screen, in screen-space coordinates.
     * 
     * **NOTE:** This value changes with screen size, *not* camera position.
     * It's meant to be used with screen-based position setters, as in
     * `rect.screenTopCenter = Screen.topCenter`. Using `rect.topCenter = Screen.topCenter` only puts
     * rect at the center of the top edge of the screen if Camera.position is [0, 0].
     * 
     * @readonly
     */
    get topCenter(): Vector2 {
        return new Vector2(0, this.top)
    }

    /**
     * Position of the top right corner of the game screen, in screen-space coordinates.
     * 
     * **NOTE:** This value changes with screen size, *not* camera position.
     * It's meant to be used with screen-based position setters, as in
     * `rect.screenTopRight = Screen.topRight`. Using `rect.topRight = Screen.topRight` only puts
     * rect at the top right corner of the screen if Camera.position is [0, 0].
     * 
     * @readonly
     */
    get topRight(): Vector2 {
        return new Vector2(this.right, this.top)
    }

    /**
     * Position of the bottom left corner of the game screen, in screen-space coordinates.
     * 
     * **NOTE:** This value changes with screen size, *not* camera position.
     * It's meant to be used with screen-based position setters, as in
     * `rect.screenBottomLeft = Screen.bottomLeft`. Using `rect.bottomLeft = Screen.bottomLeft` only puts
     * rect at the bottom left corner of the screen if Camera.position is [0, 0].
     * 
     * @readonly
     */
    get bottomLeft(): Vector2 {
        return new Vector2(this.left, this.bottom)
    }

    /**
     * Position of the center of the bottom edge of the game screen, in screen-space coordinates.
     * 
     * **NOTE:** This value changes with screen size, *not* camera position.
     * It's meant to be used with screen-based position setters, as in
     * `rect.screenBottomCenter = Screen.bottomCenter`. Using `rect.bottomCenter = Screen.bottomCenter` only puts
     * rect at the center of the bottom edge of the screen if Camera.position is [0, 0].
     * 
     * @readonly
     */
    get bottomCenter(): Vector2 {
        return new Vector2(0, this.bottom)
    }

    /**
     * Position of the bottom right corner of the game screen, in screen-space coordinates.
     * 
     * **NOTE:** This value changes with screen size, *not* camera position.
     * It's meant to be used with screen-based position setters, as in
     * `rect.screenBottomRight = Screen.bottomRight`. Using `rect.bottomRight = Screen.bottomRight` only puts
     * rect at the bottom right corner of the screen if Camera.position is [0, 0].
     * 
     * @readonly
     */
    get bottomRight(): Vector2 {
        return new Vector2(this.right, this.bottom)
    }

    /**
     * Position of the center of the left edge of the game screen, in screen-space coordinates.
     * 
     * **NOTE:** This value changes with screen size, *not* camera position.
     * It's meant to be used with screen-based position setters, as in
     * `rect.screenCenterLeft = Screen.centerLeft`. Using `rect.centerLeft = Screen.centerLeft` only puts
     * rect at the center of the left edge of the screen if Camera.position is [0, 0].
     * 
     * @readonly
     */
    get centerLeft(): Vector2 {
        return new Vector2(this.left, 0)
    }

    /**
     * Position of the center of the right edge of the game screen, in screen-space coordinates.
     * 
     * **NOTE:** This value changes with screen size, *not* camera position.
     * It's meant to be used with screen-based position setters, as in
     * `rect.screenCenterRight = Screen.centerRight`. Using `rect.centerRight = Screen.centerRight` only puts
     * rect at the center of the right edge of the screen if Camera.position is [0, 0].
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