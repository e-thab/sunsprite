import { ref } from "vue"
import Colors from "@api/Colors"
import type { Printable } from "@api/types"
import type { OutputLocation } from "@/sandbox/protocol"
import { GLYPH_CLASS, countGlyph, installOutputGlyphStyles } from "@api/outputGlyphs"
import type { GlyphKey } from "@api/outputGlyphs"

// Host-side output panel renderer. This owns the real DOM nodes in
// OutputPane.vue and runs in the editor app, *not* in the sandbox — user code
// can't reach any of it. Messages produced by print()/warn()/error() inside the
// game arrive over postMessage and land here via render(); the exported
// print/warn/error are for the app's own UI code.
//
// Note this file deliberately imports nothing from ./core: core drags in Phaser
// and now only ever loads inside the sandbox iframe. The frame number that used
// to come from `timer.frame` is carried on each message instead.
//
// Rendering is split in two: a message is folded into a plain-JS ring buffer
// synchronously (no DOM, no layout, bounded memory), and the DOM is brought in
// line with that ring once per animation frame. A script that prints 2000 lines
// in one frame therefore costs 2000 cheap object writes plus a single DOM pass
// over the ≤100 rows that could actually be seen, instead of 2000 full
// rewrites of the pool. See flush().

type OutputType = 'print' | 'warn' | 'error' | 'start'

/**
 * One reusable row in the DOM pool. `msgText` and `link` are permanent child
 * nodes rather than markup rebuilt per message: updating a Text node's `data`
 * and toggling `hidden` costs nothing next to the innerHTML round-trip
 * (serialize to a string, reparse it) this used to do for every row on every
 * printed line.
 */
export type OutputItem = {
    el: HTMLElement
    stamp: HTMLElement
    /** The stamp's single permanent icon slot; `hidden` when the row is empty. */
    glyph: HTMLElement
    msg: HTMLElement
    msgText: Text
    link: HTMLElement
    /** Which slot revision this row currently shows; see Slot.seq. */
    renderedSeq: number
}

/**
 * The rendered state of one output line, held as data so that folding a
 * message costs no layout. Everything here is a primitive the flush copies
 * straight onto a node.
 */
type Slot = {
    /** Bumped on every mutation, so flush can skip rows that haven't changed. */
    seq: number
    stampGlyph: GlyphKey | null
    stampTitle: string
    stampClass: string
    msgText: string
    msgClass: string
    jump: OutputLocation | null
    jumpKind: 'error' | 'warn'
    jumpMessage: string
}

const Output = {
    items: [] as OutputItem[],
    print, warn, error, clear, printStartMsg, reset, init, render, setFrame, onJumpToError, onErrorLocation, setAutoScroll
}
export default Output

// Set by whoever wants to handle a click on a runtime error/warning's "at
// script:line" link (EditorView.vue, which owns both the file tree and the
// code editor ref) — this module only renders the output panel, it has no
// way to switch files or reach into Monaco itself. `kind` lets the handler
// pick the matching highlight color, and `message` is the original text
// (without the "at script:line" suffix) so a warning's native squiggly can
// show it on hover instead of a generic placeholder (see CodeEditor.vue's
// revealErrorLine).
let jumpHandler: ((script: string, line: number, kind: 'error' | 'warn', message: string) => void) | null = null

function onJumpToError(handler: (script: string, line: number, kind: 'error' | 'warn', message: string) => void) {
    jumpHandler = handler
}

// Fired for *every* runtime error/warning that carries a location, not just
// clicked ones, so the offending line is already highlighted the moment it
// happens — without forcing the user's editor tab to switch away from
// whatever they're looking at (that's what the click link, above, is for).
// Deliberately still synchronous (unlike the panel's own rendering): an error
// is not the flood case, and the editor highlight shouldn't wait a frame.
let locationHandler: ((script: string, line: number, kind: 'error' | 'warn', message: string) => void) | null = null

function onErrorLocation(handler: (script: string, line: number, kind: 'error' | 'warn', message: string) => void) {
    locationHandler = handler
}

// Bumped once per flush in which a print/warn/error landed (but deliberately
// not for the "Running @ ..." start message printed at the top of each run) so
// OutputPane.vue can flash its Output tab when new lines land while another
// tab is active. Per-flush rather than per-message: a thousand prints in one
// frame are one flash, not a thousand watcher wake-ups.
export const outputActivity = ref(0)

// The scroll container the pool lives in, captured at init so neither the
// scroll nor the stamp-width write has to go back through getElementById.
let container: HTMLElement | null = null

let slots: Slot[] = []

// Monotonic count of *distinct* messages written. `writeCursor % slots.length`
// is the next slot a distinct message takes, which — once the ring has wrapped
// — is also the oldest slot, and so the top of the visible list.
let writeCursor = 0

let lastMsg = ''
let lastType = ''
let consecutiveMsgs = 1
let totalMsgCount = 0
let seqCounter = 0

// Last frame count reported by the sandbox, shown in a stamp's tooltip.
let currentFrame = 0

// Whether new messages are *allowed* to pin the panel to its newest line — the
// project setting. Whether they actually do also depends on the user not having
// scrolled away from the bottom; see isScrolledToBottom.
//
// Module-level rather than read from the store directly: this file is imported
// by the sandbox path too, and reaching for a Pinia store from here would drag
// the whole app's store graph into that bundle. OutputPane.vue pushes the value
// in.
let autoScroll = true

function setAutoScroll(enabled: boolean) {
    autoScroll = enabled
}

// The fixed stamp for each kind of message. A repeat count replaces these with
// a whole-number glyph, and warn and error share the one alert sign — they are
// already told apart by color.
const PRINT_GLYPH: GlyphKey = 'point'
const ALERT_GLYPH: GlyphKey = 'alert'
const START_GLYPH: GlyphKey = 'sunsprite'

function emptySlot(): Slot {
    return {
        seq: ++seqCounter,
        stampGlyph: null,
        stampTitle: '',
        stampClass: 'output-stamp',
        msgText: '',
        msgClass: 'output-msg',
        jump: null,
        jumpKind: 'error',
        jumpMessage: '',
    }
}

/**
 * Builds the fixed pool of row elements and takes ownership of `panel`.
 * Reusing a fixed pool means `lineCount` *is* the "max lines kept" setting;
 * the ring buffer above it holds the matching line data.
 */
function init(panel: HTMLElement, lineCount: number) {
    cancelFlush()
    installOutputGlyphStyles()

    container = panel
    panel.replaceChildren()

    const items: OutputItem[] = []
    const fragment = document.createDocumentFragment()
    for (let i = 0; i < lineCount; i++) {
        const item = createOutputRow()
        items.push(item)
        fragment.appendChild(item.el)
    }
    panel.appendChild(fragment)

    Output.items = items
    slots = items.map(() => emptySlot())

    // One delegated listener on the container, rather than one per row: the
    // link nodes are permanent children now, so there's nothing to re-bind
    // when a row's content is recycled. Re-init on the same panel (a changed
    // line limit) is a no-op here — addEventListener ignores a duplicate
    // (type, listener, capture) triple.
    panel.addEventListener('click', onPanelClick)

    reset()
}

function createOutputRow(): OutputItem {
    const el = document.createElement('div')
    el.className = 'output-item'

    const stamp = document.createElement('div')
    stamp.className = 'output-stamp'

    // A stamp is one icon slot, built once and then repainted by swapping class
    // names — see outputGlyphs.ts for why it isn't a <UIcon>.
    const glyph = document.createElement('i')
    glyph.className = 'output-glyph'
    glyph.hidden = true
    stamp.appendChild(glyph)

    // Should I use <pre>? too powerful?
    const msg = document.createElement('pre')
    msg.className = 'output-msg'

    const msgText = document.createTextNode('')
    const link = document.createElement('span')
    link.className = 'output-location-link'
    link.hidden = true

    msg.appendChild(msgText)
    msg.appendChild(link)
    el.appendChild(stamp)
    el.appendChild(msg)

    return { el, stamp, glyph, msg, msgText, link, renderedSeq: -1 }
}

function onPanelClick(event: MouseEvent) {
    const target = (event.target as HTMLElement).closest('.output-location-link') as HTMLElement | null
    const { jumpScript, jumpLine, jumpKind, jumpMessage } = target?.dataset ?? {}
    if (jumpHandler && jumpScript && jumpLine) jumpHandler(jumpScript, Number(jumpLine), jumpKind === 'warn' ? 'warn' : 'error', jumpMessage ?? '')
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
        case 'warn': return warnMsg(text, location)
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
    addOutputItem(msg, 'error', (slot) => {
        slot.stampGlyph = ALERT_GLYPH
        slot.stampClass = 'output-stamp output-item--error'

        slot.msgClass = 'output-msg output-item--error'
        setSlotMessage(slot, msg, 'error', location)
    })
    activityPending = true

    if (location) locationHandler?.(location.script, location.line, 'error', msg)
}

/**
 * Records the message text plus, when a source location was recovered from
 * the stack trace, the "at script:line" tag appended to the same line — the
 * click target that onJumpToError's delegated listener (see onPanelClick)
 * looks for. `kind` picks the link's color (error vs warning) and is carried
 * in the link's dataset so that same listener knows which highlight color to
 * apply when it's clicked. The trailing space before the tag lives in the
 * message text, so it doesn't pick up the link's underline.
 */
function setSlotMessage(slot: Slot, msg: string, kind: 'error' | 'warn' = 'error', location?: OutputLocation) {
    slot.msgText = location ? `${msg} ` : msg
    slot.jump = location ?? null
    slot.jumpKind = kind
    slot.jumpMessage = msg
}

function warn(...args: Printable[]) {
    console.log(' %cwarn:', `color: ${Colors.Goldenrod}; font-weight: 100; font-style: italic;`, ...args)
    warnMsg(joinArgs(args))
}

function warnMsg(msg: string, location?: OutputLocation) {
    addOutputItem(msg, 'warn', (slot) => {
        slot.stampGlyph = ALERT_GLYPH
        slot.stampClass = 'output-stamp output-item--warn'

        slot.msgClass = 'output-msg output-item--warn'
        setSlotMessage(slot, msg, 'warn', location)
    })
    activityPending = true

    if (location) locationHandler?.(location.script, location.line, 'warn', msg)
}

export function print(...args: Printable[]) {
    console.log('%cprint:', `color: ${Colors.Gray}; font-weight: 100; font-style: italic;`, ...args)
    printMsg(joinArgs(args))
}

function printMsg(msg: string) {
    addOutputItem(msg, 'print', (slot) => {
        slot.stampGlyph = PRINT_GLYPH
        slot.stampClass = 'output-stamp'

        slot.msgClass = 'output-msg'
        setSlotMessage(slot, msg)
    })
    activityPending = true
}

function printStartMsg() {
    startMsg(`Running @ ${getCurrentStampTime()}`)
}

function startMsg(content: string) {
    addOutputItem(content, 'start', (slot) => {
        slot.stampGlyph = START_GLYPH
        slot.stampClass = 'output-stamp'

        slot.msgClass = 'output-msg output-item--start'
        setSlotMessage(slot, content)
    })
}

/**
 * Folds one message into the ring. Pure data — no DOM, no layout — so a flood
 * of prints costs only what the flush that follows it costs.
 */
function addOutputItem(msgContent: string, type: OutputType, fill: (slot: Slot) => void) {
    const outputLines = slots.length
    if (outputLines === 0) return

    // A repeat overwrites the line it's repeating (which is the newest one, so
    // it needs no reordering) and turns its stamp into a count.
    const repeat = writeCursor > 0 && msgContent === lastMsg && type === lastType

    let index: number
    if (repeat) {
        index = (writeCursor - 1) % outputLines
        consecutiveMsgs++
    } else {
        index = writeCursor % outputLines
        // Recycling a slot that already held a line means its row has to move
        // to the bottom of the list; a slot being used for the first time is
        // already in the right place.
        if (writeCursor >= outputLines) moveQueue.push(index)
        writeCursor++

        lastMsg = msgContent
        lastType = type
        consecutiveMsgs = 1
    }

    const slot = slots[index]
    if (!slot) return

    fill(slot)

    if (repeat) {
        slot.stampGlyph = countGlyph(consecutiveMsgs)
    }
    slot.stampTitle = getCurrentStampTitle()
    slot.seq = ++seqCounter

    totalMsgCount++
    scheduleFlush()
}

// ---------------------------------------------------------------------------
// Flush: the one place that touches the DOM.
// ---------------------------------------------------------------------------

let flushHandle = 0
let needsFullReorder = false
/** Slots recycled since the last flush, in insertion order. */
const moveQueue: number[] = []
let activityPending = false

// How close to the bottom still counts as being at it. Scroll metrics can land
// a fraction of a pixel out — fractional line heights, browser zoom — and an
// exact comparison would leave a panel the user had scrolled all the way back
// down still refusing to follow.
const AT_BOTTOM_EPSILON_PX = 2

/**
 * Whether the panel is sitting at its newest line.
 *
 * Someone who scrolls up to read something shouldn't have the panel yank itself
 * back down every time the running game prints, so following the newest line is
 * conditional on already being there — and scrolling back to the bottom resumes
 * it, with nothing to re-enable by hand.
 *
 * There is deliberately no scroll listener behind this. The only moment the
 * answer matters is right before new output lands, so flush asks then, which
 * also keeps the reads off the path of every stray scroll event.
 *
 * A panel that isn't on screen (another tab is showing, or the pane is
 * collapsed) reports all three metrics as 0 and so counts as at the bottom.
 * That's what's wanted: output that arrived while it was hidden should be
 * waiting at the newest line when it comes back, not above the fold.
 */
function isScrolledToBottom(panel: HTMLElement): boolean {
    return panel.scrollHeight - panel.scrollTop - panel.clientHeight <= AT_BOTTOM_EPSILON_PX
}

function scheduleFlush() {
    if (flushHandle) return
    flushHandle = requestAnimationFrame(flush)
}

function cancelFlush() {
    if (flushHandle) cancelAnimationFrame(flushHandle)
    flushHandle = 0
    moveQueue.length = 0
    needsFullReorder = false
    activityPending = false
}

function flush() {
    flushHandle = 0

    const outputLines = slots.length
    if (!container || outputLines === 0) return

    // Decided before anything is written, for two reasons: the question is
    // where the user was when this output arrived, and reading scroll metrics
    // after the writes below would force a second synchronous layout.
    const followNewest = autoScroll && isScrolledToBottom(container)

    // Content: only rows whose slot actually changed since the last flush get
    // written, so a burst that churned three lines writes three rows.
    for (let i = 0; i < outputLines; i++) {
        const slot = slots[i]!
        const row = Output.items[i]
        if (!row || row.renderedSeq === slot.seq) continue

        writeRow(row, slot)
        row.renderedSeq = slot.seq
    }

    // Order: recycling a row means moving one node to the end rather than
    // copying every row's content up by one. A burst that wrapped the whole
    // pool reorders it in a single fragment swap instead.
    if (needsFullReorder || moveQueue.length >= outputLines) {
        const start = writeCursor >= outputLines ? writeCursor % outputLines : 0
        const fragment = document.createDocumentFragment()
        for (let i = 0; i < outputLines; i++) {
            const row = Output.items[(start + i) % outputLines]
            if (row) fragment.appendChild(row.el)
        }
        container.appendChild(fragment)
    } else {
        for (const index of moveQueue) {
            const row = Output.items[index]
            if (row) container.appendChild(row.el)
        }
    }
    needsFullReorder = false
    moveQueue.length = 0

    // The one forced layout in the whole path, and it's once per frame rather
    // than once per message. Skipped entirely when the panel isn't following,
    // which is what leaves a user reading back through earlier output where
    // they were while a running game keeps printing.
    if (followNewest) container.scrollTop = container.scrollHeight

    if (activityPending) {
        activityPending = false
        outputActivity.value++
    }
}

function writeRow(row: OutputItem, slot: Slot) {
    row.stamp.title = slot.stampTitle
    row.stamp.className = slot.stampClass

    const key = slot.stampGlyph
    if (key) {
        row.glyph.className = GLYPH_CLASS[key]
        row.glyph.hidden = false
    } else if (!row.glyph.hidden) {
        row.glyph.hidden = true
    }

    row.msg.className = slot.msgClass
    row.msgText.data = slot.msgText

    const jump = slot.jump
    if (jump) {
        row.link.textContent = `at ${jump.script}:${jump.line}`
        row.link.className = `output-location-link output-location-link--${slot.jumpKind}`
        row.link.dataset.jumpScript = jump.script
        row.link.dataset.jumpLine = String(jump.line)
        row.link.dataset.jumpKind = slot.jumpKind
        row.link.dataset.jumpMessage = slot.jumpMessage
        row.link.hidden = false
    } else if (!row.link.hidden) {
        row.link.textContent = ''
        row.link.hidden = true
    }
}

function clear() {
    for (let i = 0; i < slots.length; i++) {
        slots[i] = emptySlot()
    }

    writeCursor = 0

    // Repeat-collapsing state has to go with the lines it was tracking —
    // without this, a print identical to the last pre-clear message would be
    // counted as a repeat of a line that no longer exists.
    lastMsg = ''
    lastType = ''
    consecutiveMsgs = 1
    totalMsgCount = 0

    // Back to the pool's natural order, since every line is empty again.
    needsFullReorder = true
    moveQueue.length = 0
    scheduleFlush()
}

function reset() {
    clear()
    printStartMsg()
}
