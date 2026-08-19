import type { ThemePalette } from '@/assets/theme/themes'

// The complete contract between the editor app (host) and the sandbox iframe
// that runs user code. These two sides share no memory and no globals — an
// opaque-origin iframe can't be reached with contentWindow.eval or read with
// contentDocument — so every capability the game needs from the app has to be
// an explicit message here. Keep payloads structured-cloneable (plain data
// only: no functions, DOM nodes, or class instances).

/** host -> sandbox */
export type HostMessage =
    /**
     * Start a fresh run. `code` is the entry script's content — whichever
     * file was active in the editor, not necessarily "main.js" — and
     * `entryName` is that file's real name, so compiled stack traces (and
     * therefore locateError) attribute errors to it correctly instead of
     * always assuming "main.js".
     */
    | { type: 'run', code: string, entryName: string, theme?: ThemePalette }
    /** Reply to a 'script-request'. `content: null` means "no such script". */
    | { type: 'script-response', id: number, content: string | null }
    | { type: 'set-paused', paused: boolean }
    /** Nudge the game to re-measure its container (splitter drags, etc.). */
    | { type: 'resize' }
    /**
     * A key event the host observed while the iframe did *not* have focus.
     * `code` is a raw KeyboardEvent.code; the sandbox applies its own aliasing.
     */
    | { type: 'key', kind: 'down' | 'up', code: string }
    /** Drop all held keys (host window lost focus, context menu opened, ...). */
    | { type: 'release-keys' }
    /**
     * "Are you there?" — answered with 'ready'. The sandbox announces itself on
     * boot, but the host attaches its listener from onMounted, so that first
     * announcement can in principle arrive before anyone is listening. The host
     * pings again on the iframe's load event; 'ready' is idempotent.
     */
    | { type: 'ping' }

/** sandbox -> host */
export type SandboxMessage =
    /** Sandbox booted and is ready to accept 'run'. */
    | { type: 'ready' }
    /**
     * The running code imported a script the sandbox can't see. Only the host
     * has the file store, so resolution is a round trip; `id` correlates the
     * reply. This keeps resolution lazy and always current, matching how the
     * in-page runner used to read the store directly.
     */
    | { type: 'script-request', id: number, name: string }
    | { type: 'output', kind: OutputKind, text: string, frame: number, location?: OutputLocation }
    | { type: 'output-clear' }
    /** Periodic telemetry for the canvas panel's FPS badge / mouse readout, and the Info panel. */
    | {
        type: 'status',
        fps: number,
        mouseX: number,
        mouseY: number,
        paused: boolean,
        frame: number,
        time: number,
        deltaMs: number,
        screenWidth: number,
        screenHeight: number,
        screenTop: number,
        screenBottom: number,
        screenLeft: number,
        screenRight: number,
        /** Current values of every card registered via the user-facing watch(). */
        watch: WatchCardSnapshot[],
    }

export type OutputKind = 'print' | 'warn' | 'error' | 'start'

/**
 * Where in the user's own scripts a runtime error was thrown, if it could be
 * recovered from the error's stack trace (see moduleRunner.ts's locateError).
 * `line` is already corrected for the one-line prelude every compiled script
 * carries, so it's directly a line the user's editor can point at.
 */
export interface OutputLocation {
    script: string
    line: number
}

/**
 * A watch() card's values, already formatted to display strings sandbox-side
 * — getters may close over live game objects that aren't structured-cloneable
 * (or that throw), so only their rendered text crosses the boundary.
 */
export interface WatchCardSnapshot {
    label: string
    items: { label: string, value: string, error?: boolean }[]
}

/**
 * The host passes its own origin in the iframe URL so the sandbox can address
 * replies to exactly that origin instead of '*'. An opaque origin has no way to
 * discover its embedder otherwise, and '*' would leak game output to any third
 * party that framed sandbox.html.
 */
export const HOST_ORIGIN_PARAM = 'hostOrigin'

/** Origin string a document with an opaque origin reports in a MessageEvent. */
export const OPAQUE_ORIGIN = 'null'
