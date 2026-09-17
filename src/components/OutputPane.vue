<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import Output, { outputActivity } from '@/assets/api/output';
import InfoPanel from '@/components/InfoPanel.vue';
import WatchPanel from '@/components/WatchPanel.vue';
import CollapsiblePane from './CollapsiblePane.vue';
import { useWatchPanelStore } from '@/stores/watchPanelStore';
import { useProjectSettingsStore } from '@/stores/projectSettingsStore';

type OutputTab = 'output' | 'info' | 'watch'
const activeTab = ref<OutputTab>('output')
const watchPanelStore = useWatchPanelStore()
const projectSettingsStore = useProjectSettingsStore()

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

// The collapsed-pane label and icon both track whichever tab is active,
// rather than a fixed "Output" — the pane's own identity when squeezed to a
// sliver is "whatever you'd see if you widened it back out", not just its
// default tab. Kept separate from tabItems (which feeds UTabs directly)
// rather than adding an icon field there — UTabs would render it into the
// always-visible tab bar too, which isn't wanted here.
const activeTabLabel = computed(() => tabItems.value.find((item) => item.value === activeTab.value)?.label ?? 'Output')
const TAB_ICONS: Record<OutputTab, string> = {
    output: 'tabler:terminal-2',
    info: 'tabler:info-circle-filled',
    watch: 'tabler:eye-filled',
}
const activeTabIcon = computed(() => TAB_ICONS[activeTab.value])

const emit = defineEmits([ 'collapseOutput', 'ready' ])

onUnmounted(() => {
    if (outputFlashTimer) clearTimeout(outputFlashTimer)
    if (watchFlashTimer) clearTimeout(watchFlashTimer)
})

// Hands the panel element to Output, which builds the fixed pool of row
// elements it writes into — it reuses these rather than creating a node per
// message, so the pool's size *is* the "max lines kept" setting. Row structure
// lives in output.ts alongside the code that writes to it, since the two have
// to agree on which child node holds what.
function buildItemPool(lineCount: number) {
    const panel = document.getElementById('output-panel')
    if (!panel) return

    Output.init(panel, lineCount)
}

onMounted(() => {
    buildItemPool(projectSettingsStore.settings.outputMaxLines)
    Output.setAutoScroll(projectSettingsStore.settings.outputAutoScroll)
    emit('ready')
})

// A changed line limit still costs the panel's current contents (Output.init
// resets the ring along with the pool) — worth it for a setting that's changed
// rarely and deliberately.
watch(() => projectSettingsStore.settings.outputMaxLines, (lineCount) => {
    buildItemPool(lineCount)
})

watch(() => projectSettingsStore.settings.outputAutoScroll, (enabled) => {
    Output.setAutoScroll(enabled)
})
</script>


<template>
    <CollapsiblePane :label="activeTabLabel" :icon="activeTabIcon">
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
                <UButton class="output-collapse-btn" icon="tabler:chevron-down" variant="subtle" color="primary" size="xs" @click="$emit('collapseOutput')" />
            </UTooltip>
        </div>

        <!-- Output panel: shows print/warn/err output. Row elements are built
             and recycled by Output.init, so anything placed inside this div
             would be replaced on mount. -->
        <div v-show="isTabActive('output')" class="output-panel" id="output-panel" ref="panel">
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
    </CollapsiblePane>
</template>


<style>
.output-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background-color: var(--theme-bg-elevated);
}

/* Not a .panel-bar (the tabs bring their own height, so there's no fixed
   32px strip to pin here), but it owes the pane below it the same guarantee:
   a header never grows by wrapping. nowrap keeps a tab label or the collapse
   button on one line at any pane width, and overflow: hidden clips whatever
   no longer fits rather than letting it push the header taller and take the
   room out of the output itself. */
.output-header {
    display: flex;
    flex-shrink: 0;
    white-space: nowrap;
    overflow: hidden;
    background-color: var(--theme-bg-muted);
    border-bottom: 1px solid var(--theme-border);
}

.output-header [data-slot='list'] {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    border-top-right-radius: 0;
}

.output-tabs {
    flex: 1 1 auto;
}

.output-collapse-btn {
    margin: 4px 4px 4px 0;
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
    /* A row's internals can't affect anything outside its own box, and vice
       versa — so rewriting one recycled row's text doesn't drag the rest of
       the pool's internal layout along with it. */
    contain: layout style;
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

/* The column is a fixed width: every stamp is exactly one glyph, so there is
   nothing to measure. --output-glyph-slot is the only number to tune — it sets
   the glyph box, and the column on top of it (box-sizing keeps the .25em side
   padding inside the border box). 1.34em is the width of a two-digit count
   glyph, the widest thing drawn at full height.

   flex-start pins the glyph to the first line of a message that wrapped onto
   several, which is where the old text stamp sat. */
.output-stamp {
    --output-glyph-slot: 1.34em;

    display: flex;
    align-items: flex-start;
    justify-content: center;
    flex: 0 0 auto;
    border-right: 1px solid var(--theme-text-dimmed);
    padding: 0 .25em;
    color: var(--theme-text-toned);
    background-color: var(--theme-bg-muted);
    width: calc(var(--output-glyph-slot) + .5em);
    user-select: none;
}

/* A stamp glyph is an SVG painted as a CSS mask (see outputGlyphs.ts): the
   shape comes from mask-image and the color from currentColor, so a glyph picks
   up .output-item--error/--warn/--start exactly as the text symbol it replaced
   did. The box is one line tall so glyphs sit on the message's first line; the
   mask is centred inside it at text height. */
.output-glyph {
    display: block;
    width: var(--output-glyph-slot);
    height: 1.5em;
    height: 1lh;
    background-color: currentColor;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    -webkit-mask-position: center;
    mask-position: center;
}

/* Sized by height, so all of these ink the same band and a repeat count lines
   up with the symbols above it. Narrower glyphs just centre in the slot. */
.output-glyph--tall {
    -webkit-mask-size: auto 1em;
    mask-size: auto 1em;
}

/* The two glyphs wider than they are tall — the infinity sign and the sunsprite
   logo — are capped by the slot width instead, which otherwise would have to
   widen the whole column to fit them at full height. */
.output-glyph--wide {
    -webkit-mask-size: var(--output-glyph-slot) auto;
    mask-size: var(--output-glyph-slot) auto;
}

/* Severity/kind modifiers, applied alongside .output-msg/.output-stamp so
   error/warn/start messages stay theme-reactive instead of hardcoding
   colors as inline styles (which freeze at whatever theme was active when
   the message was printed). */
.output-item--error {
    color: var(--theme-error);
}

.output-location-link {
    text-decoration: underline;
    cursor: pointer;
}

.output-location-link:hover {
    opacity: 0.75;
}

.output-location-link--error {
    color: var(--theme-error);
}

.output-location-link--warn {
    color: var(--theme-warning);
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