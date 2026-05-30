import { randomBool } from "./utility"

type Point = { x: number, y: number}
type ArrayPoint = [number, number]
type AnyPoint = Point | ArrayPoint

function isObjectPoint(obj: any): obj is Point {
    return obj && typeof obj.x === 'number' && typeof obj.y === 'number'
}
function isArrayPoint(obj: any): obj is ArrayPoint {
    return obj && obj.length === 2 && typeof obj[0] === 'number' && typeof obj[1] === 'number'
}

function getPoint(x: number, y: number): Point
function getPoint(point: Point): Point
function getPoint(point: ArrayPoint): Point
// function getPoint(point: Point | ArrayPoint): Point
// function getPoint(point: AnyPoint): Point
function getPoint(xOrPoint: number | Point | ArrayPoint, y?: number ): Point {
    if (isObjectPoint(xOrPoint)) {
        return xOrPoint
    }

    if (isArrayPoint(xOrPoint)) {
        return {
            x: xOrPoint[0],
            y: xOrPoint[1]
        }
    }

    if (y != null && typeof xOrPoint === 'number' && typeof y === 'number') {
        return {
            x: xOrPoint,
            y,
        }
    }

    // Catch exceptions
    return {
        x: NaN,
        y: NaN
    }
}

// Do something with a point from a setter (can't be (x,y) arg form)
function foo(point: AnyPoint) {
    const x = getPoint(point).x
}

// let point: ObjectPoint | ArrayPoint

// if (randomBool()) {
//     point = { x: 3, y: 4 }
// } else {
//     point = [3, 4]
// }

// getPoint(point)