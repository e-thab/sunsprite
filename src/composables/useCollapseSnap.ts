import { onBeforeUnmount, onMounted, ref } from 'vue'
import { COLLAPSE_THRESHOLD_PX, MIN_PANE_CONTENT_PX } from './usePixelMinSize'

// Makes a collapsing pane snap *at* its minimum size instead of below it, and
// keeps the rest of the layout still while it sits between that minimum and
// its floor.
//
// reka already snaps a below-minimum collapsible pane to one of its two
// endpoints, but it picks whichever is nearer (SplitterGroup's resizePanel),
// which leaves a dead band: every size in
// [(collapsedSize + minSize) / 2, minSize) is pushed back up to minSize, so
// the pane sticks at its minimum for ~34px of cursor travel and only then
// jumps to collapsed. What's wanted instead is the jump right at minSize,
// with the cursor-runs-ahead part happening *after* it — the pane sitting at
// its floor while the pointer catches up, then pushing the panes beyond it.
//
// Reproducing that takes three separate things, because a drag below the
// threshold has three distinct phases:
//
//   The snap. The pane gets `minSize` and `maxSize` both set to its collapsed
//   size, leaving reka nowhere to put it but there. Its siblings are pinned
//   at their current size at the same time — all except the pane across the
//   handle — because collapsing sheds a chunk of size in one step and reka
//   hands that surplus to whichever pane its outward walk reaches first, a
//   direction that flips with the drag. Without those pins the space
//   sometimes jumped clean past the neighbour into a pane on the far side of
//   the layout. The neighbour itself is deliberately left unpinned: it's the
//   one that should absorb, and leaving it free also gives the group somewhere
//   to absorb sub-pixel rounding rather than over-constraining it.
//
//   The still window, once the pane is at its floor but the pointer hasn't
//   earned either end yet. Here the mouse events are simply withheld from
//   reka (see `swallow` below) rather than pinned against, which is both
//   simpler and exact: reka recomputes each move from the layout captured at
//   drag start plus total pointer delta, so an event it never sees changes
//   nothing and costs it no state. Pinning every pane instead — the obvious
//   approach, and the first one tried — over-constrains the group: the pins
//   are measured percentages that can't sum to exactly 100, so reka
//   renormalizes, re-clamps against the pins, and the pane ends up flipping
//   between collapsed and its old size on alternating frames.
//
//   Past the floor, where nothing is held at all, so reka's own cascade
//   pushes the panes beyond as usual.
//
// All of it is driven off the raw pointer rather than reka's layout events:
// the phases turn on the size the drag is *asking* for, and once a pane is
// pinned its reported size is the pinned one, which says nothing about
// whether the pointer has come back out yet. The requested size is just "size
// when the drag started, plus how far the pointer has moved along the axis" —
// the same quantity reka derives its own delta from.
//
// Mouse events specifically, not pointer events: reka binds mousemove on
// document.body (see its utils/registry.js), and withholding an event it
// listens for means intercepting the same kind, in the capture phase, above
// where it listens.

export type CollapsePin =
    | { kind: 'collapse' }
    /** Held at this exact percentage of the group, so it can't absorb a collapse. */
    | { kind: 'freeze', sizePct: number }

interface DragPane {
    id: string
    el: HTMLElement
    /** Size along the drag axis when the drag began, in px. */
    startSize: number
    /** +1 for the pane before the handle (grows as the pointer advances), -1 for the one after. */
    sign: 1 | -1
}

interface DragState {
    horizontal: boolean
    /** Pointer coordinate along the drag axis when the drag began. */
    startCoord: number
    /** The two panes either side of the dragged handle. */
    panes: DragPane[]
    /** Every panel in the group, for converting px to the percentages reka works in. */
    groupPanels: HTMLElement[]
    /**
     * The percentage each currently-pinned sibling was captured at, held for
     * as long as it stays pinned. Re-measuring every move looks equivalent —
     * a pinned pane isn't moving — but the percentage is a share of the
     * panels' combined extent, which shifts as its neighbours resize, so the
     * value drifted by a hair each event. Every drift is a constraint change,
     * and reka rebuilds the group on any constraint change.
     */
    frozenSizes: Map<string, number>
}

function sizeOf(el: HTMLElement, horizontal: boolean): number {
    const rect = el.getBoundingClientRect()
    return horizontal ? rect.width : rect.height
}

/**
 * Reactive per-pane pins. Feed them into a SplitterItem's own constraints —
 * see EditorView.vue, which does that for every collapsible pane in all three
 * of its splitters.
 */
export function useCollapseSnap() {
    const pins = ref<ReadonlyMap<string, CollapsePin>>(new Map())

    let drag: DragState | null = null

    function pinFor(paneId: string): CollapsePin | undefined {
        return pins.value.get(paneId)
    }

    function setPins(next: Map<string, CollapsePin>) {
        // Replaced rather than mutated, and only when something actually
        // differs: every consumer reads this through a computed, and a fresh
        // Map each move would rebuild every splitter's items for no reason —
        // which in reka's case means re-validating whole layouts.
        const current = pins.value
        if (current.size === next.size) {
            let same = true
            for (const [id, pin] of next) {
                const existing = current.get(id)
                if (!existing || existing.kind !== pin.kind
                    || (pin.kind === 'freeze' && existing.kind === 'freeze' && existing.sizePct !== pin.sizePct)) {
                    same = false
                    break
                }
            }
            if (same) return
        }
        pins.value = next
    }

    function onMouseDown(event: MouseEvent) {
        const target = event.target as HTMLElement | null
        const handle = target?.closest?.<HTMLElement>('[data-resize-handle]')
        const group = handle?.parentElement
        if (!handle || !group) return

        // A group lays its panels and handles out along one axis; the handle
        // carries the direction its own group was given.
        const horizontal = handle.getAttribute('data-orientation') !== 'vertical'

        const before = handle.previousElementSibling as HTMLElement | null
        const after = handle.nextElementSibling as HTMLElement | null

        const panes: DragPane[] = []
        // The pane before the handle grows as the pointer advances (its size
        // moves with the delta); the one after shrinks by the same amount.
        if (before?.dataset.slot === 'panel' && before.id) {
            panes.push({ id: before.id, el: before, startSize: sizeOf(before, horizontal), sign: 1 })
        }
        if (after?.dataset.slot === 'panel' && after.id) {
            panes.push({ id: after.id, el: after, startSize: sizeOf(after, horizontal), sign: -1 })
        }
        if (!panes.length) return

        const groupPanels = [...group.children]
            .filter((el): el is HTMLElement => el instanceof HTMLElement && el.dataset.slot === 'panel')

        drag = {
            horizontal,
            startCoord: horizontal ? event.clientX : event.clientY,
            panes,
            groupPanels,
            frozenSizes: new Map(),
        }
    }

    function onMouseMove(event: MouseEvent) {
        if (!drag) return

        const coord = drag.horizontal ? event.clientX : event.clientY
        const delta = coord - drag.startCoord

        // reka's percentages are shares of the panels' combined extent, not of
        // the group box (the handles sit outside that space), so summing the
        // panels is exactly the right basis.
        const basis = drag.groupPanels.reduce((total, el) => total + sizeOf(el, drag!.horizontal), 0)

        const next = new Map<string, CollapsePin>()
        const captured = new Map<string, number>()
        const pivotIds = new Set(drag.panes.map((pane) => pane.id))

        const freezeSiblings = () => {
            if (basis <= 0) return
            for (const panel of drag!.groupPanels) {
                if (!panel.id || pivotIds.has(panel.id) || next.has(panel.id)) continue
                const sizePct = drag!.frozenSizes.get(panel.id) ?? (sizeOf(panel, drag!.horizontal) / basis) * 100
                captured.set(panel.id, sizePct)
                next.set(panel.id, { kind: 'freeze', sizePct })
            }
        }

        let swallow = false
        for (const pane of drag.panes) {
            // What this drag is asking the pane to be, before any of reka's
            // clamping — which is what every phase below turns on.
            const requested = pane.startSize + pane.sign * delta
            if (requested >= COLLAPSE_THRESHOLD_PX) continue

            next.set(pane.id, { kind: 'collapse' })
            if (requested < MIN_PANE_CONTENT_PX) continue

            // Between the floor and the threshold. Hold the siblings so the
            // pane across the handle is the only one that can take what a
            // collapse sheds...
            freezeSiblings()

            // ...and once the pane is already sitting at its floor, hold the
            // whole drag instead: it can't be any size in this band, so
            // nothing should move until the pointer earns one end or the
            // other. False on the frame the collapse itself lands, since the
            // pane is still large then and the drag is taking size away from
            // it — which is exactly what lets the neighbour absorb it.
            if (requested > sizeOf(pane.el, drag.horizontal)) swallow = true
        }

        // Only what's still pinned carries its capture forward; anything
        // released re-measures if it's pinned again later in the same drag.
        drag.frozenSizes = captured
        setPins(next)

        if (swallow) {
            event.stopPropagation()
            event.stopImmediatePropagation()
        }
    }

    function onMouseUp() {
        drag = null
        // Pins are a drag-time override only. Left in place they'd freeze the
        // pane at its collapsed size for good — including against the
        // click-to-expand path (CollapsiblePane's overlay), which resizes the
        // panel and would be clamped straight back down.
        setPins(new Map())
    }

    onMounted(() => {
        // Capture phase on the document: above document.body, where reka
        // binds its own listeners, so a pin is in place for the same event
        // reka resizes on and a withheld event never reaches it at all.
        document.addEventListener('mousedown', onMouseDown, true)
        document.addEventListener('mousemove', onMouseMove, true)
        document.addEventListener('mouseup', onMouseUp, true)
    })

    onBeforeUnmount(() => {
        document.removeEventListener('mousedown', onMouseDown, true)
        document.removeEventListener('mousemove', onMouseMove, true)
        document.removeEventListener('mouseup', onMouseUp, true)
    })

    return { pinFor, pins }
}
