import { clock, runUserCallback } from "@api/core"
import type { Action, Awaitable, Forever, Repeatable, RepeatableUntil, RepeatableWhile, Delayable, Conditional, Predicate } from "./types"

let _forevers: Forever[] = []
let _repeats: Repeatable[] = []
let _repeatUntils: RepeatableUntil[] = []
let _repeatWhiles: RepeatableWhile[] = []
let _afters: Delayable[] = []
let _everys: Delayable[] = []
let _whens: Conditional[] = []

/**
 * Primary game loop; runs every frame.
 *
 * If `func` is async, each run waits for the previous one to finish, so
 * `await` inside it pauses this loop without overlapping itself.
 * @param func The function to run each frame.
 */
export function forever(func:
    /** @param delta Time since the previous frame. */
    (delta: number) => void
) {
    _forevers.push({ fn: func })
}

/**
 * Runs a specified number of times alongside the game loop (1 iteration per frame).
 *
 * **NOTE:** If `func` is async, each iteration waits for the previous one to finish, so
 * iterations that `await` run one after another instead of all at once.
 * 
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
         * Register a function to run when the repeat ends (after the last iteration finishes, if it's async).
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
 *
 * If `fn` is async, each iteration waits for the previous one to finish, and
 * the condition is only checked between iterations.
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
 *
 * If `fn` is async, each iteration waits for the previous one to finish, and
 * the condition is only checked between iterations.
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
 *
 * If `fn` is async and a run takes longer than the interval, the next run
 * waits for it to finish instead of overlapping it.
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
    _track(delayable, fn())
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
 * Waits for a specified number of seconds. Use with `await` to delay execution
 * of the following lines, e.g.
 * 
 * ```js
 * const rect = new Rectangle() // Creates a new rectangle
 * await wait(1)                // Waits for 1 second
 * rect.goTo(100, 100)          // Moves rect to (100, 100)
 * ```
 * 
 * @param seconds The number of seconds to wait.
 * @returns A promise that resolves once the time has passed.
 */
export function wait(seconds: number): Promise<void> {
    // Rides on after() rather than setTimeout so it follows the game clock
    return new Promise(resolve => after(seconds, resolve))
}

/**
 * Internal. Steps every loop once; called each unpaused frame by core.ts's scene update.
 * forever() gets the frame-normalized clock.delta (~1 at 60fps) its docs promise,
 * while after()/every() count real milliseconds against their lifetimes.
 */
export function runControls() {
    _runWhens()
    _runForevers(clock.delta)
    _runRepeats()
    _runRepeatUntils()
    _runRepeatWhiles()
    _runAfters(clock.deltaMs)
    _runEverys(clock.deltaMs)
}

/** Reset all  */
export function clearControls() {
    _forevers = []
    _repeats = []
    _repeatUntils = []
    _repeatWhiles = []
    _afters = []
    _everys = []
    _whens = []
}

/**
 * If a loop callback returned a Promise (it's async), marks its entry busy
 * until that settles, so the loop waits for it instead of starting the next
 * iteration on top of it. finally() rather than then(ok, fail): a rejection
 * carries through to the derived promise unhandled, so core.ts's global
 * unhandledrejection handler still reports it exactly as it would without
 * this wrapper.
 */
function _track(entry: Awaitable, result: unknown) {
    if (result instanceof Promise) {
        entry.busy = true
        result.finally(() => { entry.busy = false })
    }
}

function _runForevers(delta: number) {
    for (const forever of _forevers) {
        if (forever.busy) continue
        _track(forever, runUserCallback(() => forever.fn(delta), undefined))
    }
}

function _runRepeats() {
    const finished = new Set<Repeatable>()

    for (const repeat of _repeats) {
        if (repeat.busy) continue

        if (repeat.i < repeat.count) {
            _track(repeat, runUserCallback(() => repeat.fn(repeat.i), undefined))
            repeat.i += 1
        }

        // Checked after the step, so a synchronous last iteration still runs
        // then() the same frame, while an async one holds it until it settles.
        if (!repeat.busy && repeat.i >= repeat.count) {
            finished.add(repeat)
            if (repeat.then) {
                const then = repeat.then
                runUserCallback(() => then(repeat.i), undefined)
            }
        }
    }
    _repeats = _repeats.filter(repeat => !finished.has(repeat))
}

function _runRepeatUntils() {
    const finished = new Set<RepeatableUntil>()

    for (const repeatUntil of _repeatUntils) {
        if (repeatUntil.busy) continue

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
            _track(repeatUntil, runUserCallback(() => repeatUntil.fn(repeatUntil.i), undefined))
            repeatUntil.i += 1
        }
    }
    _repeatUntils = _repeatUntils.filter(repeatUntil => !finished.has(repeatUntil))
}

function _runRepeatWhiles() {
    for (const repeatWhile of _repeatWhiles) {
        if (repeatWhile.busy) continue

        // A throwing condition() is treated as "no, stop" (see runUserCallback's
        // fallback below), same reasoning as repeatUntil above but inverted.
        const thisCheck = runUserCallback(() => repeatWhile.condition(), false)
        if (thisCheck) {
            // Run as long as the condition is true
            _track(repeatWhile, runUserCallback(() => repeatWhile.fn(repeatWhile.i), undefined))
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
        // Time keeps accruing while a run is still pending, so the next one
        // starts as soon as both the interval has passed and that run is done.
        every.elapsedMs += delta
        if (!every.busy && every.elapsedMs >= every.lifetimeMs) {
            _track(every, runUserCallback(() => every.fn(), undefined))
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
