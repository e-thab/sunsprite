<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { mouseRef, screenRef, timerRef } from '@/sandbox/hostBridge'
import { infoFieldLabels, infoFieldOrder, useInfoPanelStore, type InfoFieldKey } from '@/stores/infoPanelStore'
import type { DropdownMenuItem } from '@nuxt/ui'

interface InfoSubItem {
    label?: string
    value: string
    /** Floor the value's width at this many monospace characters so it doesn't
     *  reflow the layout as it fluctuates (e.g. mouse X flicking between "5"
     *  and "-999"); values longer than this still grow the box normally. */
    minChars?: number
}

interface InfoField {
    key: InfoFieldKey
    label: string
    rows: InfoSubItem[][]
}

const infoPanelStore = useInfoPanelStore()
const visible = infoPanelStore.visible

function round(value: number, digits: number): number {
    const factor = 10 ** digits
    return Math.round(value * factor) / factor
}

// One row per line of sub-items a field wants to show, one entry per
// sub-item within that row. A field with a single, self-explanatory value
// (Timer's frame count, say) can omit the sub-label; a field with several
// per row (Mouse, Screen) labels each one. Card height in the template just
// falls out of how many rows are rendered — no layout bookkeeping needed
// here, so adding a row, or a whole new field, needs no other changes.
function fieldRows(key: InfoFieldKey): InfoSubItem[][] {
    switch (key) {
        case 'mouse':
            return [
                [
                    { label: 'X', value: String(mouseRef.value.mouseX), minChars: 6 },
                    { label: 'Y', value: String(mouseRef.value.mouseY), minChars: 6 },
                ],
                [
                    { label: 'Screen X', value: '___', minChars: 6 },
                    { label: 'Screen Y', value: '___', minChars: 6 },
                ]
            ]
        case 'screen':
            return [
                [
                    { label: 'Left', value: String(screenRef.value.left), minChars: 5 },
                    { label: 'Right', value: String(screenRef.value.right), minChars: 5 },
                    { label: 'Top', value: String(screenRef.value.top), minChars: 5 },
                    { label: 'Bottom', value: String(screenRef.value.bottom), minChars: 5 },
                ],
                [
                    { label: 'Width', value: String(screenRef.value.width), minChars: 5 },
                    { label: 'Height', value: String(screenRef.value.height), minChars: 5 },
                ],
            ]
        case 'timer':
            return [
                [
                    // { label: 'Time', value: `${round(timerRef.value.time, 3).toFixed(3)}s`, minChars:  },
                    { label: 'Time', value: `${Math.trunc(timerRef.value.time)}s`, minChars: 6 },
                    { label: 'Frame', value: String(timerRef.value.frame), minChars: 6 },
                    { label: 'delta Ms', value: `${round(timerRef.value.deltaMs, 1)}ms`, minChars: 7 },
                ],
            ]
    }
}

const fields = computed<InfoField[]>(() =>
    infoFieldOrder
        .filter((key) => visible[key])
        .map((key) => ({ key, label: infoFieldLabels[key], rows: fieldRows(key) }))
)

// Keeps the dropdown open across multiple toggles instead of closing after
// each checkbox click, so a user can flip several fields in one go.
const fieldMenuItems = computed<DropdownMenuItem[]>(() =>
    infoFieldOrder.map((key) => ({
        label: infoFieldLabels[key],
        type: 'checkbox',
        checked: visible[key],
        onUpdateChecked: (checked: boolean) => infoPanelStore.setVisible(key, checked),
        onSelect: (event: Event) => event.preventDefault(),
    }))
)

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
const CUSTOMIZE_KEY = '__customize__'
const PANEL_PADDING = 12
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

function packCards(containerWidth: number, cards: CardBox[]): Map<string, { x: number, y: number }> {
    const positions = new Map<string, { x: number, y: number }>()
    if (containerWidth <= 0) return positions

    let freeRects: FreeRect[] = [{ x: 0, y: 0, width: containerWidth, height: UNBOUNDED_HEIGHT }]
    let fallbackY = 0

    for (const card of cards) {
        const width = Math.min(card.width, containerWidth)
        const height = card.height

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

const fieldsContainer = ref<HTMLElement | null>(null)
const cardEls = new Map<string, HTMLElement>()
const positions = reactive(new Map<string, { x: number, y: number }>())
const contentWidth = ref(0)
const contentHeight = ref(0)
const ready = ref(false)

let cardObserver: ResizeObserver | null = null
let containerObserver: ResizeObserver | null = null

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

// Throttled rather than run on every trigger: a drag-resize fires the
// container ResizeObserver roughly once a frame, and runLayout() forces a
// synchronous reflow to read each card's offsetWidth/offsetHeight. Doing
// that every frame competes with other work — like Nuxt UI's active-tab
// indicator — for the same frame budget. The packing itself doesn't need to
// track a drag live, only settle quickly once it pauses.
const LAYOUT_THROTTLE_MS = 120
let throttleTimer: ReturnType<typeof setTimeout> | null = null
let lastRunAt = 0

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

    const order = [...fields.value.map((field) => field.key), CUSTOMIZE_KEY]
    const cards = order.flatMap((key) => {
        const el = cardEls.get(key)
        return el ? [{ key, width: el.offsetWidth, height: el.offsetHeight }] : []
    })

    const placed = packCards(width, cards)
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

// Only the visible-field set matters here, not the telemetry values inside
// each card — those tick every ~60ms but essentially never resize a card
// (thanks to minChars), and genuine resizes are already caught by the
// per-card ResizeObserver above.
watch(
    () => infoFieldOrder.filter((key) => visible[key]).join(','),
    () => nextTick(scheduleLayout),
)
</script>


<template>
    <div class="info-content">
        <div
            ref="fieldsContainer"
            class="info-fields"
            :style="{ height: contentHeight ? `${contentHeight + PANEL_PADDING * 2}px` : undefined }"
        >
            <div
                v-for="field in fields"
                :key="field.key"
                class="info-tile"
                :ref="(el) => setCardRef(field.key, el as Element | null)"
                :style="tileStyle(field.key)"
            >
                <span class="info-tile-label">{{ field.label }}</span>
                <div v-for="(row, rowIndex) in field.rows" :key="rowIndex" class="info-subitems">
                    <div v-for="(item, itemIndex) in row" :key="item.label ?? itemIndex" class="info-subitem">
                        <span v-if="item.label" class="info-sublabel">{{ item.label }}</span>
                        <span class="info-value" :style="item.minChars ? { minWidth: `${item.minChars}ch` } : undefined">{{ item.value }}</span>
                    </div>
                </div>
            </div>

            <div
                class="info-tile info-customize-tile"
                :ref="(el) => setCardRef(CUSTOMIZE_KEY, el as Element | null)"
                :style="tileStyle(CUSTOMIZE_KEY)"
            >
                <UDropdownMenu :items="fieldMenuItems" :ui="{ content: 'w-52' }">
                    <UTooltip text="Customize fields" ignore-non-keyboard-focus>
                        <UButton icon="tabler:adjustments" variant="ghost" color="neutral" size="xs" class="info-customize-button" />
                    </UTooltip>
                </UDropdownMenu>
            </div>
        </div>
    </div>
</template>


<style>
.info-content {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background-color: var(--theme-bg-elevated);
}

.info-fields {
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
}

.info-tile {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    flex-direction: column;
    gap: .35em;
    padding: .55em .8em;
    background-color: var(--theme-bg);
    border: 1px solid var(--theme-border);
    border-radius: .5em;
    font-family: 'Fira Code';
    transition: transform .15s ease, opacity .15s ease;
}

/* .info-tile:hover {
    background-color: var(--theme-bg-accented);
} */

/* Fixed size rather than shrink-to-fit: the button inside is positioned to
   fill it exactly, and an absolutely-positioned child can't itself
   contribute to a shrink-to-fit parent's size (it's out of flow), so this
   card needs a real size of its own to fill. */
.info-customize-tile {
    width: 2.75em;
    height: 2.75em;
    padding: 0;
    overflow: hidden;
}

.info-customize-button {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    justify-content: center;
    border-radius: inherit;
}

.info-tile-label {
    color: var(--theme-primary);
    font-size: .75em;
    text-transform: uppercase;
    letter-spacing: .03em;
}

.info-subitems {
    display: flex;
    flex-wrap: wrap;
    column-gap: 1em;
    row-gap: .35em;
}

.info-subitem {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .1em;
    padding: .3em .55em;
    border: 1px dashed var(--theme-border);
    background-color: var(--theme-bg);
    border-radius: .35em;
}

.info-subitem:hover {
    /* border-style: ; */
    border: 1px solid var(--theme-border);
    background-color: var(--theme-bg);
}

.info-sublabel {
    color: var(--theme-text-toned);
    font-size: .7em;
    text-transform: uppercase;
    letter-spacing: .03em;
}

.info-value {
    color: var(--theme-text);
    text-align: center;
}
</style>
