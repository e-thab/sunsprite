import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_DIR = path.resolve(__dirname, '../../src/assets/api')

export function apiPath(...segments: string[]): string {
    return path.join(API_DIR, ...segments)
}

export const MIXINS = [
    { file: apiPath('mixins', 'Positionable.ts'), typeName: 'PositionableProps', functionName: 'Positionable' },
    { file: apiPath('mixins', 'Sizable.ts'), typeName: 'SizableProps', functionName: 'Sizable' },
    { file: apiPath('mixins', 'Rotatable.ts'), typeName: 'RotatableProps', functionName: 'Rotatable' },
    { file: apiPath('mixins', 'Viewable.ts'), typeName: 'ViewableProps', functionName: 'Viewable' },
    { file: apiPath('mixins', 'Interactable.ts'), typeName: 'InteractableProps', functionName: 'Interactable' },
    { file: apiPath('mixins', 'Timeable.ts'), typeName: undefined, functionName: 'Timeable' },
] as const

export const CONCRETE_CLASSES = [
    { file: apiPath('Sprite.ts'), typeName: 'SpriteProps', className: 'Sprite' },
    { file: apiPath('Rectangle.ts'), typeName: 'RectangleProps', className: 'Rectangle' },
    { file: apiPath('Circle.ts'), typeName: 'CircleProps', className: 'Circle' },
    { file: apiPath('Label.ts'), typeName: 'LabelProps', className: 'Label' },
    { file: apiPath('Line.ts'), typeName: 'LineProps', className: 'Line' },
    { file: apiPath('HLine.ts'), typeName: 'HLineProps', className: 'HLine' },
    { file: apiPath('VLine.ts'), typeName: 'VLineProps', className: 'VLine' },
] as const

export const GAME_OBJECT_FILE = apiPath('GameObject.ts')

/**
 * Known, deliberate accommodations that real source's exact types don't carry —
 * kept as an explicit, narrow override table rather than silently reproduced or
 * silently dropped. Currently just one: user scripts typed in Monaco infer array
 * literals like `[1, 2]` as `number[]`, not the precise tuple `[number, number]`
 * that `ArrayPoint` requires — so the *declared* setter type is deliberately
 * widened here to avoid a false-positive editor error, even though the real
 * runtime setter's TS-checked parameter type doesn't need the widening.
 */
export const SET_TYPE_OVERRIDES: Record<string, string> = {
    'Line.pointA': 'Returnable<PointArg | number[]>',
    'Line.pointB': 'Returnable<PointArg | number[]>',
}
