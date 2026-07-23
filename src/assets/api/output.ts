import { Colors } from "./Colors"
import { timer } from "./core"
import type { Printable } from "./types"

type OutputItem = { stampItem: HTMLElement, msgItem: HTMLElement }

const Output = {
    items: {
        stamps: [] as HTMLElement[],
        msgs: [] as HTMLElement[],
    },
    print, warn, error, clear, printStartMsg, reset
}
export default Output

let printIndex = 0
let lastMsg = ''
let consecutiveMsgs = 0

let lastOutputItem: OutputItem
let nextOutputItem: OutputItem

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
    console.log('err:', ...args)

    let msg = ''
    for (let arg of args) {
        msg += arg.toString()
    }

    const item = msg === lastMsg ? nextOutputItem : lastOutputItem
    if (item) {
        // item.stampItem.textContent = getCurrentStampTime()
        // item.stampItem.textContent = '⚠'
        // item.stampItem.title = getCurrentStampTitle()
        item.stampItem.style.color = '#e64f56'
        // item.stampItem.style.backgroundColor = '#583232' //'#c76352'

        // item.msgItem.textContent = msg
        item.msgItem.style.color = '#ff727a'
        // item.msgItem.style.backgroundColor = '#8b4949' //'#ff7860'

        addOutputItem(item, '⚠', msg)
    }
    // scrollOutput()
}

function warn(...args: Printable[]) {
    // TODO: warn()
    console.log('warn:', ...args)

    let msg = ''
    for (let arg of args) {
        msg += arg.toString()
    }

    const item = msg === lastMsg ? nextOutputItem : lastOutputItem
    if (item) {
        // item.stampItem.textContent = getCurrentStampTime()
        // item.stampItem.textContent = '⚠'
        // item.stampItem.title = getCurrentStampTitle()
        item.stampItem.style.color = '#e9c155'
        // item.stampItem.style.backgroundColor = '#d1ae4e'

        // item.msgItem.textContent = msg
        item.msgItem.style.color = '#ffe291'
        // item.msgItem.style.backgroundColor = '#ffd561'

        addOutputItem(item, '⚠', msg)
    }
    // scrollOutput()
}

export function print(...args: Printable[]) {
    // TODO: allow other msg types
    // TODO: allow arbitrary number of msg args
    // TODO: count repeated messages instead of showing them all (chrome console style)
    console.log('print:', ...args)

    let msg = ''
    for (let arg of args) {
        msg += arg.toString()
    }

    const item = msg === lastMsg ? nextOutputItem : lastOutputItem
    if (item) {
        // item.stampItem.textContent = getCurrentStampTime()
        // item.stampItem.textContent = '●'
        item.stampItem.title = getCurrentStampTitle()
        item.stampItem.style.color = Colors.NordTextDim
        // item.stampItem.style.backgroundColor = Colors.NordBgDark

        // item.msgItem.textContent = msg
        item.msgItem.style.color = Colors.NordTextBright
        // item.msgItem.style.backgroundColor = Colors.NordBgNeutral

        addOutputItem(item, '●', msg)
    }
    // scrollOutput()
}

function printStartMsg() {
    const item = nextOutputItem
    if (item) {
        item.stampItem.style.color = Colors.NordTextDim
        item.stampItem.style.backgroundColor = Colors.NordBgDark

        
        item.msgItem.innerHTML = `<i>Running @ ${getCurrentStampTime()}</i>`
        item.msgItem.style.color = Colors.NordTextNeutral
        item.msgItem.style.backgroundColor = Colors.NordBgNeutral

        addOutputItem(item, '☀', undefined)
    }
    lastMsg = ''
}

function addOutputItem(item: OutputItem, stampText?: string, msgText?: string) {
    if (printIndex >= outputLines - 1) {
        printIndex = outputLines - 1
        shiftItemsUp()
    } else {
        printIndex++
    }

    const nextStamp = Output.items.stamps[printIndex]
    const nextMsg = Output.items.msgs[printIndex]
    if (!nextStamp || !nextMsg) return
    nextOutputItem = {
        stampItem: nextStamp,
        msgItem: nextMsg
    }
    lastOutputItem = item

    item.stampItem.title = getCurrentStampTitle()
    if (msgText === lastMsg) {
        item.stampItem.textContent = (++consecutiveMsgs).toString()
    } else if (stampText) {
        item.stampItem.textContent = stampText
    }

    if (msgText && msgText !== lastMsg) {
        item.msgItem.textContent = msgText
        lastMsg = msgText
        consecutiveMsgs = 1
    }
    console.log(lastMsg)
    scrollOutput()
}

function shiftItemsUp() {
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
            // thisStamp.style.minWidth = '22'

            thisMsg.innerHTML = nextMsg.innerHTML
            thisMsg.style.color = nextMsg.style.color
            thisMsg.style.backgroundColor = nextMsg.style.backgroundColor
        } else {
            continue
        }
    }
}

function getMaxStampWidth(): number {
    const widths = Output.items.stamps.map(item => item.clientWidth)
    return Math.max(...widths)
}

function _nextOutputItem(msgText?: string): OutputItem | undefined {
    // const nextIndex = getLastItemIndex()
    // const nextIndex = msgText === lastOut ? printIndex - 1 : printIndex

    const stampItem = Output.items.stamps[printIndex]
    const msgItem = Output.items.msgs[printIndex]

    if (msgText === lastMsg) {
        if (stampItem && msgItem) {
            return { stampItem, msgItem }
        }
    }
    
    // if (printIndex >= outputLines - 1) {
    //     printIndex = outputLines - 1
    //     for (let i = 0; i < outputLines - 1; i++) {
    //         const thisStamp = Output.items.stamps[i]
    //         const nextStamp = Output.items.stamps[i + 1]

    //         const thisMsg = Output.items.msgs[i]
    //         const nextMsg = Output.items.msgs[i + 1]

    //         if (thisStamp && nextStamp && thisMsg && nextMsg) {
    //             thisStamp.innerHTML = nextStamp.innerHTML
    //             thisStamp.title = nextStamp.title
    //             thisStamp.style.color = nextStamp.style.color
    //             thisStamp.style.backgroundColor = nextStamp.style.backgroundColor
    //             // thisStamp.style.minWidth = '22'

    //             thisMsg.innerHTML = nextMsg.innerHTML
    //             thisMsg.style.color = nextMsg.style.color
    //             thisMsg.style.backgroundColor = nextMsg.style.backgroundColor
    //         } else {
    //             continue
    //         }
    //     }
    // } else {
    //     printIndex++
    // }

    // Trying to get longest stamp to determine width of all stamp items
    // const stampWidth = getMaxStampWidth().toString() + 'px'
    // for (const stamp of Output.items.stamps) {
    //     stamp.style.minWidth = stampWidth
    // }
    // console.log(stampWidth)

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