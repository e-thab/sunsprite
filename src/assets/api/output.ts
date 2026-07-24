import { Colors } from "./Colors"
import { timer } from "./core"
import type { Printable } from "./types"
import type { SandboxToParentMessage } from "./sandboxProtocol"

export type OutputItem = { stamp: HTMLElement, msg: HTMLElement }

const Output = {
    items: [] as OutputItem[],
    print, warn, error, clear, printStartMsg, reset, init
}
export default Output

// When this module runs inside the sandboxed game iframe, it has no DOM output panel
// of its own (that lives in the parent app's OutputPane.vue) -- forward calls out instead
// of touching Output.items/DOM directly.
const inSandboxFrame = window.self !== window.top

function postToParent(message: SandboxToParentMessage) {
    window.parent.postMessage(message, '*')
}

function joinArgs(args: Printable[]): string {
    let msg = ''
    for (const arg of args) {
        msg += arg.toString()
    }
    return msg
}

let printIndex = 0
let lastMsg = ''
let consecutiveMsgs = 1
let totalMsgCount = 0

const outputLines = 100

function init(outputItems: OutputItem[]) {
    Output.items = outputItems.slice()
    reset()
}

function getCurrentStampTitle(): string {
    const lines = [
        `Time: ${getCurrentStampTime()}`,
        `Frame: ${timer.frame}`,
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

function error(...args: Printable[]) {
    console.log('err:', ...args)

    const msg = joinArgs(args)

    if (inSandboxFrame) {
        postToParent({ type: 'sunsprite:output', kind: 'error', msg })
        return
    }

    addOutputItem(msg, (item) => {
        item.stamp.textContent = '⚠'
        item.stamp.style.color = '#e64f56'

        item.msg.textContent = msg
        item.msg.style.color = '#ff727a'
    })
}

function warn(...args: Printable[]) {
    console.log('warn:', ...args)

    const msg = joinArgs(args)

    if (inSandboxFrame) {
        postToParent({ type: 'sunsprite:output', kind: 'warn', msg })
        return
    }

    addOutputItem(msg, (item) => {
        item.stamp.textContent = '⚠'
        item.stamp.style.color = '#e9c155'

        item.msg.textContent = msg
        item.msg.style.color = '#ffe291'
    })
}

export function print(...args: Printable[]) {
    console.log('print:', ...args)

    const msg = joinArgs(args)

    if (inSandboxFrame) {
        postToParent({ type: 'sunsprite:output', kind: 'print', msg })
        return
    }

    addOutputItem(msg, (item) => {
        item.stamp.textContent = '●'
        item.stamp.style.color = Colors.NordTextDim
        // item.stamp.style.backgroundColor = Colors.NordBgDark

        item.msg.textContent = msg
        item.msg.style.color = Colors.NordTextBright
        // item.msg.style.backgroundColor = Colors.NordBgNeutral
    })
    
}

function printStartMsg() {
    if (inSandboxFrame) {
        postToParent({ type: 'sunsprite:output', kind: 'printStartMsg' })
        return
    }

    const content = `<i>Running @ ${getCurrentStampTime()}</i>`
    addOutputItem(content, (item) => {
        item.stamp.textContent = '☀'
        item.stamp.style.color = Colors.NordTextDim
        item.stamp.style.backgroundColor = Colors.NordBgDark
        
        item.msg.innerHTML = content
        item.msg.style.color = Colors.NordTextNeutral
        item.msg.style.backgroundColor = Colors.NordBgNeutral
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
    console.log(minWidth)
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
            thisItem.stamp.style.color = nextItem.stamp.style.color
            thisItem.stamp.style.backgroundColor = nextItem.stamp.style.backgroundColor
            
            thisItem.msg.innerHTML = nextItem.msg.innerHTML
            thisItem.msg.style.color = nextItem.msg.style.color
            thisItem.msg.style.backgroundColor = nextItem.msg.style.backgroundColor

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
    if (inSandboxFrame) {
        postToParent({ type: 'sunsprite:output', kind: 'clear' })
        return
    }

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