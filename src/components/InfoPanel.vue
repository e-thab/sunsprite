<script setup lang="ts">
import { computed } from 'vue'
import { mouseRef, screenRef, timerRef } from '@/sandbox/hostBridge'
import { infoFieldLabels, infoFieldOrder, useInfoPanelStore, type InfoFieldKey } from '@/stores/infoPanelStore'

interface InfoSubItem {
    label?: string
    value: string
}

interface InfoField {
    key: InfoFieldKey
    label: string
    items: InfoSubItem[]
}

const infoPanelStore = useInfoPanelStore()
const visible = infoPanelStore.visible

function round(value: number, digits: number): number {
    const factor = 10 ** digits
    return Math.round(value * factor) / factor
}

// One entry per sub-item a field wants to show. A field with a single,
// self-explanatory value (Time, Frame, Delta) can omit the sub-label; a
// field with several (Mouse, Screen Size, Screen Bounds) labels each one.
// Adding more sub-items to a field, or a whole new field, needs no changes
// to the template or CSS below.
function fieldItems(key: InfoFieldKey): InfoSubItem[] {
    switch (key) {
        case 'mouse':
            return [
                { label: 'X', value: String(mouseRef.value.mouseX) },
                { label: 'Y', value: String(mouseRef.value.mouseY) },
            ]
        case 'screen':
            return [
                { label: 'Width', value: String(screenRef.value.width) },
                { label: 'Height', value: String(screenRef.value.height) },
                { label: 'Top Y', value: String(screenRef.value.top) },
                { label: 'Left X', value: String(screenRef.value.left) },
                { label: 'Bottom Y', value: String(screenRef.value.bottom) },
                { label: 'Right X', value: String(screenRef.value.right) },
            ]
        case 'timer':
            return [
                { label: 'Time', value: `${round(timerRef.value.time, 3).toFixed(3)}s` },
                { label: 'Frame', value: String(timerRef.value.frame) },
                { label: 'delta Ms', value: `${round(timerRef.value.deltaMs, 3)}ms` }
            ]
    }
}

const fields = computed<InfoField[]>(() =>
    infoFieldOrder
        .filter((key) => visible[key])
        .map((key) => ({ key, label: infoFieldLabels[key], items: fieldItems(key) }))
)
</script>


<template>
    <div class="info-content">
        <div class="info-fields">
            <div v-for="field in fields" :key="field.key" class="info-tile">
                <span class="info-tile-label">{{ field.label }}</span>
                <div class="info-subitems">
                    <div v-for="(item, index) in field.items" :key="item.label ?? index" class="info-subitem">
                        <span v-if="item.label" class="info-sublabel">{{ item.label }}</span>
                        <span class="info-value">{{ item.value }}</span>
                    </div>
                </div>
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
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: .6em;
    padding: .75em;
    overflow-y: auto;
}

.info-tile {
    display: flex;
    flex-direction: column;
    gap: .35em;
    padding: .55em .8em;
    background-color: var(--theme-bg-muted);
    border: 1px solid var(--theme-border);
    border-radius: .5em;
    font-family: 'Fira Code';
}

.info-tile:hover {
    background-color: var(--theme-bg-accented);
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
}

.info-sublabel {
    color: var(--theme-text-toned);
    font-size: .7em;
    text-transform: uppercase;
    letter-spacing: .03em;
}

.info-value {
    color: var(--theme-text);
}
</style>
