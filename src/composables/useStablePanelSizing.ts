import { onBeforeUnmount, onMounted } from 'vue'
import type { Ref } from 'vue'

// A stylesheet rule, injected once and shared by every group using this
// composable, rather than setting flex directly on each panel's own inline
// style. That was the first thing tried here, and it made things *worse*:
// reka's own @layout handler re-renders on every mousemove tick too, and
// Vue's patch of that same element's :style binding — plain flex-basis/
// flex-grow/flex-shrink, no !important — replaces the *entire* inline
// style attribute's relevant properties each time, including a priority
// set moments earlier via element.style.setProperty(prop, value,
// 'important'). !important only actually wins something when it's the
// thing Vue's own plain inline style is being weighed against, which means
// it has to live somewhere Vue's patch can't touch at all — a real
// stylesheet, not the same inline style object Vue keeps overwriting.
// class toggles which panels are pinned; each pinned panel's own target
// pixel size rides in on --stable-size, a custom property, which Vue's
// patch never touches since computePanelFlexBoxStyle doesn't know it
// exists — so it survives every re-render this is trying to sit alongside.
const STYLE_ID = 'stable-panel-sizing-style'

function ensureStyleInjected() {
	if (document.getElementById(STYLE_ID)) return
	const style = document.createElement('style')
	style.id = STYLE_ID
	style.textContent = `[data-slot="panel"].stable-size-pin { flex: 0 0 var(--stable-size) !important; }`
	document.head.appendChild(style)
}

interface StableSizingPanelInstance {
	$el: HTMLElement
	/** Percentage (0-100), read straight from reka's internal layout array — see the note below on why that matters. */
	getSize(): number
}

interface StableSizingSplitterInstance {
	panelsRef: StableSizingPanelInstance[]
}

/**
 * Pins every panel in a splitter group to an exact pixel width/height,
 * recomputed every frame from reka's own live panel sizes, for as long as a
 * drag is active anywhere in that group.
 *
 * The problem this works around, and why it reads panelRef.getSize() rather
 * than the panel element's own rendered box: reka tracks each panel's size
 * internally as a percentage in a `layout` array kept at ~10 decimal digits
 * of precision, but *renders* it as `flex-grow: <size>.toPrecision(3)` — 3
 * significant digits, e.g. "16.8". That rounding is harmless for any single
 * panel in isolation, but a drag's two pivot panels (the ones actually
 * shrinking/growing against each other) are only guaranteed to sum to a
 * constant *before* rounding — each one gets rounded to 3 sig figs
 * independently, and those two independent roundings don't cancel out
 * frame to frame. Confirmed by direct measurement mid-drag: two pivot
 * panels' *rendered* flex-grow strings summed to anywhere from 26.6 to
 * 26.71 across consecutive frames, while the drag's true underlying split
 * barely moved at all between them. Every panel after the pivot pair in DOM
 * order inherits its on-screen *position* from that sum (flexbox lays each
 * sibling's left/top edge at the cumulative width/height of everything
 * before it), so that ~0.1-point wobble in a percentage sum reappears as a
 * ~1px left/right (or up/down) twitch in every later panel's content and
 * border — not a width change in any of them, which is exactly why this
 * was hard to pin down by watching individual panels' own rendered size:
 * every panel's *own* width is fine, only its *position* jitters, because
 * it's inherited from upstream panels whose rounding doesn't perfectly
 * cancel. panelRef.getSize() reads the same unrounded layout value reka
 * itself uses internally, so a pivot pair's sum read this way is exactly
 * constant, not just constant before an intermediate rounding step throws
 * a fraction of a point away on each side independently.
 *
 * (Earlier version of this fix read the panel element's own inline
 * style.flexGrow instead of getSize() — i.e. the already-rounded value —
 * which is why it visibly stabilized each panel's own width but did
 * nothing for the position drift inherited from its neighbors: it was
 * built on the same rounded numbers causing the problem.)
 */
export function useStablePanelSizing(
	splitterRef: Readonly<Ref<StableSizingSplitterInstance | null>>,
	axis: 'width' | 'height',
) {
	onMounted(() => {
		const groupEl = splitterRef.value?.panelsRef[0]?.$el.parentElement
		if (!groupEl) return
		ensureStyleInjected()

		let rafId: number | null = null
		let dragging = false

		function handles() {
			return Array.from(groupEl!.querySelectorAll<HTMLElement>(':scope > [data-slot="handle"]'))
		}

		function tick() {
			const panelRefs = splitterRef.value?.panelsRef ?? []
			const handleExtent = handles().reduce((sum, handle) => {
				const rect = handle.getBoundingClientRect()
				return sum + (axis === 'width' ? rect.width : rect.height)
			}, 0)
			const groupRect = groupEl!.getBoundingClientRect()
			const availableExtent = (axis === 'width' ? groupRect.width : groupRect.height) - handleExtent

			if (availableExtent > 0) {
				for (const panelRef of panelRefs) {
					const px = (panelRef.getSize() / 100) * availableExtent
					panelRef.$el.style.setProperty('--stable-size', `${px.toFixed(3)}px`)
					panelRef.$el.classList.add('stable-size-pin')
				}
			}

			if (dragging) rafId = requestAnimationFrame(tick)
		}

		function clearOverrides() {
			for (const panelRef of splitterRef.value?.panelsRef ?? []) {
				panelRef.$el.classList.remove('stable-size-pin')
				panelRef.$el.style.removeProperty('--stable-size')
			}
		}

		function onMouseDown(event: MouseEvent) {
			if (dragging) return
			if (!(event.target as HTMLElement | null)?.closest('[data-slot="handle"]')) return
			dragging = true
			tick()
		}

		function onMouseUp() {
			if (!dragging) return
			dragging = false
			if (rafId != null) cancelAnimationFrame(rafId)
			rafId = null
			clearOverrides()
		}

		groupEl.addEventListener('mousedown', onMouseDown)
		// Global, not on the group: a drag ends on mouseup wherever the
		// cursor happens to be, not necessarily back over the handle.
		window.addEventListener('mouseup', onMouseUp)

		onBeforeUnmount(() => {
			groupEl.removeEventListener('mousedown', onMouseDown)
			window.removeEventListener('mouseup', onMouseUp)
			if (rafId != null) cancelAnimationFrame(rafId)
			clearOverrides()
		})
	})
}
