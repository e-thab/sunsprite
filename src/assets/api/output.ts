import { Colors } from "./Colors"
import type { Printable } from "./types"

// Host-side output panel renderer. This owns the real DOM nodes in
// OutputPane.vue and runs in the editor app, *not* in the sandbox — user code
// can't reach any of it. Messages produced by print()/warn()/error() inside the
// game arrive over postMessage and land here via render(); the exported
// print/warn/error are for the app's own UI code.
//
// Note this file deliberately imports nothing from ./core: core drags in Phaser
// and now only ever loads inside the sandbox iframe. The frame number that used
// to come from `timer.frame` is carried on each message instead.

export type OutputItem = { stamp: HTMLElement, msg: HTMLElement }

const Output = {
    items: [] as OutputItem[],
    print, warn, error, clear, printStartMsg, reset, init, render, setFrame
}
export default Output

let printIndex = 0
let lastMsg = ''
let consecutiveMsgs = 1
let totalMsgCount = 0

// Last frame count reported by the sandbox, shown in a stamp's tooltip.
let currentFrame = 0

const outputLines = 100

function init(outputItems: OutputItem[]) {
    Output.items = outputItems.slice()
    reset()
}

/** Keeps stamp tooltips roughly in sync between runs of user code. */
function setFrame(frame: number) {
    currentFrame = frame
}

/** Entry point for output forwarded from the sandbox. */
function render(kind: 'print' | 'warn' | 'error' | 'start', text: string, frame: number) {
    currentFrame = frame

    switch (kind) {
        case 'print': return printMsg(text)
        case 'warn': return warnMsg(text)
        case 'error': return errorMsg(text)
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

function error(...args: Printable[]) {
    console.log('  %cerr:', `color: ${Colors.IndianRed}; font-weight: 100; font-style: italic;`, ...args)
    errorMsg(joinArgs(args))
}

function errorMsg(msg: string) {
    addOutputItem(msg, (item) => {
        item.stamp.textContent = '⚠'
        item.stamp.className = 'output-stamp output-item--error'

        item.msg.textContent = msg
        item.msg.className = 'output-msg output-item--error'
    })
}

function warn(...args: Printable[]) {
    console.log(' %cwarn:', `color: ${Colors.Goldenrod}; font-weight: 100; font-style: italic;`, ...args)
    warnMsg(joinArgs(args))
}

function warnMsg(msg: string) {
    addOutputItem(msg, (item) => {
        item.stamp.textContent = '⚠'
        item.stamp.className = 'output-stamp output-item--warn'

        item.msg.textContent = msg
        item.msg.className = 'output-msg output-item--warn'
    })
}

export function print(...args: Printable[]) {
    console.log('%cprint:', `color: ${Colors.Gray}; font-weight: 100; font-style: italic;`, ...args)
    printMsg(joinArgs(args))
}

function printMsg(msg: string) {
    addOutputItem(msg, (item) => {
        item.stamp.textContent = '●'
        item.stamp.className = 'output-stamp'

        item.msg.textContent = msg
        item.msg.className = 'output-msg'
    })
}

function printStartMsg() {
    startMsg(`Running @ ${getCurrentStampTime()}`)
}

function startMsg(content: string) {
    addOutputItem(content, (item) => {
        item.stamp.textContent = '☀'
        item.stamp.className = 'output-stamp'

        item.msg.textContent = content
        item.msg.className = 'output-msg output-item--start'
    })
}

function addOutputItem(msgContent: string, updateItem: (item: OutputItem) => void) {
    // Find index of next output item
    let index = printIndex
    if (msgContent === lastMsg) {
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
    if (msgContent === lastMsg) {
        if (++consecutiveMsgs > 99) {
            item.stamp.textContent = '99+'
        } else {
            item.stamp.textContent = consecutiveMsgs.toString()
        }
    } else {
        lastMsg = msgContent
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
    printIndex = 0
    consecutiveMsgs = 1
    totalMsgCount = 0

    clear()
    printStartMsg()
}
