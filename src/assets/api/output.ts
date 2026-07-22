import { Colors } from "./Colors"
import { timer } from "./core"
import type { Printable } from "./types"

const Output = {
    items: {
        stamps: [] as HTMLElement[],
        msgs: [] as HTMLElement[],
    },
    print, warn, error, clear, printStartMsg, reset
}
export default Output

let printIndex = 0
let lastOut = ''
let consecutiveMsgs = 0
const outputLines = 100

function getCurrentStampTitle(): string {
    return [
        `Time: ${getCurrentStampTime()}`,
        `Frame: ${timer.frame}`
    ].join('\n')
}

function getCurrentStampTime(): string {
    const time = new Date()
    const hr = withLeadingZeroes(time.getHours(), 2)
    const min = withLeadingZeroes(time.getMinutes(), 2)
    const sec = withLeadingZeroes(time.getSeconds(), 2)
    const milli = withLeadingZeroes(time.getMilliseconds(), 3)
    return `${hr}:${min}:${sec}.${milli}`
}

function getCurrentStampFrame(): string {
    return withLeadingZeroes(timer.frame, 6)
}

function getCurrentStampFrameTitle(): string {
    return `Frame: ${timer.frame}`
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
    // TODO: error()
    console.log(args)

    let msg = ''
    for (let arg of args) {
        msg += arg.toString()
    }

    const items = nextOutputItem(msg)
    if (items) {
        // items.stampItem.textContent = getCurrentStampTime()
        items.stampItem.textContent = '⚠'
        items.stampItem.title = getCurrentStampTitle()
        items.stampItem.style.color = '#e64f56'
        // items.stampItem.style.backgroundColor = '#583232' //'#c76352'

        items.msgItem.textContent = msg
        items.msgItem.style.color = '#ff727a'
        // items.msgItem.style.backgroundColor = '#8b4949' //'#ff7860'
    }
    scrollOutput()
}

function warn(...args: Printable[]) {
    // TODO: warn()
    console.log(args)

    let msg = ''
    for (let arg of args) {
        msg += arg.toString()
    }
    const items = nextOutputItem(msg)

    if (items) {
        // items.stampItem.textContent = getCurrentStampTime()
        items.stampItem.textContent = '⚠'
        items.stampItem.title = getCurrentStampTitle()
        items.stampItem.style.color = '#e9c155'
        // items.stampItem.style.backgroundColor = '#d1ae4e'

        items.msgItem.textContent = msg
        items.msgItem.style.color = '#ffe291'
        // items.msgItem.style.backgroundColor = '#ffd561'
    }
    scrollOutput()
}

export function print(...args: Printable[]) {
    // TODO: allow other msg types
    // TODO: allow arbitrary number of msg args
    // TODO: count repeated messages instead of showing them all (chrome console style)
    console.log(args)

    let msg = ''
    for (let arg of args) {
        msg += arg.toString()
    }

    const items = nextOutputItem(msg)
    if (items) {
        // items.stampItem.textContent = getCurrentStampTime()
        // items.stampItem.textContent = '●'
        items.stampItem.title = getCurrentStampTitle()
        items.stampItem.style.color = Colors.NordTextDim
        // items.stampItem.style.backgroundColor = Colors.NordBgDark

        // items.msgItem.textContent = msg
        items.msgItem.style.color = Colors.NordTextBright
        // items.msgItem.style.backgroundColor = Colors.NordBgNeutral

        addOutputItem(items, '●', msg)
    }
    // scrollOutput()
}

function printStartMsg() {
    const items = nextOutputItem()
    if (items) {
        items.stampItem.style.color = Colors.NordTextDim
        items.stampItem.style.backgroundColor = Colors.NordBgDark

        
        items.msgItem.innerHTML = `<i>Running @ ${getCurrentStampTime()}</i>`
        items.msgItem.style.color = Colors.NordTextNeutral
        items.msgItem.style.backgroundColor = Colors.NordBgNeutral

        addOutputItem(items, '☀', undefined)
    }
    lastOut = ''
}

function addOutputItem(items: { stampItem: HTMLElement, msgItem: HTMLElement }, stampText?: string, msgText?: string) {
    items.stampItem.title = getCurrentStampTitle()
    if (msgText === lastOut) {
        items.stampItem.textContent = (++consecutiveMsgs).toString()
    } else if (stampText) {
        items.stampItem.textContent = stampText
    }

    if (msgText && msgText !== lastOut) {
        items.msgItem.textContent = msgText
        lastOut = msgText
        consecutiveMsgs = 1
    }
    console.log(lastOut)
    scrollOutput()
}

function getMaxStampWidth(): number {
    const widths = Output.items.stamps.map(item => item.clientWidth)
    return Math.max(...widths)
}

// ?
function getLastItemIndex(): number {
    const msgs = Output.items.msgs
    for (let i = 0; i < msgs.length; i++) {
        if (msgs[i]?.textContent) {
            continue
        } else {
            return i - 1
        }
    }
    return msgs.length - 1
}

function nextOutputItem(msgText?: string): { stampItem: HTMLElement, msgItem: HTMLElement } | undefined {
    // const nextIndex = getLastItemIndex()
    const nextIndex = msgText === lastOut ? printIndex - 1 : printIndex
    const stampItem = Output.items.stamps[nextIndex]
    const msgItem = Output.items.msgs[nextIndex]

    if (msgText === lastOut) {
        if (stampItem && msgItem) {
            return { stampItem, msgItem }
        }
    }
    
    if (printIndex >= outputLines - 1) {
        for (let i = 0; i < outputLines - 1; i++) {
            const thisStamp = Output.items.stamps[i]
            const nextStamp = Output.items.stamps[i + 1]

            const thisMsg = Output.items.msgs[i]
            const nextMsg = Output.items.msgs[i + 1]

            if (thisStamp && nextStamp && thisMsg && nextMsg) {
                thisStamp.innerHTML = nextStamp.innerHTML
                thisStamp.title = nextStamp.title
                thisStamp.style.color = nextStamp.style.color
                thisStamp.style.backgroundColor = nextStamp.style.backgroundColor
                thisStamp.style.minWidth = '22'

                thisMsg.innerHTML = nextMsg.innerHTML
                thisMsg.style.color = nextMsg.style.color
                thisMsg.style.backgroundColor = nextMsg.style.backgroundColor
            } else {
                continue
            }
        }
    }

    // Trying to get longest stamp to determine width of all stamp items
    const stampWidth = getMaxStampWidth().toString() + 'px'
    for (const stamp of Output.items.stamps) {
        stamp.style.minWidth = stampWidth
    }
    console.log(stampWidth)

    if (printIndex < outputLines - 1) {
        printIndex++
    }

    if (stampItem && msgItem) {
        return { stampItem, msgItem }
    }
}

function clear() {
    for (let i = 0; i < outputLines; i++) {
        const { stamp, msg } = {
            stamp: Output.items.stamps[i],
            msg: Output.items.msgs[i]
        }

        if (msg && stamp) {
            msg.textContent = ''
            stamp.textContent = ''
        }
    }
    printIndex = 0
}

function reset() {
    clear()
    printStartMsg()
}