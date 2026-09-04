// Revisiting Mixins https://www.typescriptlang.org/docs/handbook/mixins.html

export * from './Positionable'
export * from './Sizable'
export * from './Rotatable'
export * from './Viewable'
export * from './Interactable'
export * from './Timeable'

import { type PositionableProps } from './Positionable'
import { type SizableProps } from './Sizable'
import { type RotatableProps } from './Rotatable'
import { type ViewableProps } from './Viewable'
import { type InteractableProps } from './Interactable'

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
