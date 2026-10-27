import { reactive } from 'vue'

// Lengths of sounds shown in FileTree.vue and AssetLibrary.vue, read from the
// files themselves by loading only their metadata. Keyed by URL and kept for
// the session: a Library path or an upload's public URL never changes what it
// points at.
//
// Asked for from render (audioDuration(url) in a template), so nothing here
// writes reactive state synchronously — the first call only queues a load, and
// the result lands later from the media element's own events. Loads run a few
// at a time: expanding a Library folder asks for dozens at once.

const MAX_CONCURRENT_LOADS = 4

// null once a file has been tried and has no usable length (failed to load,
// or reports Infinity, as a stream would).
const durations = reactive(new Map<string, number | null>())
const requested = new Set<string>()
const queue: string[] = []
let activeLoads = 0

function pump() {
	while (activeLoads < MAX_CONCURRENT_LOADS && queue.length > 0) {
		load(queue.shift()!)
	}
}

function load(url: string) {
	activeLoads++
	const audio = new Audio()
	audio.preload = 'metadata'

	const finish = (duration: number | null) => {
		audio.removeEventListener('loadedmetadata', onLoaded)
		audio.removeEventListener('error', onError)
		// Drops the element's hold on the file — it was never going to play.
		audio.removeAttribute('src')
		audio.load()
		durations.set(url, duration)
		activeLoads--
		pump()
	}
	const onLoaded = () => finish(Number.isFinite(audio.duration) ? audio.duration : null)
	const onError = () => finish(null)

	audio.addEventListener('loadedmetadata', onLoaded)
	audio.addEventListener('error', onError)
	audio.src = url
}

/** The sound's length in seconds, or undefined until it's known (or if it can't be). */
export function audioDuration(url: string): number | undefined {
	if (!requested.has(url)) {
		requested.add(url)
		queue.push(url)
		queueMicrotask(pump)
	}
	return durations.get(url) ?? undefined
}

/** "1:05" — or "0:03.2" under ten seconds, where whole seconds would round most sound effects to 0:00. */
export function formatDuration(seconds: number): string {
	// Compared after rounding, so 9.96 becomes "0:10" rather than "0:010.0".
	if (Math.round(seconds * 10) < 100) return `0:0${seconds.toFixed(1)}`
	const whole = Math.round(seconds)
	return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}
