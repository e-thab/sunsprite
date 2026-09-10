import type { AnyProps } from "./index"

export type Class<T = {}> = new (...args: any[]) => T

// TODO: Use this to pass mixin constructor props along the chain
/** When given a nested array containing a props object, returns just the props object */
export function flatProps(...args: any[]): AnyProps | undefined {
    return args ? args.flat(Infinity)[0] as AnyProps : undefined
}
