import { setScriptResolver } from '@/assets/api/moduleRunner'
import { loadVersionedRuntime, loadLatestRuntime } from '@/assets/api/versions/runtime'
import { onHostMessage, postToHost } from './channel'
import { API_VERSION_PARAM, type HostMessage } from './protocol'

// Entry point for runner.html — the document inside
// `<iframe sandbox="allow-scripts">`. Phaser, the Sunsprite API, and every line
// of user code live in here, at an opaque origin with no way to reach the
// editor app. This file is the only thing that talks to the host.
//
// core/watch are resolved dynamically, not statically imported, because which
// copy loads depends on a version requested via this document's own URL (see
// hostBridge.ts's sandboxUrl()) — read once, here, before anything else runs.
// moduleRunner.ts is never versioned (it's generic script-compilation engine,
// not part of the scripting API itself), so it stays a plain static import.
const requestedVersion = new URLSearchParams(location.search).get(API_VERSION_PARAM) ?? 'latest'
let activeVersion = requestedVersion
let runtime = requestedVersion === 'latest' ? await loadLatestRuntime() : await loadVersionedRuntime(requestedVersion)
if (!runtime) {
    console.error(`API version "${requestedVersion}" not found — falling back to latest.`)
    activeVersion = 'latest'
    runtime = await loadLatestRuntime()
}
const { core, watch } = runtime

/**
 * Import resolution round trip. Only the host has the file store, so a script
 * the running code imports has to be fetched from it. Kept lazy (rather than
 * snapshotting every file up front) so a run always sees the same content the
 * in-page runner used to read straight out of the store.
 */
let nextScriptRequestId = 0
const pendingScripts = new Map<number, (content: string | undefined) => void>()

/** seq of the last 'set-paused' command applied — echoed in status reports; see protocol.ts. */
let appliedPauseSeq = 0

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
            core.runUserCode(message.code, message.entryName, message.theme)
            break

        case 'script-response': {
            const resolve = pendingScripts.get(message.id)
            if (!resolve) break
            pendingScripts.delete(message.id)
            resolve(message.content ?? undefined)
            break
        }

        case 'set-paused':
            if (message.paused) core.pause()
            else core.play()
            appliedPauseSeq = message.seq
            break

        case 'resize':
            core.resizeStage()
            break

        case 'key':
            if (message.kind === 'down') core.handleKeyDown(message.code)
            else core.handleKeyUp(message.code)
            break

        case 'release-keys':
            core.releaseAllKeys()
            break

        case 'ping':
            postToHost({ type: 'ready', apiVersion: activeVersion })
            break
    }
}

// The canvas is sized by the iframe element, which the app's USplitter layout
// resizes directly — so watching our own container catches every layout change
// without the host having to tell us about it. The host's explicit 'resize'
// message stays as a belt-and-braces nudge for cases where the element's box
// doesn't change but the game's should.
function watchContainerSize() {
    const container = document.getElementById('game-container')
    if (!container) return

    new ResizeObserver(() => core.resizeStage()).observe(container)

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
        const { mouse, clock, screen, camera } = core
        if (!mouse || !clock || !screen) return
        postToHost({
            type: 'status',
            fps: core.currentFps(),
            paused: core.paused,
            pauseSeq: appliedPauseSeq,
            frame: clock.frame,
            time: clock.time,
            deltaMs: clock.deltaMs,

            mouseX: Math.round(mouse.x),
            mouseY: Math.round(mouse.y),
            mouseScreenX: Math.round(mouse.screenX),
            mouseScreenY: Math.round(mouse.screenY),

            cameraX: Math.round(camera.x),
            cameraY: Math.round(camera.y),
            cameraWidth: Math.round(camera.width),
            cameraHeight: Math.round(camera.height),
            cameraTop: Math.round(camera.top),
            cameraBottom: Math.round(camera.bottom),
            cameraLeft: Math.round(camera.left),
            cameraRight: Math.round(camera.right),
            cameraZoom: parseFloat(camera.zoom.toFixed(3)),

            screenWidth: Math.round(screen.width),
            screenHeight: Math.round(screen.height),
            screenTop: Math.round(screen.top),
            screenBottom: Math.round(screen.bottom),
            screenLeft: Math.round(screen.left),
            screenRight: Math.round(screen.right),

            watch: watch.collectWatchSnapshot(),
        })
    }, 60)
}

core.setup()
watchContainerSize()
startStatusReports()
onHostMessage(handleMessage)
postToHost({ type: 'ready', apiVersion: activeVersion })
