import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'

// --- Card packing ---------------------------------------------------------
// Cards vary in both width (own content) and height (row count), so no pure
// CSS layout packs them tightly: grid row-tracks span the whole row (unrelated
// cards get stretched to match), multi-column forces fixed-width lanes, and
// flex-wrap only ever looks at the current line (a short card can't drop into
// a gap left by an earlier, taller neighbor).
//
// This does real rectangle bin-packing instead ("maximal rectangles"): keep
// an explicit list of free rectangles, starting with the whole container.
// Each card takes the free rect that puts it highest (then leftmost), and
// placing it splits every free rect it overlaps into whatever unclaimed
// pieces remain around it. A single "current skyline height per column"
// model (the first version of this) can't represent a real gap that sits
// *below* a later, wider card's overhang — e.g. a narrow card over a wide
// one leaves an empty pocket beside the narrow one that the skyline model
// forgets about the moment the wide card's height gets recorded for that
// whole column. Tracking actual free rectangles keeps that pocket visible.
//
// Shared between InfoPanel.vue and WatchPanel.vue so both live-value panels
// pack their cards identically.
export const PANEL_PADDING = 12
// Cards are absolutely positioned by the packer, so neighbours would sit flush
// against each other without this — margins on the tiles themselves can't
// separate them.
const CARD_GAP = 2
const UNBOUNDED_HEIGHT = 1_000_000

interface FreeRect { x: number, y: number, width: number, height: number }
interface CardBox { key: string, width: number, height: number }

function rectsIntersect(a: FreeRect, b: FreeRect): boolean {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

function rectContains(outer: FreeRect, inner: FreeRect): boolean {
    return inner.x >= outer.x && inner.y >= outer.y
        && inner.x + inner.width <= outer.x + outer.width
        && inner.y + inner.height <= outer.y + outer.height
}

// Drop any free rect that's fully covered by another one, so the list stays
// small and placement never prefers a redundant rect over a real choice.
function pruneContainedRects(rects: FreeRect[]): FreeRect[] {
    return rects.filter((rect, i) => !rects.some((other, j) => i !== j && rectContains(other, rect)))
}

function packCards(containerWidth: number, cards: CardBox[], gap: number): Map<string, { x: number, y: number }> {
    const positions = new Map<string, { x: number, y: number }>()
    if (containerWidth <= 0) return positions

    // Each card claims `gap` extra px on its right and bottom, which is what
    // keeps the next card off it. The bin is widened by the same gap so a
    // card as wide as the panel still fits with its phantom margin — the
    // margin just hangs in that extra column, past the last real one.
    let freeRects: FreeRect[] = [{ x: 0, y: 0, width: containerWidth + gap, height: UNBOUNDED_HEIGHT }]
    let fallbackY = 0

    for (const card of cards) {
        const width = Math.min(card.width, containerWidth) + gap
        const height = card.height + gap

        // Highest (lowest y), then leftmost free rect the card fits in.
        let best: FreeRect | null = null
        for (const rect of freeRects) {
            if (rect.width < width || rect.height < height) continue
            if (!best || rect.y < best.y || (rect.y === best.y && rect.x < best.x)) best = rect
        }

        const x = best ? best.x : 0
        const y = best ? best.y : fallbackY
        positions.set(card.key, { x, y })
        fallbackY = Math.max(fallbackY, y + height)

        const placed: FreeRect = { x, y, width, height }
        const next: FreeRect[] = []
        for (const rect of freeRects) {
            if (!rectsIntersect(rect, placed)) {
                next.push(rect)
                continue
            }
            // Whatever part of this free rect the card didn't cover survives
            // as up to four smaller free rects around it.
            if (rect.x < placed.x) next.push({ x: rect.x, y: rect.y, width: placed.x - rect.x, height: rect.height })
            if (rect.x + rect.width > placed.x + placed.width) {
                next.push({ x: placed.x + placed.width, y: rect.y, width: rect.x + rect.width - (placed.x + placed.width), height: rect.height })
            }
            if (rect.y < placed.y) next.push({ x: rect.x, y: rect.y, width: rect.width, height: placed.y - rect.y })
            if (rect.y + rect.height > placed.y + placed.height) {
                next.push({ x: rect.x, y: placed.y + placed.height, width: rect.width, height: rect.y + rect.height - (placed.y + placed.height) })
            }
        }

        freeRects = pruneContainedRects(next.filter((rect) => rect.width > 0 && rect.height > 0))
    }

    return positions
}

// Throttled rather than run on every trigger: a drag-resize fires the
// container ResizeObserver roughly once a frame, and runLayout() forces a
// synchronous reflow to read each card's offsetWidth/offsetHeight. Doing
// that every frame competes with other work — like Nuxt UI's active-tab
// indicator — for the same frame budget. The packing itself doesn't need to
// track a drag live, only settle quickly once it pauses.
const LAYOUT_THROTTLE_MS = 120

/**
 * Bin-packs a panel's cards and keeps them packed as they resize. `cardKeys`
 * is called at layout time to get the current ordered list of card keys —
 * callers are also responsible for re-running `scheduleLayout` themselves
 * whenever that key set changes (see InfoPanel.vue/WatchPanel.vue), since
 * only they know which of their own dependencies actually affect it.
 */
export function useCardPacking(cardKeys: () => string[]) {
    const fieldsContainer = ref<HTMLElement | null>(null)
    const cardEls = new Map<string, HTMLElement>()
    const positions = reactive(new Map<string, { x: number, y: number }>())
    const contentWidth = ref(0)
    const contentHeight = ref(0)
    const ready = ref(false)

    let cardObserver: ResizeObserver | null = null
    let containerObserver: ResizeObserver | null = null
    let throttleTimer: ReturnType<typeof setTimeout> | null = null
    let lastRunAt = 0

    function setCardRef(key: string, el: Element | null) {
        const existing = cardEls.get(key)
        if (existing && existing !== el) cardObserver?.unobserve(existing)

        if (el) {
            cardEls.set(key, el as HTMLElement)
            cardObserver?.observe(el)
        } else {
            cardEls.delete(key)
        }
    }

    function scheduleLayout() {
        if (throttleTimer) return
        const wait = Math.max(0, LAYOUT_THROTTLE_MS - (performance.now() - lastRunAt))
        throttleTimer = setTimeout(() => {
            throttleTimer = null
            lastRunAt = performance.now()
            requestAnimationFrame(runLayout)
        }, wait)
    }

    function runLayout() {
        const container = fieldsContainer.value
        if (!container) return

        const width = Math.max(0, container.clientWidth - PANEL_PADDING * 2)
        contentWidth.value = width

        const cards = cardKeys().flatMap((key) => {
            const el = cardEls.get(key)
            return el ? [{ key, width: el.offsetWidth, height: el.offsetHeight }] : []
        })

        const placed = packCards(width, cards, CARD_GAP)
        positions.clear()
        for (const [key, pos] of placed) positions.set(key, pos)

        contentHeight.value = cards.reduce((max, card) => {
            const pos = placed.get(card.key)
            return pos ? Math.max(max, pos.y + card.height) : max
        }, 0)

        ready.value = true
    }

    function tileStyle(key: string) {
        const pos = positions.get(key)
        return {
            transform: `translate(${(pos?.x ?? 0) + PANEL_PADDING}px, ${(pos?.y ?? 0) + PANEL_PADDING}px)`,
            maxWidth: contentWidth.value ? `${contentWidth.value}px` : undefined,
            opacity: ready.value ? 1 : 0,
        }
    }

    onMounted(() => {
        cardObserver = new ResizeObserver(() => scheduleLayout())
        containerObserver = new ResizeObserver(() => scheduleLayout())
        for (const el of cardEls.values()) cardObserver.observe(el)
        if (fieldsContainer.value) containerObserver.observe(fieldsContainer.value)
        scheduleLayout()
    })

    onBeforeUnmount(() => {
        cardObserver?.disconnect()
        containerObserver?.disconnect()
    })

    return { fieldsContainer, contentWidth, contentHeight, ready, setCardRef, tileStyle, scheduleLayout }
}
