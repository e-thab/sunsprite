// import { allTimers } from "./core"
import Timer from "@api/Timer"

export default class Clock {
    /** Internal timer component */
    _timer: Timer

	constructor() {
		this._timer = new Timer()
	}

    /** Actual (but smoothed) time since last frame in milliseconds */
	deltaMs: number = 0
    /** Time since last frame normalized to 60fps (will usually be around 1) */
	get delta(): number {
		return this.deltaMs * 60 / 1000
	}

	/** Number of frames since creation */
	frame: number = 0
	// get frame(): number {
	// 	return this._timer.frame
	// }

    /** Time since start in milliseconds, does not increment during pause */
	get timeMs(): number {
        return this._timer.timeMs
    }
	/** Time since start in seconds, does not increment during pause */
	get time(): number {
		return this._timer.time
	}

	/** Time since start in milliseconds including pause time */
	get ageMs(): number {
		return this._timer.ageMs
	}
	/** Time since start in seconds including pause time */
	get age(): number {
		return this._timer.age
	}

	/** Time this run started in milliseconds since the Unix epoch */
	get startTimeMs(): number {
        return this._timer.startTimeMs
    }
	/** Time this run started in seconds since the Unix epoch */
	get startTime(): number {
		return this._timer.startTime
	}

	/** Current time in milliseconds since the Unix epoch */
	get nowMs(): number {
        return this._timer.nowMs
    }
	/** Current time in seconds since the Unix epoch */
	get now(): number {
		return this._timer.now
	}

	get paused(): boolean {
		return this._timer.paused
	}
	set paused(paused: boolean) {
		this._timer.paused = paused
	}

    /** Pause the timer */
	pause() {
		this._timer.pause()
	}

	/** Resume the timer */
	play() {
		this._timer.play()
	}

	_reset() {
		this._timer.reset()
		this.frame = 0
		this.deltaMs = 0
		// allTimers.push(this._timer)
	}

    _update(delta: number) {
        this.deltaMs = delta
		this._timer._update()
        if (!this.paused) this.frame++
    }
}