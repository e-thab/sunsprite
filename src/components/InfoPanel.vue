<script setup lang="ts">
import { computed, nextTick, watch } from 'vue'
import { mouseRef, screenRef, timerRef } from '@/sandbox/hostBridge'
import { infoFieldLabels, infoFieldOrder, useInfoPanelStore, type InfoFieldKey } from '@/stores/infoPanelStore'
import { PANEL_PADDING, useCardPacking } from '@/composables/useCardPacking'
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

const CUSTOMIZE_KEY = '__customize__'

const { fieldsContainer, contentWidth, contentHeight, setCardRef, tileStyle, scheduleLayout } =
    useCardPacking(() => [...fields.value.map((field) => field.key), CUSTOMIZE_KEY])

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
                <div v-for="(row, rowIndex) in field.rows" :key="rowIndex" class="panel-subitems">
                    <div v-for="(item, itemIndex) in row" :key="item.label ?? itemIndex" class="panel-subitem">
                        <span v-if="item.label" class="panel-sublabel" :title="item.label">{{ item.label }}</span>
                        <span class="panel-value" :title="item.value" :style="item.minChars ? { minWidth: `${item.minChars}ch` } : undefined">{{ item.value }}</span>
                    </div>
                </div>
            </div>

            <div
                class="panel-tile info-customize-tile"
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
</style>
