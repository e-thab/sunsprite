import { allTimers, clock } from "./core"

/** The timer class... TODO: DESCRIBE */
// TODO: Add Timer class to API
export default class Timer {
	/** Internal pause state references */
	_paused: boolean = false
	_lastPauseTime: number = 0
	_totalPauseElapsed: number = 0

	constructor() {
		this.reset()
		allTimers.push(this)
	}

	/** Time since start in milliseconds, does not increment during pause */
	timeMs: number = 0
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
	frame: number = 0

	/** Time this run started in milliseconds since the Unix epoch */
	startTimeMs: number = 0
	/** Time this run started in seconds since the Unix epoch */
	get startTime(): number {
		return this.startTimeMs / 1000
	}

	/** Current time in milliseconds since the Unix epoch */
	nowMs: number = 0
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
		this.nowMs = now
		this.startTimeMs = now
		
		this.timeMs = 0
		this.frame = 0
		this._totalPauseElapsed = 0
		this._lastPauseTime = 0
	}

	/** Update */
	_update() {
		this.nowMs = Date.now()
		if (!this.paused && !clock.paused) {
			this.timeMs = this.ageMs - this._totalPauseElapsed
			this.frame++
		}
	}
}