/** The timer class... TODO: DESCRIBE */
// TODO: Add Timer class to API
export default class Timer {
	/** Time since start in milliseconds, does not increment during pause */
	timeMs: number = 0
	/** Time since start in seconds, does not increment during pause */
	get time(): number {
		return this.timeMs / 1000
	}

	/** Time since start in milliseconds including pause time */
	get totalTimeMs(): number {
		return this.nowMs - this.startTimeMs
	}
	/** Time since start in seconds including pause time */
	get totalTime(): number {
		return this.totalTimeMs / 1000
	}

	/** Actual (but smoothed) time since last frame in milliseconds */
	deltaMs: number = 0
	/** Time since last frame normalized to 60fps (will usually be around 1) */
	get delta(): number {
		return this.deltaMs * 60 / 1000
	}

	/** Number of frames since start */
	frame: number = 0

	/** Time this run started in milliseconds since the Unix epoch */
	startTimeMs: number = 0
	/** Time this run started in seconds since the Unix epoch */
	get startTime(): number {
		return this.startTimeMs / 1000
	}

	/** Current time in milliseconds */
	nowMs: number = 0
	/** Current time in seconds */
	get now(): number {
		return this.nowMs / 1000
	}

	/** Internal paused references */
	_paused: boolean = false
	_lastPauseTime: number = 0
	_totalPauseElapsed: number = 0
	
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
		this.deltaMs = 0
		this.timeMs = 0
		this.frame = 0
		this._totalPauseElapsed = 0
		this._lastPauseTime = 0
	}

	/** Update */
	_update(delta: number, incrementFrame: boolean = true) {
		this.deltaMs = delta
		this.nowMs = Date.now()
		if (this.paused) return
		this.timeMs = this.totalTimeMs - this._totalPauseElapsed
		if (incrementFrame) this.frame++
	}
}