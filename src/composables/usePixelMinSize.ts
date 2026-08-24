import { onBeforeUnmount, onMounted, ref } from 'vue'

// The pixel floor every pane's *usable content area* gets, regardless of
// which splitter — horizontal or vertical — it belongs to, or whether this
// particular pane happens to be a leaf (bordered — see EditorView.vue's
// panel-framing rule) or a container (not, by the same rule). reka sizes a
// panel's *border-box* via flex-grow, not its content box, so a leaf pane's
// 1px border on every side already eats 2px per axis before anything gets
// to render inside it — LEAF_BORDER_PX pads the target by exactly that, so
// a leaf pane's actual *content* area still reaches MIN_PANE_CONTENT_PX. A
// container pane, having no border of its own, ends up with a couple of
// harmless extra pixels of headroom instead — nothing renders content
// directly in a container pane (its own nested children do, and each gets
// this same treatment individually), so there's nothing for that headroom
// to affect.
const MIN_PANE_CONTENT_PX = 32
const LEAF_BORDER_PX = 2
const MIN_PANE_PX = MIN_PANE_CONTENT_PX + LEAF_BORDER_PX

/**
 * A splitter minSize, in percent, that resolves to the same actual pixel
 * floor regardless of the group's own orientation or total extent. reka's
 * minSize is always a percentage of its own group, and a horizontal
 * splitter's track is a different pixel size than a vertical one's — so the
 * same flat percentage floor resolves to a visibly narrower or shorter
 * pixel size depending on orientation. This watches one group's own live
 * extent and keeps recalculating the percentage that corresponds to
 * MIN_PANE_PX for it specifically, so every pane's actual drag floor
 * matches every other pane using this composable, not just the ones that
 * happen to share a splitter.
 *
 * The extent handed to that calculation excludes the group's own resize
 * handles: reka's panels sit in the same flex row/column as their handles,
 * but only the panels carry flex-grow — the handles just take a fixed
 * chunk out of the group first, and reka's own percentages already describe
 * a share of what's left over *after* that, not a share of the group's
 * full box. Treating minSize as a percentage of the full group (handles
 * included) asks for a smaller actual share than intended, more so the more
 * handles (and the narrower the group) a given splitter has.
 *
 * anchorPaneId is any one pane id that's *always* present in the target
 * group (docs-pane, being conditionally mounted, wouldn't do for the outer
 * splitter) — its parentElement is the group's own DOM node, the same
 * lookup EditorView.vue's availablePanelWidth already relies on.
 */
// Every change to a panel's minSize makes reka reevaluate that panel's
// constraints (SplitterPanel.vue's own watch on its constraints object) —
// which, regardless of whether the reevaluation ends up actually resizing
// anything, unconditionally flags the whole group's layout as changed
// (reevaluatePanelConstraints sets panelDataArrayChanged = true) and queues
// a full recalculation of it (SplitterGroup.vue's own watch on that flag).
// Recalculating a *different* group's layout because *this* group's own
// extent moved a fraction of a pixel — which happens continuously while
// dragging pretty much any handle, since panes nest inside each other and
// a parent resizing changes every child's rendered box too — stacks an
// async, reactive recalculation on top of reka's own synchronous,
// mousemove-driven one for however many groups happen to be listening, on
// every single tick. That's a real mechanism (confirmed by reading reka's
// own source), worth not doing regardless of how visible its effect turns
// out to be in any one scenario — debouncing so a burst of resize events
// collapses into one recalculation *after* things settle, rather than one
// recalc per tick, keeps a live drag entirely in reka's own hands and lets
// this only catch up once it's actually done.
const SETTLE_DEBOUNCE_MS = 200

export function usePixelMinSize(anchorPaneId: string, axis: 'width' | 'height') {
	const percent = ref(1)
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
			if (extent > 0) percent.value = (MIN_PANE_PX / extent) * 100
		}

		// The very first callback (ResizeObserver always delivers one right
		// after observe() starts) settles immediately, so the first real
		// render already has a correct value instead of the ref(1) fallback
		// for however long the debounce below would otherwise hold it off.
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

	return percent
}
