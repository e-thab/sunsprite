import {
    currentFps,
    handleKeyDown,
    handleKeyUp,
    mouse,
    paused,
    pause,
    play,
    releaseAllKeys,
    resizeStage,
    runUserCode,
    screen,
    setup,
    Clock,
} from '@/assets/api/core'
import { setScriptResolver } from '@/assets/api/moduleRunner'
import { onHostMessage, postToHost } from './channel'
import { collectWatchSnapshot } from './watch'
import type { HostMessage } from './protocol'

// Entry point for sandbox.html — the document inside
// `<iframe sandbox="allow-scripts">`. Phaser, the Sunsprite API, and every line
// of user code live in here, at an opaque origin with no way to reach the
// editor app. This file is the only thing that talks to the host.

/**
 * Import resolution round trip. Only the host has the file store, so a script
 * the running code imports has to be fetched from it. Kept lazy (rather than
 * snapshotting every file up front) so a run always sees the same content the
 * in-page runner used to read straight out of the store.
 */
let nextScriptRequestId = 0
const pendingScripts = new Map<number, (content: string | undefined) => void>()

setScriptResolver((name) => {
    return new Promise<string | undefined>((resolve) => {
        const id = nextScriptRequestId++
        pendingScripts.set(id, resolve)
        postToHost({ type: 'script-request', id, name })
    })
})

function handleMessage(message: HostMessage) {
    switch (message.type) {
        case 'run':
            runUserCode(message.code, message.theme)
            break

        case 'script-response': {
            const resolve = pendingScripts.get(message.id)
            if (!resolve) break
            pendingScripts.delete(message.id)
            resolve(message.content ?? undefined)
            break
        }

        case 'set-paused':
            if (message.paused) pause()
            else play()
            break

        case 'resize':
            resizeStage()
            break

        case 'key':
            if (message.kind === 'down') handleKeyDown(message.code)
            else handleKeyUp(message.code)
            break

        case 'release-keys':
            releaseAllKeys()
            break

        case 'ping':
            postToHost({ type: 'ready' })
            break
    }
}

// The canvas is sized by the iframe element, which the app's splitpanes layout
// resizes directly — so watching our own container catches every layout change
// without the host having to tell us about it. The host's explicit 'resize'
// message stays as a belt-and-braces nudge for cases where the element's box
// doesn't change but the game's should.
function watchContainerSize() {
    const container = document.getElementById('game-container')
    if (!container) return

    new ResizeObserver(() => resizeStage()).observe(container)

    // Right-click is a game input, not a request for the browser menu. This
    // used to be attached from PhaserCanvas.vue; the canvas lives in here now,
    // and that document can't reach across the origin boundary to add it.
    container.addEventListener('contextmenu', (event) => event.preventDefault())
}

// Telemetry for the canvas panel's FPS badge, mouse readout, and the Info
// panel. Polled on an interval rather than posted per frame — true 60/sec
// updates would add postMessage overhead to the render loop for digits that
// change faster than they can be read. ~60ms (~16Hz) looks just as live to
// the eye while staying well clear of that cost.
function startStatusReports() {
    setInterval(() => {
        postToHost({
            type: 'status',
            fps: currentFps(),
            mouseX: Math.round(mouse.x),
            mouseY: Math.round(mouse.y),
            paused,
            frame: Clock.frame,
            time: Clock.time,
            deltaMs: Clock.deltaMs,
            screenWidth: Math.round(screen.width),
            screenHeight: Math.round(screen.height),
            screenTop: Math.round(screen.top),
            screenBottom: Math.round(screen.bottom),
            screenLeft: Math.round(screen.left),
            screenRight: Math.round(screen.right),
            watch: collectWatchSnapshot(),
        })
    }, 60)
}

setup()
watchContainerSize()
startStatusReports()
onHostMessage(handleMessage)
postToHost({ type: 'ready' })
