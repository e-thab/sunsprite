<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
import { timerRef } from '@/sandbox/hostBridge'
import { useWatchPanelStore, type WatchCard } from '@/stores/watchPanelStore'
import { PANEL_PADDING, useCardPacking } from '@/composables/useCardPacking'
import Output from '@/assets/api/output'

interface WatchSubItem {
    /** Empty for a card registered with a single getter (no sub-items). */
    label: string
    value: string
    error: boolean
}

interface WatchField {
    key: string
    label: string
    rows: WatchSubItem[][]
    /** Set when this card was registered with a single getter (watch(label, fn))
     *  rather than a labeled record — rendered as one centered, unboxed value
     *  under the title instead of the usual bordered sub-item boxes. */
    plainValue?: string
    plainError?: boolean
}

const watchPanelStore = useWatchPanelStore()

// Sub-item keys (per card label) that errored on the *previous* fields
// recompute, so a host-added getter that keeps throwing every ~60ms tick
// only gets reported to Output once, on the transition into failure — not
// continuously. Rebuilt from scratch on every recompute (see fields below)
// rather than mutated in place, so a key that stops erroring is dropped and
// a later failure is treated as a fresh occurrence and reported again.
let previousErrorKeys = new Map<string, Set<string>>()

function round(value: number, digits: number): number {
    const factor = 10 ** digits
    return Math.round(value * factor) / factor
}

function formatValue(value: unknown): string {
    if (value === undefined) return 'undefined'
    if (value === null) return 'null'
    if (typeof value === 'number') return Number.isFinite(value) ? String(round(value, 3)) : String(value)
    if (typeof value === 'string') return value
    if (typeof value === 'boolean') return String(value)
    try {
        return JSON.stringify(value) ?? String(value)
    } catch {
        return String(value)
    }
}

/**
 * Resolves one sub-item's displayed value. A key already flagged in
 * card.errorKeys came from the sandbox, which already caught the throw and
 * reported it via its own Output.error() (sandbox/watch.ts) — the "getter"
 * for it is just a trivial closure over an already-formatted 'error' string,
 * so calling it can't usefully re-report anything and shouldn't. A host-added
 * card's getter (via addCard) runs for real here, so a throw is reported —
 * only on the transition into failure, via nextErrorKeys — via the host's
 * own Output.error().
 */
function resolveItem(
    card: WatchCard,
    label: string,
    getValue: () => any,
    nextErrorKeys: Map<string, Set<string>>,
): { value: string, error: boolean } {
    if (card.errorKeys.has(label)) return { value: 'error', error: true }

    try {
        return { value: formatValue(getValue()), error: false }
    } catch (err) {
        const wasErroring = previousErrorKeys.get(card.label)?.has(label) ?? false
        if (!wasErroring) {
            const message = err instanceof Error ? err.message : String(err)
            Output.error(`Watch "${card.label}"${label ? ` (${label})` : ''}: ${message}`)
        }

        let cardErrors = nextErrorKeys.get(card.label)
        if (!cardErrors) nextErrorKeys.set(card.label, cardErrors = new Set())
        cardErrors.add(label)

        return { value: 'error', error: true }
    }
}

// One row per card, all of its labeled sub-items packed into it — same shape
// InfoPanel.vue's fields use, minus the multi-row layouts predefined fields
// sometimes need (a user-defined card is just whatever's in its record).
const fields = computed<WatchField[]>(() => {
    // timerRef ticks on the same ~60ms 'status' cadence that drives
    // InfoPanel's live values (see hostBridge.ts/sandbox/main.ts), so
    // referencing it here keeps watch values refreshing at the same rate
    // even though the caller's getters aren't reactive themselves.
    void timerRef.value

    const nextErrorKeys = new Map<string, Set<string>>()

    const result = Array.from(watchPanelStore.cards.values()).map((card) => {
        const entries = Object.entries(card.values)
        const [soleEntry] = entries

        // watch(label, fn) — the sandbox/host side store the single getter
        // under an empty-string key (see sandbox/watch.ts) rather than as a
        // labeled record.
        if (entries.length === 1 && soleEntry && soleEntry[0] === '') {
            const resolved = resolveItem(card, soleEntry[0], soleEntry[1], nextErrorKeys)
            return {
                key: card.label,
                label: card.label,
                rows: [],
                plainValue: resolved.value,
                plainError: resolved.error,
            }
        }

        return {
            key: card.label,
            label: card.label,
            rows: [
                entries.map(([label, getValue]) => ({
                    label,
                    ...resolveItem(card, label, getValue, nextErrorKeys),
                })),
            ],
        }
    })

    previousErrorKeys = nextErrorKeys
    return result
})

const { fieldsContainer, contentWidth, contentHeight, setCardRef, tileStyle, scheduleLayout } =
    useCardPacking(() => fields.value.map((field) => field.key))

// Only the card-key set matters here, not the values inside each card —
// those tick every ~60ms but essentially never resize a card, and genuine
// resizes are already caught by the per-card ResizeObserver in
// useCardPacking.
watch(
    () => Array.from(watchPanelStore.cards.keys()).join(','),
    () => nextTick(scheduleLayout),
)
</script>


<template>
    <div class="panel-content">
        <div
            ref="fieldsContainer"
            class="panel-fields"
            :style="{
                height: contentHeight ? `${contentHeight + PANEL_PADDING * 2}px` : undefined,
                '--panel-max-width': contentWidth ? `${contentWidth}px` : undefined,
            }"
        >
            <div
                v-for="field in fields"
                :key="field.key"
                class="panel-tile"
                :ref="(el) => setCardRef(field.key, el as Element | null)"
                :style="tileStyle(field.key)"
            >
                <span class="panel-tile-label" :title="field.label">{{ field.label }}</span>

                <span
                    v-if="field.plainValue !== undefined"
                    class="panel-value"
                    :class="{ 'panel-value--error': field.plainError }"
                    :title="field.plainValue"
                >{{ field.plainValue }}</span>
                <template v-else>
                    <div v-for="(row, rowIndex) in field.rows" :key="rowIndex" class="panel-subitems">
                        <div
                            v-for="(item, itemIndex) in row"
                            :key="item.label || itemIndex"
                            class="panel-subitem"
                            :class="{ 'panel-subitem--error': item.error }"
                        >
                            <span v-if="item.label" class="panel-sublabel" :title="item.label">{{ item.label }}</span>
                            <span class="panel-value" :class="{ 'panel-value--error': item.error }" :title="item.value">{{ item.value }}</span>
                        </div>
                    </div>
                </template>
            </div>

            <p v-if="!fields.length" class="watch-empty-hint">No watch entries yet.</p>
        </div>
    </div>
</template>


<style>
.watch-empty-hint {
    padding: .8em;
    color: var(--theme-text-muted);
    font-style: italic;
}
</style>
