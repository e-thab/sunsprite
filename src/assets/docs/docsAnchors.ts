/**
 * Landing on a specific spot inside a docs page rather than its top.
 *
 * Two kinds of target share one resolver. A DocSection carries a real DOM id
 * (`section-<id>`), but a member row can't: overloads repeat a name, and a
 * page listing both `goTo(x, y)` and `goTo(other, anchor?)` would need two
 * elements with the same id. Those carry `data-doc-anchor` instead, where
 * duplicates are legal and querySelector's "first in document order" is
 * exactly the row a link to that name should land on — the first overload,
 * with the rest of them immediately below it.
 */

/**
 * Anchors a DocMethod and a DocProperty row answer to. Kept apart by prefix
 * rather than sharing one namespace: a class is free to expose a property and
 * a method under the same name, and the two rows sit in different tables on
 * the same page, so an unprefixed name could resolve to either.
 */
export function methodAnchor(name: string): string {
	return `method-${name}`
}

export function propertyAnchor(name: string): string {
	return `property-${name}`
}

/**
 * The element a docs page scrolls inside: the content pane in the panel, the
 * whole column in the full-page view. Only one of the two is ever mounted —
 * they belong to different routes — so this reaches whichever is live without
 * either view having to say which it is.
 */
/**
 * How long to keep looking before giving up. The target doesn't exist yet when
 * navigation starts — the destination page hasn't rendered — and how many
 * frames that takes isn't knowable here (a version switch resolves its pages
 * through a lazy glob, so the page itself can be a network round trip away).
 * Time rather than a frame count so a 120Hz display doesn't get half the
 * window a 60Hz one does.
 */
const RESOLVE_TIMEOUT_MS = 1500

const SCROLL_CONTAINERS = '.docs-content-scroll, .docs-view'

function scrollContainer(): HTMLElement | null {
	return document.querySelector<HTMLElement>(SCROLL_CONTAINERS)
}

/** How far the page on screen is scrolled, for filing against the entry that's leaving. */
export function currentDocsScroll(): number {
	return scrollContainer()?.scrollTop ?? 0
}

/**
 * Sends a page back to its top, for arriving somewhere with nothing more
 * specific to aim at. A container keeps its scroll position across a page
 * swap, so without this the reader lands mid-way down a document they haven't
 * started — at an offset that meant something on the page they left and
 * nothing on this one.
 *
 * Instant rather than smooth, unlike the anchor scrolling below: there's
 * nothing to follow here, and animating a long page's worth of travel while
 * its content is being replaced underneath just draws the eye to the swap.
 */
function scrollDocsToTop() {
	for (const container of document.querySelectorAll(SCROLL_CONTAINERS)) container.scrollTop = 0
}

/**
 * The one scroll job in flight. Restoring an offset and hunting for an anchor
 * both retry across frames against the same container, so they share this:
 * whichever starts last cancels the other rather than the two taking turns
 * writing different offsets.
 */
let pendingScroll: number | undefined

function cancelPendingScroll() {
	if (pendingScroll !== undefined) cancelAnimationFrame(pendingScroll)
	pendingScroll = undefined
}

/**
 * Puts a page back where its reader left it — what back and forward owe them,
 * as against the fresh start a new page gets.
 *
 * It can't be a single assignment. The offset is only reachable once the
 * destination has rendered tall enough to hold it, and until then the browser
 * clamps the write to whatever the container can currently scroll. So it
 * retries, stopping the moment the offset takes — or, when the page is simply
 * shorter than the one it was recorded on, once the content has stopped
 * growing for a few frames and the clamped position is the honest answer.
 */
export function restoreDocsScroll(top: number) {
	cancelPendingScroll()

	if (top <= 0) {
		scrollDocsToTop()
		return
	}

	const deadline = performance.now() + RESOLVE_TIMEOUT_MS
	let lastHeight = -1
	let unchangedFrames = 0

	function attempt() {
		pendingScroll = undefined
		const container = scrollContainer()
		if (container) {
			container.scrollTop = top
			if (container.scrollTop === top) return

			if (container.scrollHeight === lastHeight) unchangedFrames++
			else {
				lastHeight = container.scrollHeight
				unchangedFrames = 0
			}
			if (unchangedFrames >= 3) return
		}
		if (performance.now() < deadline) pendingScroll = requestAnimationFrame(attempt)
	}

	pendingScroll = requestAnimationFrame(attempt)
}

/** Applied to the target for HIGHLIGHT_MS on arrival; see docsPage.css. */
const HIGHLIGHT_CLASS = 'doc-anchor-target'
const HIGHLIGHT_MS = 1800

function resolve(anchor: string): HTMLElement | null {
	const row = document.querySelector<HTMLElement>(`[data-doc-anchor="${CSS.escape(anchor)}"]`)
	return row ?? document.getElementById(anchor)
}

let highlighted: HTMLElement | undefined
let highlightTimer: ReturnType<typeof setTimeout> | undefined

/**
 * A table row is a poor thing to land on unannounced: the reader arrives at a
 * wall of near-identical signatures with nothing saying which one they asked
 * for. This marks it for a moment instead.
 */
function highlight(el: HTMLElement) {
	clearTimeout(highlightTimer)
	highlighted?.classList.remove(HIGHLIGHT_CLASS)

	// Re-following the same link should replay the animation rather than do
	// nothing visible, and a class that's already there won't restart it —
	// reading a layout property between the remove and the add is what forces
	// the style recalc that makes the re-add count as a change.
	el.classList.remove(HIGHLIGHT_CLASS)
	void el.offsetWidth
	el.classList.add(HIGHLIGHT_CLASS)

	highlighted = el
	highlightTimer = setTimeout(() => {
		el.classList.remove(HIGHLIGHT_CLASS)
		if (highlighted === el) highlighted = undefined
	}, HIGHLIGHT_MS)
}

/**
 * Scrolls `anchor` into view once whatever page owns it has rendered, and
 * marks it briefly on arrival. Safe to call before navigation has settled —
 * that's the normal case.
 */
export function scrollToDocAnchor(anchor: string) {
	// A second link followed while the first is still waiting replaces it:
	// the reader asked for somewhere else, and two pending scrolls would
	// fight over the same scroll container.
	cancelPendingScroll()

	const deadline = performance.now() + RESOLVE_TIMEOUT_MS

	function attempt() {
		const el = resolve(anchor)
		if (!el) {
			pendingScroll = performance.now() < deadline ? requestAnimationFrame(attempt) : undefined
			return
		}
		pendingScroll = undefined

		// `center` rather than the `start` DocsToc uses for whole sections: a
		// row scrolled flush to the top of the pane loses the table header and
		// the section title that say what it's a row *of*. `inline: 'nearest'`
		// keeps the horizontal scroller a wide table sits in (.doc-table-scroll)
		// where the reader left it — the row spans it either way, so there's
		// nothing horizontal to correct.
		el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
		highlight(el)
	}

	pendingScroll = requestAnimationFrame(attempt)
}
