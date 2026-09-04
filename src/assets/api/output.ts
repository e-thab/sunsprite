import { ref } from "vue"
import Colors from "@api/Colors"
import type { Printable } from "@api/types"
import type { OutputLocation } from "@/sandbox/protocol"

// Host-side output panel renderer. This owns the real DOM nodes in
// OutputPane.vue and runs in the editor app, *not* in the sandbox — user code
// can't reach any of it. Messages produced by print()/warn()/error() inside the
// game arrive over postMessage and land here via render(); the exported
// print/warn/error are for the app's own UI code.
//
// Note this file deliberately imports nothing from ./core: core drags in Phaser
// and now only ever loads inside the sandbox iframe. The frame number that used
// to come from `timer.frame` is carried on each message instead.

type OutputType = 'print' | 'warn' | 'error' | 'start'
export type OutputItem = { stamp: HTMLElement, msg: HTMLElement }

const Output = {
    items: [] as OutputItem[],
    print, warn, error, clear, printStartMsg, reset, init, render, setFrame, onJumpToError, onErrorLocation
}
export default Output

// Set by whoever wants to handle a click on a runtime error's "at script:line"
// link (EditorView.vue, which owns both the file tree and the code editor
// ref) — this module only renders the output panel, it has no way to switch
// files or reach into Monaco itself.
let jumpHandler: ((script: string, line: number) => void) | null = null

function onJumpToError(handler: (script: string, line: number) => void) {
    jumpHandler = handler
}

// Fired for *every* runtime error that carries a location, not just clicked
// ones, so the offending line is already highlighted the moment it happens —
// without forcing the user's editor tab to switch away from whatever they're
// looking at (that's what the click link, above, is for).
let locationHandler: ((script: string, line: number) => void) | null = null

function onErrorLocation(handler: (script: string, line: number) => void) {
    locationHandler = handler
}

// Bumped on every print/warn/error (but deliberately not the "Running @ ..."
// start message printed at the top of each run) so OutputPane.vue can flash
// its Output tab when a new line lands while another tab is active.
export const outputActivity = ref(0)

let printIndex = 0
let lastMsg = ''
let lastType = ''
let consecutiveMsgs = 1
let totalMsgCount = 0

// Last frame count reported by the sandbox, shown in a stamp's tooltip.
let currentFrame = 0

const outputLines = 100

function init(outputItems: OutputItem[]) {
    Output.items = outputItems.slice()

    // One listener per (reused) item element, not per message — shiftItemsUp
    // moves content between items via innerHTML, which carries the location
    // link's data-* attributes along with it, so this stays correct without
    // needing to re-bind anything per message.
    for (const item of Output.items) {
        item.msg.addEventListener('click', (event) => {
            const target = (event.target as HTMLElement).closest('.output-error-location') as HTMLElement | null
            const { jumpScript, jumpLine } = target?.dataset ?? {}
            if (jumpHandler && jumpScript && jumpLine) jumpHandler(jumpScript, Number(jumpLine))
        })
    }

    reset()
}

/** Keeps stamp tooltips roughly in sync between runs of user code. */
function setFrame(frame: number) {
    currentFrame = frame
}

/** Entry point for output forwarded from the sandbox. */
function render(kind: 'print' | 'warn' | 'error' | 'start', text: string, frame: number, location?: OutputLocation) {
    currentFrame = frame

    switch (kind) {
        case 'print': return printMsg(text)
        case 'warn': return warnMsg(text)
        case 'error': return errorMsg(text, location)
        case 'start': return startMsg(text)
    }
}

function getCurrentStampTitle(): string {
    const lines = [
        `Time: ${getCurrentStampTime()}`,
        `Frame: ${currentFrame}`,
        `Msg #: ${totalMsgCount}`
    ]

    if (consecutiveMsgs > 1) {
        lines.push(`Repeats: ${consecutiveMsgs}`)
    }

    return lines.join('\n')
}

function getCurrentStampTime(): string {
    const time = new Date()
    const hr = withLeadingZeroes(time.getHours(), 2)
    const min = withLeadingZeroes(time.getMinutes(), 2)
    const sec = withLeadingZeroes(time.getSeconds(), 2)
    const milli = withLeadingZeroes(time.getMilliseconds(), 3)
    return `${hr}:${min}:${sec}.${milli}`
}

function withLeadingZeroes(num: number, length: number) {
    let strNum = num.toString()

    if (strNum.length >= length) {
        return strNum
    }
    while (strNum.length < length) {
        strNum = '0' + strNum
    }

    return strNum
}

function scrollOutput() {
    const panel = document.getElementById('output-panel')
    if (panel) panel.scrollTop = panel.scrollHeight
}

/** Joins the varargs the app's own UI code passes into one message string. */
function joinArgs(args: Printable[]): string {
    let msg = ''
    for (let arg of args) {
        msg += arg.toString()
    }
    return msg
}

/**
 * Display an error message in the output panel.
 * @param msgs The error messages to display.
 */
function error(...msgs: Printable[]) {
    console.log('  %cerr:', `color: ${Colors.IndianRed}; font-weight: 100; font-style: italic;`, ...msgs)
    errorMsg(joinArgs(msgs))
}

function errorMsg(msg: string, location?: OutputLocation) {
    addOutputItem(msg, 'error', (item) => {
        item.stamp.textContent = '⚠'
        item.stamp.className = 'output-stamp output-item--error'

        item.msg.className = 'output-msg output-item--error'
        renderMessageWithLocation(item.msg, msg, location)
    })
    outputActivity.value++

    if (location) locationHandler?.(location.script, location.line)
}

/**
 * Renders the error text plus, when a source location was recovered from the
 * stack trace, a clickable "at script:line" tag appended to the same line —
 * the click target that onJumpToError's delegated listener (see init) looks
 * for.
 */
function renderMessageWithLocation(el: HTMLElement, msg: string, location?: OutputLocation) {
    el.textContent = msg
    if (!location) return

    el.appendChild(document.createTextNode(' '))
    const link = document.createElement('span')
    link.className = 'output-error-location'
    link.textContent = `at ${location.script}:${location.line}`
    link.dataset.jumpScript = location.script
    link.dataset.jumpLine = String(location.line)
    el.appendChild(link)
}

function warn(...args: Printable[]) {
    console.log(' %cwarn:', `color: ${Colors.Goldenrod}; font-weight: 100; font-style: italic;`, ...args)
    warnMsg(joinArgs(args))
}

function warnMsg(msg: string) {
    addOutputItem(msg, 'warn', (item) => {
        item.stamp.textContent = '⚠'
        item.stamp.className = 'output-stamp output-item--warn'

        item.msg.textContent = msg
        item.msg.className = 'output-msg output-item--warn'
    })
    outputActivity.value++
}

export function print(...args: Printable[]) {
    console.log('%cprint:', `color: ${Colors.Gray}; font-weight: 100; font-style: italic;`, ...args)
    printMsg(joinArgs(args))
}

function printMsg(msg: string) {
    addOutputItem(msg, 'print', (item) => {
        item.stamp.textContent = '●'
        item.stamp.className = 'output-stamp'

        item.msg.textContent = msg
        item.msg.className = 'output-msg'
    })
    outputActivity.value++
}

function printStartMsg() {
    startMsg(`Running @ ${getCurrentStampTime()}`)
}

function startMsg(content: string) {
    addOutputItem(content, 'start', (item) => {
        item.stamp.textContent = '☀'
        item.stamp.className = 'output-stamp'

        item.msg.textContent = content
        item.msg.className = 'output-msg output-item--start'
    })
}

function addOutputItem(msgContent: string, type: OutputType, updateItem: (item: OutputItem) => void) {
    // Find index of next output item
    let index = printIndex
    if (msgContent === lastMsg && type === lastType) {
        if (printIndex < outputLines - 1) {
            // If same msg as last time and not at the last item, use previous index
            index = printIndex - 1
        }
    } else {
        if (printIndex < outputLines - 1) {
            // If different msg and not at last item, increment index for next call
            printIndex++
        } else {
            // If different msg and at last item, set index to last and shift items
            printIndex = outputLines - 1
            shiftItemsUp()
        }
    }

    const item = Output.items[index]
    if (!item) return

    // Apply styling/content through function
    updateItem(item)

    // Update stamp content for consecutives
    if (msgContent === lastMsg && type === lastType) {
        if (++consecutiveMsgs > 99) {
            item.stamp.textContent = '99+'
        } else {
            item.stamp.textContent = consecutiveMsgs.toString()
        }
    } else {
        lastMsg = msgContent
        lastType = type
        consecutiveMsgs = 1
    }
    item.stamp.title = getCurrentStampTitle()
    // item.stamp.dataset.title = getCurrentStampTitle()

    // Adjust all stamp widths to match widest
    const minWidth = getMinWidth()
    for (const item of Output.items) {
        item.stamp.style.width = minWidth
        item.msg.style.width = minWidth
    }

    totalMsgCount++
    scrollOutput()
}

function shiftItemsUp() {
    const minWidth = getMinWidth()

    for (let i = 0; i < outputLines - 1; i++) {
        const thisItem = Output.items[i]
        const nextItem = Output.items[i + 1]

        if (thisItem && nextItem) {
            thisItem.stamp.innerHTML = nextItem.stamp.innerHTML
            thisItem.stamp.title = nextItem.stamp.title
            thisItem.stamp.className = nextItem.stamp.className

            thisItem.msg.innerHTML = nextItem.msg.innerHTML
            thisItem.msg.className = nextItem.msg.className

            thisItem.stamp.style.minWidth = minWidth
            nextItem.stamp.style.minWidth = minWidth
            thisItem.msg.style.minWidth = minWidth
            nextItem.msg.style.minWidth = minWidth
        }
    }
}

function getMinWidth(): string {
    const chars = Output.items.map(item => item.stamp.textContent.length)
    const max = Math.max(...chars)
    return (22 + (max - 1) * 7).toString() + 'px'
}

function clear() {
    for (const item of Output.items) {
        item.stamp.innerHTML = ''
        item.msg.innerHTML = ''
    }
    printIndex = 0
    totalMsgCount = 0
}

function reset() {
    lastMsg = ''
    lastType = ''
    printIndex = 0
    consecutiveMsgs = 1
    totalMsgCount = 0

    clear()
    printStartMsg()
}
