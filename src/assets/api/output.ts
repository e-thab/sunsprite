import { Colors } from "./Colors"
import { timer } from "./core"
import type { Printable } from "./types"

const Output = {
    items: {
        stamps: [] as HTMLElement[],
        msgs: [] as HTMLElement[],
    },
    print, warn, error, clear, printStartMsg
}
export default Output

// export const outputItems: {
// 	stamps: HTMLElement[],
// 	msgs: HTMLElement[]
// } = {
// 	stamps: [],
// 	msgs: []
// }
let _printIndex = 0
const _outputLines = 100

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

    const items = _getNextOutputItems()
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
    const items = _getNextOutputItems()

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

    const items = _getNextOutputItems()
    if (items) {
        // items.stampItem.textContent = getCurrentStampTime()
        items.stampItem.textContent = '●'
        items.stampItem.title = getCurrentStampTitle()
        items.stampItem.style.color = Colors.NordTextDim
        // items.stampItem.style.backgroundColor = Colors.NordBgDark

        items.msgItem.textContent = msg
        items.msgItem.style.color = Colors.NordTextBright
        // items.msgItem.style.backgroundColor = Colors.NordBgNeutral
    }
    scrollOutput()
}

function printStartMsg() {
    const items = _getNextOutputItems()
    if (items) {
        // items.stampItem.textContent = getCurrentStampTime()
        items.stampItem.textContent = '☀'
        items.stampItem.style.color = Colors.NordTextDim
        items.stampItem.title = getCurrentStampTitle()
        items.stampItem.style.backgroundColor = Colors.NordBgDark

        items.msgItem.innerHTML = `<i>Running @ ${getCurrentStampTime()}</i>`
        items.msgItem.style.color = Colors.NordTextNeutral
        items.msgItem.style.backgroundColor = Colors.NordBgNeutral
    }
}

function _getNextOutputItems(): { stampItem: HTMLElement, msgItem: HTMLElement } | undefined {
    if (_printIndex >= _outputLines - 1) {
        for (let i = 0; i < _outputLines - 1; i++) {
            const thisStamp = Output.items.stamps[i]
            const nextStamp = Output.items.stamps[i + 1]

            const thisMsg = Output.items.msgs[i]
            const nextMsg = Output.items.msgs[i + 1]

            if (thisStamp && nextStamp && thisMsg && nextMsg) {
                thisStamp.innerHTML = nextStamp.innerHTML
                thisStamp.title = nextStamp.title
                thisStamp.style.color = nextStamp.style.color
                thisStamp.style.backgroundColor = nextStamp.style.backgroundColor

                thisMsg.innerHTML = nextMsg.innerHTML
                thisMsg.style.color = nextMsg.style.color
                thisMsg.style.backgroundColor = nextMsg.style.backgroundColor
            } else {
                continue
            }
        }
    }

    const stampItem = Output.items.stamps[_printIndex]
    const msgItem = Output.items.msgs[_printIndex]

    if (_printIndex < _outputLines - 1) {
        _printIndex++
    }

    if (stampItem && msgItem) {
        return { stampItem, msgItem }
    }
}

function clear() {
    for (let i = 0; i < _outputLines; i++) {
        const { stamp, msg } = {
            stamp: Output.items.stamps[i],
            msg: Output.items.msgs[i]
        }

        if (msg && stamp) {
            msg.textContent = ''
            stamp.textContent = ''
        }
    }
    _printIndex = 0
}