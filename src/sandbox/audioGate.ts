import { _sharedAudioContext } from '@api/assets'

// Browsers keep an AudioContext suspended until the document it belongs to has
// been interacted with. This document almost never is directly: the user
// clicks Run and types in the *host*, and that interaction doesn't cross into a
// cross-origin frame. GameFrame.vue's `allow="autoplay"` lends us the host's
// permission, which covers the editor in browsers that honor it. Two cases are
// left over: browsers that don't, and a page nobody has touched at all (the
// play page, opened from a link, runs its game on load).
//
// For those, an unpaused run (or Play) is held here until sound is allowed,
// and the "Click to play" overlay in runner.html asks for the click that
// allows it. Holding the *start*, rather than letting the game run silently
// and the audio catch up on the first click, keeps the game clock and the
// audio clock starting together. Permission is sticky for the life of the
// document, so this only ever asks once per page load: restarts reuse the same
// document and the same context (see assets.ts's _sharedAudioContext).
//
// This lives on the sandbox side of the version split, so every API version
// gets it. A snapshot that predates the shared context builds its own per
// game, but permission belongs to the document, not the context: once this one
// may run, so may theirs.

/** How long a silent resume() gets to prove sound is already allowed before the overlay asks. */
const PROBE_MS = 150

let unlocked = false
let watched: AudioContext | undefined
let waiters: (() => void)[] = []
let probeTimer: ReturnType<typeof setTimeout> | undefined

function overlay(): HTMLElement | null {
    return document.getElementById('audio-gate')
}

function setOverlay(visible: boolean) {
    const element = overlay()
    if (element) element.hidden = !visible
}

function markUnlocked() {
    if (unlocked) return
    unlocked = true
    clearTimeout(probeTimer)
    setOverlay(false)
    for (const resolve of waiters.splice(0)) resolve()
}

/**
 * The shared context, watched for the first time it's allowed to run —
 * whoever resumes it. That can be the probe below, the overlay, or core.ts and
 * Phaser resuming it after a click on the canvas or a delegated one in the
 * host. 'suspended' after that only means paused; core.ts suspends it itself.
 */
function audioContext(): AudioContext | undefined {
    const context = _sharedAudioContext()
    if (context && context !== watched) {
        watched = context
        context.addEventListener('statechange', () => {
            if (context.state === 'running') markUnlocked()
        })
        if (context.state === 'running') markUnlocked()
    }
    return context
}

/**
 * Resolves once the game may make sound — immediately if it already can (or
 * there's no Web Audio, where Phaser's HTML5 fallback unlocks itself).
 * Otherwise tries a silent resume() first, which succeeds when the host's
 * permission has been delegated in, and shows the overlay only if that
 * hasn't worked within PROBE_MS.
 */
export function whenAudioUnlocked(): Promise<void> {
    const context = audioContext()
    if (!context || unlocked) return Promise.resolve()

    const result = new Promise<void>((resolve) => waiters.push(resolve))
    // A resume() that isn't allowed yet stays pending (or rejects) rather
    // than throwing; statechange reports it if it ever goes through.
    context.resume().catch(() => {})
    clearTimeout(probeTimer)
    probeTimer = setTimeout(() => {
        if (!unlocked && waiters.length > 0) setOverlay(true)
    }, PROBE_MS)
    return result
}

/** Stop waiting: whatever was held has been dropped or started some other way. */
export function cancelAudioUnlock() {
    clearTimeout(probeTimer)
    waiters = []
    setOverlay(false)
}

overlay()?.addEventListener('click', () => {
    setOverlay(false)
    // Same as clicking the canvas: the user wants to play, so keys should
    // come straight here (see main.ts's watchContainerSize).
    window.focus()

    const context = audioContext()
    if (!context) {
        markUnlocked()
        return
    }
    // Called from inside the click handler itself: Safari only honors a
    // resume() made in the gesture's own call stack. Started once it has
    // resolved, so the first frame's sounds aren't scheduled on a clock that
    // hasn't begun moving, but not waited on forever: a browser that still
    // refuses after a click isn't going to change its mind, and a silent game
    // beats one that never starts.
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, PROBE_MS))
    Promise.race([context.resume(), timeout]).then(markUnlocked, markUnlocked)
})
