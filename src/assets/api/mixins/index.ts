// Revisiting Mixins https://www.typescriptlang.org/docs/handbook/mixins.html
// import { allPositionables, app, /*camera,*/ mouseX, mouseY, paused, print, Timer } from "../core"
// import { Point, type AnyPoint } from "../interfaces"

export * from './Positionable'
export * from './Sizable'
export * from './Rotatable'
export * from './Viewable'
export * from './Interactable'
export * from './Timeable'

import { positionableApi, type PositionableProps } from './Positionable'
import { sizableApi, type SizableProps } from './Sizable'
import { rotatableApi, type RotatableProps } from './Rotatable'
import { viewableApi, type ViewableProps } from './Viewable'
import { interactableApi, type InteractableProps } from './Interactable'
import { timeableApi } from './Timeable'

export type AnyProps = InteractableProps | PositionableProps | RotatableProps | SizableProps | ViewableProps
export type GameObjectProps = PositionableProps & SizableProps & RotatableProps & InteractableProps & ViewableProps /* ...etc. */
// export const defaults: Required<GameObjectProps> = {
//     x: 0,
//     y: 0,
//     width: 100,
//     height: 100,
//     scale: 1,
//     rotation: 0,
//     radians: 0,
//     alpha: 100,
//     layer: 0,
//     cursor: {
//         src: 'default',
//         type: 'default'
//     },
//     visible: true,
//     onClick: () => {},
//     onRelease: () => {},
//     onMouseEnter: () => {},
//     onMouseExit: () => {},
//     // ...etc.
// }

export const gameObjectApi = [
    positionableApi,
    sizableApi,
    rotatableApi,
    viewableApi,
    interactableApi,
    timeableApi
].join('\n')

export const gameObjectPropsTypeDef = 'type GameObjectProps = PositionableProps & SizableProps & RotatableProps & InteractableProps & ViewableProps'
// [
//     positionablePropsTypeDef,
//     sizablePropsTypeDef,
//     rotatablePropsTypeDef,
//     viewablePropsTypeDef,
//     interactablePropsTypeDef,
//     `type GameObjectProps = PositionableProps & SizableProps & RotatableProps & InteractableProps & ViewableProps`
// ]
