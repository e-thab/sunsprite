import { ref } from 'vue'
import Output from '@/assets/api/output'
import { useFileStore } from '@/stores/fileStore'
import { useWatchPanelStore } from '@/stores/watchPanelStore'
import type { ThemePalette } from '@/assets/theme/themes'
import { HOST_ORIGIN_PARAM, OPAQUE_ORIGIN, type HostMessage, type SandboxMessage } from './protocol'

// Host side of the sandbox. User code no longer runs in the editor app at all:
// it runs in runner.html inside an `<iframe sandbox="allow-scripts">`, which
// the browser gives an *opaque* origin. That's the security boundary — same
// origin policy means the frame can't read `parent.document`, the app's
// localStorage (where the Supabase session lives), or any of its DOM, no matter
// what the code inside it does. Everything the game legitimately needs from the
// app crosses as an explicit message; see protocol.ts.
//
// This module re-exports the same surface the components used to import from
// api/core.ts, so from a component's point of view little has changed.

const fpsRef = ref(0)
const mouseRef = ref({ mouseX: 0, mouseY: 0, screenX: 0, screenY: 0 })
const pausedRef = ref(false)
const clockRef = ref({
    time: 0,
    // timeMs: 0,
    // totalTime: 0,
    // totalTimeMs: 0,
    // delta: 0,
    deltaMs: 0,
    frame: 0,
    // startTime: 0,
    // startTimeMs: 0,
    // now: 0,
    // nowMs: 0,
})
const screenRef = ref({ width: 0, height: 0, top: 0, bottom: 0, left: 0, right: 0 })
const camRef = ref({ x: 0, y: 0, width: 0, height: 0, top: 0, bottom: 0, left: 0, right: 0, zoom: 0 })

export { fpsRef, mouseRef, pausedRef, clockRef, screenRef, camRef }

let frame: HTMLIFrameElement | null = null
let sandboxReady = false

/** seq of the last 'set-paused' command sent — see protocol.ts's comment on that type. */
let sentPauseSeq = 0

/** Set while the sandbox is still booting, so an early Run isn't dropped. */
let queuedRun: { code: string, entryName: string, theme?: ThemePalette } | null = null

/**
 * URL for the sandbox document, carrying our origin so it can address replies.
 * The file itself is named runner.html, not sandbox.html — see the comment on
 * vite.config.ts's build.rollupOptions.input for why the two are kept apart.
 */
export function sandboxUrl(): string {
    const base = `${import.meta.env.BASE_URL}runner.html`
    return `${base}?${HOST_ORIGIN_PARAM}=${encodeURIComponent(window.location.origin)}`
}

function post(message: HostMessage) {
    // The sandbox's origin is opaque, and the only valid targetOrigin for an
    // opaque origin is '*'. That's safe here because `frame.contentWindow`
    // already names exactly one recipient — our own iframe.
    frame?.contentWindow?.postMessage(message, '*')
}

/**
 * Wires the app to a sandbox iframe. Called once, from PhaserCanvas.vue, after
 * the element mounts.
 */
export function attachSandbox(element: HTMLIFrameElement) {
    frame = element
    sandboxReady = false

    window.addEventListener('message', onSandboxMessage)
    // Covers the case where the sandbox finished booting (and sent its 'ready')
    // before this listener existed. A module script runs before its document's
    // load event, so by the time this fires the sandbox is definitely up.
    element.addEventListener('load', () => post({ type: 'ping' }))
    installKeyForwarding()
}

export function detachSandbox() {
    window.removeEventListener('message', onSandboxMessage)
    removeKeyForwarding()
    frame = null
    sandboxReady = false
}

function onSandboxMessage(event: MessageEvent) {
    // Only our own frame, and only from an opaque origin — anything else is
    // some other page's message riding the same window.
    if (!frame || event.source !== frame.contentWindow) return
    if (event.origin !== OPAQUE_ORIGIN) return

    const message = event.data as SandboxMessage
    if (!message || typeof message.type !== 'string') return

    switch (message.type) {
        case 'ready':
            sandboxReady = true
            if (queuedRun) {
                post({ type: 'run', ...queuedRun })
                queuedRun = null
            }
            break

        case 'script-request':
            post({ type: 'script-response', id: message.id, content: resolveScript(message.name) ?? null })
            break

        case 'output':
            Output.render(message.kind, message.text, message.frame, message.location)
            break

        case 'output-clear':
            Output.clear()
            break

        case 'status':
            fpsRef.value = message.fps
            mouseRef.value = {
                mouseX: message.mouseX,
                mouseY: message.mouseY,
                screenX: message.mouseScreenX,
                screenY: message.mouseScreenY
            }
            // A snapshot older than the last command we sent predates it being
            // applied sandbox-side; trusting it would flicker pausedRef back to
            // the pre-click value for one tick. See protocol.ts's 'set-paused'.
            if (message.pauseSeq >= sentPauseSeq) {
                pausedRef.value = message.paused
            }
            clockRef.value = { time: message.time, deltaMs: message.deltaMs, frame: message.frame }
            screenRef.value = {
                width: message.screenWidth,
                height: message.screenHeight,
                top: message.screenTop,
                bottom: message.screenBottom,
                left: message.screenLeft,
                right: message.screenRight,
            }
            camRef.value = {
                x: message.cameraX,
                y: message.cameraY,
                width: message.cameraWidth,
                height: message.cameraHeight,
                top: message.cameraTop,
                bottom: message.cameraBottom,
                left: message.cameraLeft,
                right: message.cameraRight,
                zoom: message.cameraZoom
            }
            useWatchPanelStore().syncFromSandbox(message.watch)
            Output.setFrame(message.frame)
            break
    }
}

/**
 * Same content source CodeEditor.vue resolves models against, so the editor and
 * the running game always agree on what './helper.js' means. A miss — in a
 * loaded project or the guest sandbox alike, both real record-backed file
 * lists now — is a genuine error and stays undefined.
 */
function resolveScript(name: string): string | undefined {
    return useFileStore().getLocalCode(name)
}

export function runUserCode(code: string, entryName: string, theme?: ThemePalette) {
    if (!sandboxReady) {
        queuedRun = { code, entryName, theme }
        return
    }
    post({ type: 'run', code, entryName, theme })
}

export function pause() {
    pausedRef.value = true
    sentPauseSeq += 1
    post({ type: 'set-paused', paused: true, seq: sentPauseSeq })
}

export function play() {
    pausedRef.value = false
    sentPauseSeq += 1
    post({ type: 'set-paused', paused: false, seq: sentPauseSeq })
}

export function resizeStage() {
    post({ type: 'resize' })
}

/*
 * Keyboard forwarding.
 *
 * A key event goes to exactly one document. When the user has clicked the game
 * canvas, the iframe has focus and listens for itself (see api/core.ts setup);
 * the rest of the time the app has focus and these handlers pass the event
 * along. The two are mutually exclusive, so nothing is delivered twice — and
 * only the host can tell whether a keystroke belongs to the game or to a text
 * field it's sitting in, which is why the filtering lives here.
 */

function typingInApp(): boolean {
    const active = document.activeElement as HTMLElement | null
    if (!active) return false

    // Monaco marks its own input surface this way.
    if (active.ariaRoleDescription === 'editor') return true

    // Any other real text entry in the app's chrome (project name, sign-in, ...).
    if (active.isContentEditable) return true
    const tag = active.tagName
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

function forwardKey(kind: 'down' | 'up', event: KeyboardEvent) {
    if (typingInApp()) return
    if (frame && document.activeElement === frame) return
    post({ type: 'key', kind, code: event.code })
}

const onHostKeyDown = (event: KeyboardEvent) => forwardKey('down', event)
const onHostKeyUp = (event: KeyboardEvent) => forwardKey('up', event)

const onHostContextMenu = () => post({ type: 'release-keys' })

const onHostBlur = () => {
    // Clicking the canvas blurs the app window as focus moves into the iframe.
    // That's not a reason to drop held keys — the game is about to receive them
    // directly. Alt-tabbing away is.
    if (frame && document.activeElement === frame) return
    post({ type: 'release-keys' })
}

function installKeyForwarding() {
    window.addEventListener('keydown', onHostKeyDown)
    window.addEventListener('keyup', onHostKeyUp)
    window.addEventListener('contextmenu', onHostContextMenu)
    window.addEventListener('blur', onHostBlur)
}

function removeKeyForwarding() {
    window.removeEventListener('keydown', onHostKeyDown)
    window.removeEventListener('keyup', onHostKeyUp)
    window.removeEventListener('contextmenu', onHostContextMenu)
    window.removeEventListener('blur', onHostBlur)
}
