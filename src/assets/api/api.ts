import { camera, screen, timer, mouse, forever, repeat, repeatUntil, after, every, keyPressed, keyJustPressed, print, play, pause, setBackgroundColor } from "./core";
import { random, randomFloat, randomX, randomY, randomPosition, deg2rad, rad2deg, sin, cos, tan, atan2, clamp } from "./utility";
import { Point, Vector2 } from "./interfaces";

import Sprite from "./Sprite"
import Rectangle from "./Rectangle"
import Label from "./Label"
import Line from "./Line"
import HLine from "./HLine"

const api = {
    Sprite, Rectangle, Label, Line, HLine, Vector2, Point,
    timer, screen, camera, mouse,
    forever, repeat, repeatUntil, after, every,
    keyPressed, keyJustPressed, print, play, pause, setBackgroundColor,
    random, randomFloat, randomX, randomY, randomPosition,
    deg2rad, rad2deg, sin, cos, tan, atan2, clamp,
    sqrt: Math.sqrt,
    min: Math.min,
    max: Math.max,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
    PI: Math.PI,
}
export default api