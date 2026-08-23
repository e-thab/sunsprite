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
export function usePixelMinSize(anchorPaneId: string, axis: 'width' | 'height') {
	const percent = ref(1)
	let observer: ResizeObserver | null = null

	onMounted(() => {
		const groupEl = document.getElementById(anchorPaneId)?.parentElement
		if (!groupEl) return
		observer = new ResizeObserver(([entry]) => {
			if (!entry) return
			const handleExtent = Array.from(groupEl.querySelectorAll(':scope > [data-slot="handle"]'))
				.reduce((sum, handle) => {
					const rect = handle.getBoundingClientRect()
					return sum + (axis === 'width' ? rect.width : rect.height)
				}, 0)
			const groupExtent = axis === 'width' ? entry.contentRect.width : entry.contentRect.height
			const extent = groupExtent - handleExtent
			if (extent > 0) percent.value = (MIN_PANE_PX / extent) * 100
		})
		observer.observe(groupEl)
	})

	onBeforeUnmount(() => observer?.disconnect())

	return percent
}
