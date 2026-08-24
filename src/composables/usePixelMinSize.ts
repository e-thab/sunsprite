import { onBeforeUnmount, onMounted, ref } from 'vue'

// The pixel floor every pane's *usable content area* gets, regardless of
// which splitter — horizontal or vertical — it belongs to, or whether this
// particular pane happens to be a leaf or a container. Leaf panes are
// framed with an inset box-shadow rather than a real border specifically so
// this number needs no adjustment for it: box-shadow has no box-model
// presence at all, so a leaf's content-box and its flex-computed border-box
// are the same box (see EditorView.vue's panel-framing rule for what this
// used to cost when it was a real border instead).
const MIN_PANE_CONTENT_PX = 32

// The pixel size, in either dimension, below which CollapsiblePane swaps a
// pane's real content for its label/icon overlay (see that component's own
// comment for why). Shared from here — rather than each declaring its own
// copy of the same number — because it doubles as reka's own minSize below:
// dragging a pane past this point is exactly where its content already
// stops being usable, so that's also where a drag should stop tracking the
// cursor smoothly and start snapping toward an endpoint, rather than
// leaving a dead zone where a pane can sit at any arbitrary size between
// "already showing collapsed content" and its real pixel floor.
export const COLLAPSE_THRESHOLD_PX = 100

/**
 * Two splitter-constraint percentages, in the group's own live extent, for
 * a pane using this pixel floor: `minSize` (COLLAPSE_THRESHOLD_PX) and
 * `collapsedSize` (MIN_PANE_CONTENT_PX). Meant to be spread onto a
 * `collapsible: true` SplitterItem together — reka's own resize logic
 * (SplitterGroup's resizePanel) already snaps a collapsible panel to
 * whichever of minSize or collapsedSize is closer once a drag crosses the
 * halfway point between them, the same native mechanism output-v-pane's
 * collapsedSize: 0 already uses to hide it entirely on a deliberate drag
 * past its floor. Using COLLAPSE_THRESHOLD_PX as minSize instead of
 * MIN_PANE_CONTENT_PX (which is all this used to export, back when every
 * pane just clamped there with no snap) means that mechanism now activates
 * exactly where CollapsiblePane's own overlay already takes over, and
 * lands on MIN_PANE_CONTENT_PX — a real, still-visible floor, not fully
 * hidden — instead of 0.
 *
 * Both numbers resolve against the *same* pixel floor regardless of the
 * group's own orientation or total extent. reka's minSize/collapsedSize are
 * always a percentage of their own group, and a horizontal splitter's track
 * is a different pixel size than a vertical one's — so a flat percentage
 * would resolve to a visibly different pixel size depending on orientation.
 * This watches one group's own live extent and keeps recalculating the
 * percentages that correspond to these two fixed pixel points for it
 * specifically, so every pane's actual drag behavior matches every other
 * pane using this composable, not just the ones that happen to share a
 * splitter.
 *
 * The extent handed to that calculation excludes the group's own resize
 * handles: reka's panels sit in the same flex row/column as their handles,
 * but only the panels carry flex-grow — the handles just take a fixed
 * chunk out of the group first, and reka's own percentages already describe
 * a share of what's left over *after* that, not a share of the group's
 * full box. Treating these as a percentage of the full group (handles
 * included) asks for a smaller actual share than intended, more so the more
 * handles (and the narrower the group) a given splitter has. It does *not*
 * need to (and, before EditorView.vue's leaf panes were switched to
 * box-shadow framing, incorrectly tried to) also account for how many of
 * the group's *panels* are leaves: a leaf's border used to force its own
 * flex-basis: 0 to clamp up to its border's own width (box-sizing:
 * border-box can't render a content-box smaller than zero), which quietly
 * ate into every sibling's share of the group's free space by an amount
 * that depended on how many *other* panels in the same group also happened
 * to be bordered leaves — a fundamentally different number for the outer
 * splitter (mostly borderless container panes) than for a nested one (all
 * leaves). Reproduced and confirmed in a bare, reka-free flexbox page.
 * Framing leaves with box-shadow instead removes the clamp at its source,
 * so this composable doesn't need to know or guess at a group's panel
 * composition to land on the right number.
 *
 * anchorPaneId is any one pane id that's *always* present in the target
 * group (docs-pane, being conditionally mounted, wouldn't do for the outer
 * splitter) — its parentElement is the group's own DOM node, the same
 * lookup EditorView.vue's availablePanelWidth already relies on.
 */
// Every change to a panel's minSize/collapsedSize makes reka reevaluate
// that panel's constraints (SplitterPanel.vue's own watch on its
// constraints object) — which, regardless of whether the reevaluation ends
// up actually resizing anything, unconditionally flags the whole group's
// layout as changed (reevaluatePanelConstraints sets
// panelDataArrayChanged = true) and queues a full recalculation of it
// (SplitterGroup.vue's own watch on that flag). Recalculating a *different*
// group's layout because *this* group's own extent moved a fraction of a
// pixel — which happens continuously while dragging pretty much any
// handle, since panes nest inside each other and a parent resizing changes
// every child's rendered box too — stacks an async, reactive
// recalculation on top of reka's own synchronous, mousemove-driven one for
// however many groups happen to be listening, on every single tick. That's
// a real mechanism (confirmed by reading reka's own source), worth not
// doing regardless of how visible its effect turns out to be in any one
// scenario — debouncing so a burst of resize events collapses into one
// recalculation *after* things settle, rather than one recalc per tick,
// keeps a live drag entirely in reka's own hands and lets this only catch
// up once it's actually done.
const SETTLE_DEBOUNCE_MS = 200

export function usePixelMinSize(anchorPaneId: string, axis: 'width' | 'height') {
	const minSize = ref(2)
	const collapsedSize = ref(1)
	let observer: ResizeObserver | null = null
	let debounceTimer: ReturnType<typeof setTimeout> | null = null

	onMounted(() => {
		const groupEl = document.getElementById(anchorPaneId)?.parentElement
		if (!groupEl) return

		function recalculate(entry: ResizeObserverEntry) {
			const handleExtent = Array.from(groupEl!.querySelectorAll(':scope > [data-slot="handle"]'))
				.reduce((sum, handle) => {
					const rect = handle.getBoundingClientRect()
					return sum + (axis === 'width' ? rect.width : rect.height)
				}, 0)
			const groupExtent = axis === 'width' ? entry.contentRect.width : entry.contentRect.height
			const extent = groupExtent - handleExtent
			if (extent > 0) {
				minSize.value = (COLLAPSE_THRESHOLD_PX / extent) * 100
				collapsedSize.value = (MIN_PANE_CONTENT_PX / extent) * 100
			}
		}

		// The very first callback (ResizeObserver always delivers one right
		// after observe() starts) settles immediately, so the first real
		// render already has correct values instead of the ref() fallbacks
		// above for however long the debounce below would otherwise hold it off.
		let isFirstCallback = true

		observer = new ResizeObserver(([entry]) => {
			if (!entry) return
			if (isFirstCallback) {
				isFirstCallback = false
				recalculate(entry)
				return
			}
			if (debounceTimer) clearTimeout(debounceTimer)
			debounceTimer = setTimeout(() => recalculate(entry), SETTLE_DEBOUNCE_MS)
		})
		observer.observe(groupEl)
	})

	onBeforeUnmount(() => {
		observer?.disconnect()
		if (debounceTimer) clearTimeout(debounceTimer)
	})

	return { minSize, collapsedSize }
}
