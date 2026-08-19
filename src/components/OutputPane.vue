<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import Output, { outputActivity } from '@/assets/api/output';
import type { OutputItem } from '@/assets/api/output';
import InfoPanel from '@/components/InfoPanel.vue';
import WatchPanel from '@/components/WatchPanel.vue';
import { useWatchPanelStore } from '@/stores/watchPanelStore';

type OutputTab = 'output' | 'info' | 'watch'
const activeTab = ref<OutputTab>('output')
const watchPanelStore = useWatchPanelStore()

function isTabActive(tab: OutputTab) {
    return tab === activeTab.value
}

// Soft, brief glow on a tab's own label — not the whole bar — when a new
// item lands in Output (print/warn/error; the "Running @ ..." start message
// is deliberately excluded, see output.ts) or a new card is added to Watch,
// while that tab isn't the one currently in view. Kept as two dedicated
// flags rather than a generic per-tab map: only these two tabs ever flash,
// and Info has no notion of a discrete "new item" to flash for anyway.
const FLASH_DURATION_MS = 500
const flashOutput = ref(false)
const flashWatch = ref(false)
let outputFlashTimer: ReturnType<typeof setTimeout> | null = null
let watchFlashTimer: ReturnType<typeof setTimeout> | null = null

function triggerFlash(tab: 'output' | 'watch') {
    if (isTabActive(tab)) return

    const flag = tab === 'output' ? flashOutput : flashWatch
    let timer = tab === 'output' ? outputFlashTimer : watchFlashTimer
    if (timer) clearTimeout(timer)

    flag.value = true
    timer = setTimeout(() => { flag.value = false }, FLASH_DURATION_MS)
    if (tab === 'output') outputFlashTimer = timer
    else watchFlashTimer = timer
}

watch(outputActivity, () => triggerFlash('output'))
watch(() => watchPanelStore.activity, () => triggerFlash('watch'))

// Switching to a flashing tab should stop it immediately rather than
// waiting out the timer.
watch(activeTab, (tab) => {
    if (tab === 'output') {
        flashOutput.value = false
        if (outputFlashTimer) clearTimeout(outputFlashTimer)
    } else if (tab === 'watch') {
        flashWatch.value = false
        if (watchFlashTimer) clearTimeout(watchFlashTimer)
    }
})

const tabItems = computed(() => [
    { label: 'Output', value: 'output', ui: flashOutput.value ? { label: 'tab-flash' } : undefined },
    { label: 'Info', value: 'info' },
    { label: 'Watch', value: 'watch', ui: flashWatch.value ? { label: 'tab-flash' } : undefined },
])

const emit = defineEmits([ 'collapseOutput', 'ready' ])

onUnmounted(() => {
    if (outputFlashTimer) clearTimeout(outputFlashTimer)
    if (watchFlashTimer) clearTimeout(watchFlashTimer)
})

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
        <div class="output-header">
            <UTabs
                v-model="activeTab"
                :items="tabItems"
                :content="false"
                color="primary"
                size="xs"
                class="output-tabs"
                :ui="{ indicator: 'duration-75', list: 'bg-[var(--theme-bg-muted)]' }"
            />

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

        <!-- Info panel: shows live mouse/screen/timer info -->
        <div v-show="isTabActive('info')" class="info-panel">
            <InfoPanel />
        </div>

        <!-- Watch panel: shows user-defined live values -->
        <div v-show="isTabActive('watch')" class="watch-panel">
            <WatchPanel />
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
    /* background-color: var(--theme-bg); */
}

.output-tabs {
    flex: 1 1 auto;
}

/* Soft glow rather than a color swap, so it doesn't have to fight Nuxt UI's
   own (unstyled-here) label color — a single gentle pulse, timed to fully
   settle back to no glow right as the JS-driven FLASH_DURATION_MS removes
   the class (see OutputPane.vue's triggerFlash). */
/* @keyframes tab-flash {
    0%, 100% { text-shadow: none; }
    50% { text-shadow: 0 0 2px var(--theme-primary); }
} */
 @keyframes tab-flash {
    0%, 100% { text-shadow: none; }
    50% { text-shadow: 0 0 2px var(--theme-warning); }
}

.tab-flash {
    animation: tab-flash .5s ease 1;
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
    /* A flex item's default min-width is content-based (auto), which for a
       <pre> ignores wrap opportunities and keeps it at its unbroken width —
       min-width: 0 lets it actually shrink to the panel's width so pre-wrap
       below can do its job instead of forcing a horizontal scrollbar. */
    min-width: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
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

.output-error-location {
    color: var(--theme-error);
    text-decoration: underline;
    cursor: pointer;
}

.output-error-location:hover {
    opacity: 0.75;
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
    display: flex;
    overflow: hidden;
}

.watch-panel {
    width: 100%;
    height: 100%;
    display: flex;
    overflow: hidden;
}

</style>