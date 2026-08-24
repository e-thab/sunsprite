import { HOST_ORIGIN_PARAM, type HostMessage, type SandboxMessage } from './protocol'

// Sandbox side of the host<->sandbox link. Kept separate from main.ts so that
// output.ts can send without importing the whole bootstrap (and creating an
// import cycle through core.ts).
//
// `parent` is captured here at module scope, before any user code exists. User
// scripts get `parent`/`window`/`document` shadowed in their own scope by
// moduleRunner.ts, and even if a determined script digs the real globals back
// out of a Function constructor, it gains nothing: everything the protocol lets
// the sandbox say to the host is something the host would happily do for the
// game anyway (print a line, ask for a script the user already owns, report
// fps). No message grants access to the app's DOM, storage, or session — that's
// the property to preserve when adding new SandboxMessage variants.
const hostWindow = window.parent
const hostOrigin = new URLSearchParams(window.location.search).get(HOST_ORIGIN_PARAM) ?? ''

export function postToHost(message: SandboxMessage) {
    // Addressed to the host's exact origin rather than '*', so that if someone
    // else ever frames runner.html the browser silently drops the message
    // instead of handing them the game's output.
    if (!hostOrigin || hostWindow === window) return
    hostWindow.postMessage(message, hostOrigin)
}

export function onHostMessage(handler: (message: HostMessage) => void) {
    window.addEventListener('message', (event) => {
        if (event.source !== hostWindow) return
        if (hostOrigin && event.origin !== hostOrigin) return
        handler(event.data as HostMessage)
    })
}
