<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Output from '@/assets/api/output';

type OutputTab = 'output' | 'info' | 'watch'
const activeTab = ref<OutputTab>('output')

function isTabActive(tab: OutputTab) {
    return tab === activeTab.value
}

function getTabColor(tab: OutputTab) {
    const activeColor = window.getComputedStyle(document.getElementById('nav-header') as Element).backgroundColor
    const inactiveColor = window.getComputedStyle(document.querySelector('.output-wrapper') as Element).backgroundColor
    return tab === activeTab.value ? activeColor : inactiveColor
}

function getTabHoverBrightness(tab: OutputTab) {
    return tab === activeTab.value ? 1.0 : 1.2
}

function activateTab(tab: OutputTab) {
    activeTab.value = tab
}

const emit = defineEmits([ 'collapseOutput', 'ready' ])

onMounted(() => {
    const panel = document.getElementById('output-panel')
    if (!panel) return
    for (let i=0; i<100; i++) {
        const item = document.createElement('div')
        item.className = 'output-item'

        const stampItem = document.createElement('div')
        stampItem.className = 'output-stamp'
        stampItem.style.minWidth = '22'
        // stampItem.textContent = 'stamp ' + i

        // Should I use <pre>? too powerful?
        const msgItem = document.createElement('pre')
        msgItem.className = 'output-msg'
        // msgItem.style.fontFamily = 'Fira Code'
        // msgItem.textContent = 'msg ' + i

        Output.items.stamps.push(stampItem)
        Output.items.msgs.push(msgItem)

        item.appendChild(stampItem)
        item.appendChild(msgItem)
        panel.appendChild(item)
    }

    Output.clear()
    emit('ready')
})
</script>


<template>
    <div class="output-wrapper">
        <!-- Header tabs -->
        <!-- TODO: Have output tab flash when another tab is focused and a new print/warn/err appears -->
        <div class="output-header">
            <div @click="activateTab('output')" class="output-header-item output-tab">Output</div>
            <div @click="activateTab('info')" class="output-header-item info-tab">Info</div>
            <div @click="activateTab('watch')" class="output-header-item watch-tab">Watch</div>
            
            <img 
                @click="$emit('collapseOutput')"
                src="/src/assets/images/game-icons/down.png"
                id="collapse-button"
            />
        </div>

        <!-- <div class="output-start-header">
            <div class="output-item">
                <div class="output-stamp-start">
                    ☀
                </div>
                <div class="output-msg-start">
                    <i>Running @ {time}</i>
                </div>
            </div>
        </div> -->
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
    background-color: var(--nord-background-dark);
}

.output-header {
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--nord-text-bright);
    height: 24px;
    /* border-bottom: 1px solid var(--nord-scroll-neutral); */
    user-select: none;
}

.output-header-item {
    flex-grow: 1;
    text-align: center;
    font-weight: 500;
    transition: 0.2s;
}

.output-tab {
    background-color: v-bind(getTabColor('output'));
}
.output-tab:hover {
    filter: brightness(v-bind(getTabHoverBrightness('output')));
}

.info-tab {
    background-color: v-bind(getTabColor('info'));
}
.info-tab:hover {
    filter: brightness(v-bind(getTabHoverBrightness('info')));
}

.watch-tab {
    background-color: v-bind(getTabColor('watch'));
}
.watch-tab:hover {
    filter: brightness(v-bind(getTabHoverBrightness('watch')));
}

.output-panel {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    background-color: var(--nord-background-neutral);
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
    color: var(--nord-text-bright);
    background-color: var(--nord-background-neutral);
    font-family: 'Fira Code';
}

.output-msg-start {
    padding: 0 .25em;
    flex: 1 1 auto;
    color: #626f8b;
    background-color: var(--nord-background-neutral);
    font-family: 'Fira Code';
}

.output-stamp {
    border-right: 1px solid var(--nord-scroll-neutral);
    padding: 0 .25em;
    color: var(--nord-text-dim);
    background-color: var(--nord-background-dark);
    text-align: center;
    min-width: 22px;
    user-select: none;
    font-family: 'Fira Code';
}

.output-stamp-start {
    border-right: 1px solid var(--nord-scroll-neutral);
    padding: 0 .25em;
    color: var(--nord-text-dim);
    background-color: var(--nord-background-dark);
    text-align: center;
    min-width: 22px;
    user-select: none;
    font-family: 'Fira Code';
}

.output-start-header {
    display: flex;
    flex-direction: column;
    background-color: var(--nord-background-neutral);
    border-bottom: 1px solid var(--nord-scroll-neutral);
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

#collapse-button {
    background-color: var(--nord-background-dark);
    height: 24px;
    transition: 0.2s;
}
#collapse-button:hover {
    /* background-color: transparent; */
    filter: brightness(1.2);
    cursor: pointer;
}
</style>