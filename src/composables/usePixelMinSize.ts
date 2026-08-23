import { onBeforeUnmount, onMounted, ref } from 'vue'

// The pixel floor every pane in the editor shares, regardless of which
// splitter — horizontal or vertical — it belongs to. Deliberately smaller
// than CollapsiblePane's own label/icon thresholds: this is reka's *hard*
// floor (how far a drag can actually go), those are presentation thresholds
// (what the pane shows once it's small) — the hard floor has to sit below
// both, or the smallest presentation state (the icon) could never actually
// be reached by dragging a single pane's own handle to its limit.
const MIN_PANE_PX = 32

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
			const extent = axis === 'width' ? entry.contentRect.width : entry.contentRect.height
			if (extent > 0) percent.value = (MIN_PANE_PX / extent) * 100
		})
		observer.observe(groupEl)
	})

	onBeforeUnmount(() => observer?.disconnect())

	return percent
}
