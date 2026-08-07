<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Output from '@/assets/api/output';
import type { OutputItem } from '@/assets/api/output';

type OutputTab = 'output' | 'info' | 'watch'
const activeTab = ref<OutputTab>('output')

const tabItems = [
    { label: 'Output', value: 'output' },
    { label: 'Info', value: 'info' },
    { label: 'Watch', value: 'watch' },
]

function isTabActive(tab: OutputTab) {
    return tab === activeTab.value
}

const emit = defineEmits([ 'collapseOutput', 'ready' ])

onMounted(() => {
    const panel = document.getElementById('output-panel')
    if (!panel) return

    const outputItems: OutputItem[] = []
    for (let i=0; i<100; i++) {
        const itemElement = document.createElement('div')
        itemElement.className = 'output-item'

        const stampItem = document.createElement('div')
        stampItem.className = 'output-stamp'
        stampItem.style.minWidth = '22'
        // stampItem.textContent = 'stamp ' + i

        // Should I use <pre>? too powerful?
        const msgItem = document.createElement('pre')
        msgItem.className = 'output-msg'
        // msgItem.style.fontFamily = 'Fira Code'
        // msgItem.textContent = 'msg ' + i

        outputItems.push({ stamp: stampItem, msg: msgItem })
        itemElement.appendChild(stampItem)
        itemElement.appendChild(msgItem)
        panel.appendChild(itemElement)
    }

    Output.init(outputItems)
    emit('ready')
})
</script>


<template>
    <div class="output-wrapper">
        <!-- Header tabs -->
        <!-- TODO: Have output tab flash when another tab is focused and a new print/warn/err appears -->
        <div class="output-header">
            <UTabs v-model="activeTab" :items="tabItems" :content="false" color="primary" size="xs" class="output-tabs" />

            <UTooltip text="Collapse">
                <UButton icon="tabler:chevron-down" variant="soft" color="neutral" size="xs" @click="$emit('collapseOutput')" />
            </UTooltip>
        </div>

        <!-- Ouput panel: shows print/warn/err output -->
        <div v-show="isTabActive('output')" class="output-panel" id="output-panel" ref="panel">
            <div id="output-item-container">
                <!-- Output items are inserted here -->

            </div>
        </div>

        <!-- Info panel: shows  -->
        <div v-show="isTabActive('info')" class="info-panel">
            <span>Info</span>
        </div>

        <!-- Watch panel -->
        <div v-show="isTabActive('watch')" class="watch-panel">
            <span>Watch</span>
        </div>
    </div>
</template>


<style>
.output-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background-color: var(--theme-bg-elevated);
}

.output-header {
    display: flex;
    /* justify-content: space-between; */
    /* align-items: center; */
    /* color: var(--theme-text); */
    /* height: 24px; */
    /* user-select: none; */
}

.output-tabs {
    flex: 1 1 auto;
}

.output-panel {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    background-color: var(--theme-bg-elevated);
}

.output-item {
    display: flex;
    /* font-family: 'Courier New', Courier, monospace; */
    /* justify-content: space-between; */
    /* border-bottom: 1px dashed #252a33; */
}

.output-msg {
    padding: 0 .25em;
    flex: 1 1 auto;
    color: var(--theme-text);
    background-color: var(--theme-bg-elevated);
    font-family: 'Fira Code';
}

.output-stamp {
    border-right: 1px solid var(--theme-text-dimmed);
    padding: 0 .25em;
    color: var(--theme-text-toned);
    background-color: var(--theme-bg-muted);
    text-align: center;
    min-width: 22px;
    user-select: none;
    font-family: 'Fira Code';
}

/* Severity/kind modifiers, applied alongside .output-msg/.output-stamp so
   error/warn/start messages stay theme-reactive instead of hardcoding
   colors as inline styles (which freeze at whatever theme was active when
   the message was printed). */
.output-item--error {
    color: var(--theme-error);
}

.output-item--warn {
    color: var(--theme-warning);
}

.output-item--start {
    color: var(--theme-text-muted);
    font-style: italic;
}

.info-panel {
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
    display: flex;
}

.watch-panel {
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
    display: flex;
}

</style>