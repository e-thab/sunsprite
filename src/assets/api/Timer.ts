import { allTimers, clock } from "@api/core"

/** The timer class... TODO: DESCRIBE */
export default class Timer {
	/** Internal pause state references */
	_paused: boolean = false
	_lastPauseTime: number = 0
	_totalPauseElapsed: number = 0
	_timeMs: number = 0
	_startTimeMs: number = 0
	_nowMs: number = 0

	constructor() {
		this.reset()
		allTimers.push(this)
	}

	/** Time since start in milliseconds, does not increment during pause */
	get timeMs(): number {
		return this._timeMs
	}
	/** Time since start in seconds, does not increment during pause */
	get time(): number {
		return this.timeMs / 1000
	}

	/** Time since start in milliseconds including pause time */
	get ageMs(): number {
		return this.nowMs - this.startTimeMs
	}
	/** Time since start in seconds including pause time */
	get age(): number {
		return this.ageMs / 1000
	}

	/** Number of frames since creation */
	// frame: number = 0

	/** Time this run started in milliseconds since the Unix epoch */
	get startTimeMs(): number {
		return this._startTimeMs
	}
	/** Time this run started in seconds since the Unix epoch */
	get startTime(): number {
		return this.startTimeMs / 1000
	}

	/** Current time in milliseconds since the Unix epoch */
	get nowMs(): number {
		return this._nowMs
	}
	/** Current time in seconds since the Unix epoch */
	get now(): number {
		return this.nowMs / 1000
	}
	
	/** Is the timer currently paused? */
	get paused(): boolean {
		return this._paused
	}
	set paused(pause: boolean) {
		if (pause) {
			this.pause()
		} else {
			this.play()
		}
	}

	/** Pause the timer */
	pause() {
		this._lastPauseTime = Date.now()
		this._paused = true
	}

	/** Resume the timer */
	play() {
		if (this._paused) this._totalPauseElapsed += Date.now() - this._lastPauseTime
		this._paused = false
	}

	/** Reset */
	reset() {
		const now = Date.now()
		this._nowMs = now
		this._startTimeMs = now

		this._timeMs = 0
		// this.frame = 0
		this._totalPauseElapsed = 0
		this._lastPauseTime = 0
	}

	/** Update */
	_update() {
		this._nowMs = Date.now()
		if (!this.paused && !clock.paused) {
			this._timeMs = this.ageMs - this._totalPauseElapsed
			// this.frame++
		}
	}
}