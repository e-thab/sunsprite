import Colors from '@/assets/api/Colors'
import { Clock } from '@/assets/api/core'
import type { Printable } from '@/assets/api/types'
import { postToHost } from './channel'
import type { OutputKind } from './protocol'

// Sandbox-side stand-in for the output panel. Shares the shape of the host's
// Output (src/assets/api/output.ts) so core.ts and the user-facing print/warn/
// error API call it exactly as before, but there is no DOM here — each message
// is stringified and posted to the host, which does the rendering.

const Output = {
    print, warn, error, clear, printStartMsg
}
export default Output

/**
 * Flattens varargs the same way the panel used to, before crossing the
 * postMessage boundary. Doing it here (rather than sending the raw args) keeps
 * the payload structured-cloneable no matter what the user passed — a Sprite,
 * a function, a cyclic object — and matches the old `arg.toString()` behavior.
 */
function joinArgs(args: Printable[]): string {
    let msg = ''
    for (let arg of args) {
        try {
            msg += String(arg)
        } catch {
            // A user object with a throwing toString() shouldn't kill the run.
            msg += '<unprintable>'
        }
    }
    return msg
}

function send(kind: OutputKind, text: string) {
    postToHost({ type: 'output', kind, text, frame: Clock.frame })
}

export function print(...args: Printable[]) {
    console.log('%cprint:', `color: ${Colors.Gray}; font-weight: 100; font-style: italic;`, ...args)
    send('print', joinArgs(args))
}

function warn(...args: Printable[]) {
    console.log(' %cwarn:', `color: ${Colors.Goldenrod}; font-weight: 100; font-style: italic;`, ...args)
    send('warn', joinArgs(args))
}

function error(...args: Printable[]) {
    console.log('  %cerr:', `color: ${Colors.IndianRed}; font-weight: 100; font-style: italic;`, ...args)
    send('error', joinArgs(args))
}

function printStartMsg() {
    const time = new Date()
    const hr = withLeadingZeroes(time.getHours(), 2)
    const min = withLeadingZeroes(time.getMinutes(), 2)
    const sec = withLeadingZeroes(time.getSeconds(), 2)
    const milli = withLeadingZeroes(time.getMilliseconds(), 3)
    send('start', `Running @ ${hr}:${min}:${sec}.${milli}`)
}

function clear() {
    postToHost({ type: 'output-clear' })
}

function withLeadingZeroes(num: number, length: number) {
    let strNum = num.toString()
    while (strNum.length < length) {
        strNum = '0' + strNum
    }
    return strNum
}
