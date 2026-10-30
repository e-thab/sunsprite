import { clock, runUserCallback } from "@api/core"
import type { Action, Repeatable, RepeatableUntil, RepeatableWhile, Delayable, Conditional, Predicate } from "./types"

let _forevers: Action[] = []
let _repeats: Repeatable[] = []
let _repeatUntils: RepeatableUntil[] = []
let _repeatWhiles: RepeatableWhile[] = []
let _afters: Delayable[] = []
let _everys: Delayable[] = []
let _whens: Conditional[] = []

/**
 * Primary game loop; runs every frame.
 * @param func The function to run each frame.
 */
export function forever(func: 
    /** @param delta Time since the previous frame. */
    (delta: number) => void
) {
    _forevers.push((delta: number) => {
        func(delta)
    })
}

/**
 * Runs a specified number of times alongside the game loop (1 iteration per frame).
 * @param times The number of times to repeat.
 * @param func The function to be repeated.
 */
export function repeat(times: number, func: 
    /** @param i The current iteration (times repeated so far). */
    (i: number) => void
) {
    const repeatable: Repeatable = {
        count: times,
        i: 0,
        fn: func,
        // then: undefined
    }
    _repeats.push(repeatable)

    return {
        /**
         * Register a function to run when the repeat ends.
         * @param thenFunc The function.
         */
        then(thenFunc: 
            /** @param i The current iteration (times repeated so far). */
            (i: number) => void
        ) {
            repeatable.then = thenFunc
        }
    }
}

/**
 * Runs until the specified condition is true. Runs alongside the game loop (1 iteration per frame).
 * @param condition The predicate condition to check.
 * @param fn The function to be repeated.
 */
export function repeatUntil(condition: Predicate, fn: Action) {
    const repeatableUntil: RepeatableUntil = {
        condition,
        fn,
        i: 0,
    }
    _repeatUntils.push(repeatableUntil)

    return {
        /**
         * Register a function to run when the repeat ends.
         * @param thenFn The function.
         */
        then(thenFn: Action) {
            repeatableUntil.then = thenFn
        }
    }
}

/**
 * Runs repeatedly while the specified condition is true. Runs alongside the game loop (1 iteration per frame).
 * @param condition The predicate condition to check.
 * @param fn The function to be repeated.
 */
export function repeatWhile(condition: Predicate, fn: Action) {
    const repeatableWhile: RepeatableWhile = {
        condition,
        fn,
        lastCheck: condition(),
        i: 0,
    }
    _repeatWhiles.push(repeatableWhile)

    return {
        /**
         * Register another function to run once every time the condition switches from true to false.
         * @param thenFn The function.
         */
        then(thenFn: Action) {
            repeatableWhile.then = thenFn
        }
    }
}

/**
 * Runs once after a specified number of seconds have passed.
 * @param seconds The number of seconds to wait before running.
 * @param fn The function to run.
 */
export function after(seconds: number, fn: Action) {
    _afters.push({
        elapsedMs: 0,
        lifetimeMs: seconds * 1000,
        fn
    })
}

/**
 * Runs once immediately, then repeatedly at a specified time interval.
 * @param seconds The number of seconds to wait before running each time.
 * @param fn The function to run.
 */
export function every(seconds: number, fn: Action) {
    const delayable: Delayable & { until?: (elapsed: number) => void } = {
        elapsedMs: 0,
        lifetimeMs: seconds * 1000,
        fn,
    }
    // TODO: every.until() which lets user define a condition that will stop/destroy the every
    _everys.push(delayable)
    fn()
}

/**
 * Runs once each time the condition becomes true.
 * @param condition The condition to check.
 * @param fn The function to run.
 */
export function when(condition: Predicate, fn: Action) {
    // TODO: A way to signal that this entry should be removed after the first time it becomes true
    _whens.push({
        lastCheck: condition(),
        condition,
        fn
    })
}

/**
 * Internal. Steps every loop once; called each unpaused frame by core.ts's scene update.
 * forever() gets the frame-normalized clock.delta (~1 at 60fps) its docs promise,
 * while after()/every() count real milliseconds against their lifetimes.
 */
export function runLoops() {
    _runWhens()
    _runForevers(clock.delta)
    _runRepeats()
    _runRepeatUntils()
    _runRepeatWhiles()
    _runAfters(clock.deltaMs)
    _runEverys(clock.deltaMs)
}

export function clearLoops() {
    _forevers = []
	_repeats = []
	_repeatUntils = []
	_repeatWhiles = []
	_afters = []
	_everys = []
	_whens = []
}

function _runForevers(delta: number) {
    for (const forever of _forevers) {
        runUserCallback(() => forever(delta), undefined)
    }
}

function _runRepeats() {
    for (const repeat of _repeats) {
        runUserCallback(() => repeat.fn(repeat.i), undefined)
        repeat.count -= 1
        repeat.i += 1

        if (repeat.count <= 0 && repeat.then) {
            const then = repeat.then
            runUserCallback(() => then(), undefined)
        }
    }
    _repeats = _repeats.filter(repeat => repeat.count > 0)
}

function _runRepeatUntils() {
    const finished = new Set<RepeatableUntil>()

    for (const repeatUntil of _repeatUntils) {
        // A throwing condition() is treated as "yes, done" so a broken repeatUntil
        // finishes and gets cleaned up by the filter() at the bottom, rather than
        // re-throwing every frame forever.
        if (runUserCallback(() => repeatUntil.condition(), true)) {
            // Once condition first becomes true, run then() exactly once and remove repeatUntil()
            finished.add(repeatUntil)
            if (repeatUntil.then) {
                const then = repeatUntil.then
                runUserCallback(() => then(repeatUntil.i), undefined)
            }
        } else {
            // Run as long as condition is false
            runUserCallback(() => repeatUntil.fn(repeatUntil.i), undefined)
            repeatUntil.i += 1
        }
    }
    _repeatUntils = _repeatUntils.filter(repeatUntil => !finished.has(repeatUntil))
}

function _runRepeatWhiles() {
    for (const repeatWhile of _repeatWhiles) {
        // A throwing condition() is treated as "no, stop" (see runUserCallback's
        // fallback below), same reasoning as repeatUntil above but inverted.
        const thisCheck = runUserCallback(() => repeatWhile.condition(), false)
        if (thisCheck) {
            // Run as long as the condition is true
            runUserCallback(() => repeatWhile.fn(repeatWhile.i), undefined)
            repeatWhile.i += 1
        } else if (repeatWhile.lastCheck && repeatWhile.then) {
            // Once the condition first becomes false, run then() and reset
            const then = repeatWhile.then
            runUserCallback(() => then(repeatWhile.i), undefined)
            repeatWhile.i = 0
        }
        repeatWhile.lastCheck = thisCheck
    }
}

function _runAfters(delta: number) {
    for (const after of _afters) {
        after.elapsedMs += delta
        if (after.elapsedMs >= after.lifetimeMs) {
            runUserCallback(() => after.fn(), undefined)
        }
    }
    _afters = _afters.filter(after => after.elapsedMs < after.lifetimeMs)
}

function _runEverys(delta: number) {
    for (const every of _everys) {
        every.elapsedMs += delta
        if (every.elapsedMs >= every.lifetimeMs) {
            runUserCallback(() => every.fn(), undefined)
            every.elapsedMs = 0
        }
    }
}

function _runWhens() {
    for (const when of _whens) {
        const thisCheck = runUserCallback(() => when.condition(), false)
        if (thisCheck && !when.lastCheck) {
            runUserCallback(() => when.fn(), undefined)
        }
        when.lastCheck = thisCheck
    }
}