import { ref } from 'vue'
import Output from '@api/output'
import { useFileStore } from '@/stores/fileStore'
import { useWatchPanelStore } from '@/stores/watchPanelStore'
import { useApiVersionStore } from '@/stores/apiVersionStore'
import { DEV_VERSION } from '@api/versions/constants'
import type { ThemePalette } from '@/theme/themes'
import { HOST_ORIGIN_PARAM, API_VERSION_PARAM, OPAQUE_ORIGIN, type HostMessage, type SandboxMessage } from './protocol'

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

/*
 * The listener's own volume, as set by the canvas toolbar's Volume dropdown —
 * the client bus sandbox-side (see api/Sound.ts). It's a property of this
 * machine, not of the project or of the running game, so it's kept here with
 * the rest of the sandbox's host-side state and persisted to localStorage the
 * way the other editor-chrome preferences are (see stores/editorSettingsStore.ts).
 * Nothing reads it back out of the sandbox: this is the authoritative copy,
 * re-sent on every 'ready' because a reloaded sandbox starts at its defaults.
 */
const CLIENT_AUDIO_KEY = 'sunsprite-client-audio'

function loadClientAudio(): { volume: number, muted: boolean } {
    try {
        const raw = localStorage.getItem(CLIENT_AUDIO_KEY)
        if (!raw) return { volume: 1, muted: false }
        const stored = JSON.parse(raw) as Record<string, unknown>
        return {
            volume: typeof stored?.volume === 'number' && stored.volume >= 0 && stored.volume <= 1
                ? stored.volume
                : 1,
            muted: stored?.muted === true,
        }
    } catch {
        // Unparseable, or localStorage unavailable in a locked-down context.
        // Full volume is the right answer either way.
        return { volume: 1, muted: false }
    }
}

const stored = loadClientAudio()
const clientVolumeRef = ref(stored.volume)
const clientMutedRef = ref(stored.muted)

export { fpsRef, mouseRef, pausedRef, clockRef, screenRef, camRef, clientVolumeRef, clientMutedRef }

let frame: HTMLIFrameElement | null = null
let sandboxReady = false

/** Which version the currently-attached document was actually built with — see runUserCode(). */
let loadedVersion: string = DEV_VERSION

/** seq of the last 'set-paused' command sent — see protocol.ts's comment on that type. */
let sentPauseSeq = 0

type RunMessage = Extract<HostMessage, { type: 'run' }>

/** Set while the sandbox is still booting, so an early Run isn't dropped. */
let queuedRun: Omit<RunMessage, 'type'> | null = null

/**
 * URL for the sandbox document, carrying our origin so it can address replies,
 * plus which permanent API version it should load (omitted for 'dev' — the
 * live engine, main.ts's own default). See src/api/versions/runtime.ts.
 * The file itself is named runner.html, not sandbox.html — see the comment on
 * vite.config.ts's build.rollupOptions.input for why the two are kept apart.
 */
export function sandboxUrl(): string {
    const base = `${import.meta.env.BASE_URL}runner.html`
    const params = new URLSearchParams({ [HOST_ORIGIN_PARAM]: window.location.origin })
    const version = useApiVersionStore().selectedVersion
    if (version !== DEV_VERSION) params.set(API_VERSION_PARAM, version)
    return `${base}?${params.toString()}`
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
    loadedVersion = DEV_VERSION
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
            // Confirms what actually loaded — main.ts falls back to 'dev'
            // (rather than failing) when a requested version isn't found, so
            // this can legitimately differ from what sandboxUrl() last asked for.
            loadedVersion = message.apiVersion
            // Before any queued run: a game that starts playing audio in its
            // first frames should already be at the volume the slider shows.
            postClientAudio()
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
 *
 * Text files are excluded: getLocalCode serves them too (the editor opens
 * them through it), but they're data, not modules — `import './notes.txt'`
 * would otherwise run the text as JavaScript. Files.read is how a script reads
 * one, and a miss here reports "no script named ..." instead of a syntax error.
 */
function resolveScript(name: string): string | undefined {
    const fileStore = useFileStore()
    if (fileStore.isTextFile(name)) return undefined
    return fileStore.getLocalCode(name)
}

export interface RunOptions {
    /**
     * Build the game but leave it paused on its first frame until Play (or
     * another run) starts it — the editor's first run after loading, so
     * opening a project doesn't start a game, and its sound, unasked.
     */
    paused?: boolean
}

export function runUserCode(code: string, entryName: string, theme?: ThemePalette, options: RunOptions = {}) {
    // A version change only ever takes effect here, at the next run — not by
    // live-patching a game that's already running. Reloading is the only sane
    // option: Phaser scenes/GameObjects already built from the old classes
    // can't sanely swap which class backs them mid-execution. This is also
    // the one choke-point every run path already goes through (per-script
    // Run, Restart, FileTree "Run script", PlayView Restart), so nothing
    // upstream of here needs to know reloading can happen at all.
    const selected = useApiVersionStore().selectedVersion
    if (frame && selected !== loadedVersion) {
        loadedVersion = selected
        sandboxReady = false
        frame.src = sandboxUrl()
    }

    // Read here, at the one choke-point every run path shares, for the same
    // reason the version check above is. Copied into fresh plain objects so
    // nothing reactive ever reaches postMessage's structured clone.
    const fileStore = useFileStore()
    const assets = fileStore.projectAssets.map(({ name, kind, url }) => ({ name, kind, url }))
    // Read straight off the store at post time rather than through a computed
    // like projectAssets, which would re-run on every keystroke in a text file.
    const textFiles = fileStore.textFiles.map(({ name, content }) => ({ name, content }))

    const run: Omit<RunMessage, 'type'> = { code, entryName, theme, assets, textFiles }
    if (options.paused) {
        // Same optimistic write and seq bump as pause(), for the same reason:
        // the button should read Play now, not after the next status.
        pausedRef.value = true
        sentPauseSeq += 1
        run.paused = true
        run.pauseSeq = sentPauseSeq
    }

    if (!sandboxReady) {
        queuedRun = run
        return
    }
    post({ type: 'run', ...run })
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

function postClientAudio() {
    post({ type: 'set-client-audio', volume: clientVolumeRef.value, muted: clientMutedRef.value })
}

function persistClientAudio() {
    try {
        localStorage.setItem(CLIENT_AUDIO_KEY, JSON.stringify({
            volume: clientVolumeRef.value,
            muted: clientMutedRef.value,
        }))
    } catch {
        // Storage unavailable or full — the setting still applies to this
        // session, it just won't be remembered. Not worth failing the click.
    }
}

/**
 * Volume for everything the game plays, 0..1, multiplied into every sound's
 * own volume sandbox-side. Called straight from the slider, so it's written
 * on every drag tick — a postMessage of two numbers, nothing heavier.
 */
export function setClientVolume(volume: number) {
    clientVolumeRef.value = Math.min(1, Math.max(0, volume))
    persistClientAudio()
    postClientAudio()
}

/** Silence the game without losing the volume the slider is set to. */
export function setClientMuted(muted: boolean) {
    clientMutedRef.value = muted
    persistClientAudio()
    postClientAudio()
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
