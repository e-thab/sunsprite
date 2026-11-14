import { ScreenSpaced, _drawOnUiCamera } from "./mixins"
import type { Returnable } from "@api/types"
import type { Vector2, Vector2Like } from "@api/Vector2"
import Sprite from "./Sprite"
import Label from "./Label"
import Circle from "./Circle"
import Rectangle from "./Rectangle"
import Line from "./Line"

// The UI versions of the world object classes, reached by user scripts as UI.Sprite, UI.Label, etc.
// Each is its world class with ScreenSpaced layered on: same props, same members, but positioned
// and sized in screen pixels, and drawn by the UI camera (see core.ts's create()) so the camera's
// position and zoom never affect them. The exported names are what the declaration generator
// keys them by (scripts/api-codegen/sources.ts); apiLib.ts declares them inside `namespace UI`.

/**
 * A Sprite that stays on the screen: its position and size are in screen pixels, and moving or
 * zooming the camera doesn't affect it. Created in the center of the screen at its image's own
 * size. Always shows in front of world objects.
 *
 * @default width the image's width (`32` with no src)
 * @default height the image's height (`32` with no src)
 */
export class UISprite extends ScreenSpaced(Sprite) {}

/**
 * A Label that stays on the screen: its position and size are in screen pixels, and moving or
 * zooming the camera doesn't affect it. Created in the center of the screen. Always shows in
 * front of world objects.
 */
export class UILabel extends ScreenSpaced(Label) {}

/**
 * A Circle that stays on the screen: its position and size are in screen pixels, and moving or
 * zooming the camera doesn't affect it. Created in the center of the screen. Always shows in
 * front of world objects.
 */
export class UICircle extends ScreenSpaced(Circle) {}

/**
 * A Rectangle that stays on the screen: its position and size are in screen pixels, and moving
 * or zooming the camera doesn't affect it. Created in the center of the screen. Always shows in
 * front of world objects.
 */
export class UIRectangle extends ScreenSpaced(Rectangle) {}

/**
 * A Line that stays on the screen: its end points are in screen pixels, and moving or zooming
 * the camera doesn't affect it. Always shows in front of world objects.
 */
export class UILine extends Line {
    constructor(...args: ConstructorParameters<typeof Line>) {
        super(...args)
        _drawOnUiCamera(this._refObj)
    }

    /** Position of end point A on the screen, in pixels from its center. */
    get pointA(): Vector2 {
        return super.pointA
    }
    set pointA(pointA: Returnable<Vector2Like>) {
        super.pointA = pointA
    }

    /** Position of end point B on the screen, in pixels from its center. */
    get pointB(): Vector2 {
        return super.pointB
    }
    set pointB(pointB: Returnable<Vector2Like>) {
        super.pointB = pointB
    }
}

/** UI objects: positioned and sized in screen pixels, unaffected by the camera. */
export const UI = {
    Sprite: UISprite,
    Label: UILabel,
    Circle: UICircle,
    Rectangle: UIRectangle,
    Line: UILine,
}
