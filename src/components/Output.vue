<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

// const panel = ref<HTMLElement>()

// function print(msg: string) {
//     console.log(msg)

//     const item = document.createElement('div')
//     item.className = 'output-item'
//     item.textContent = msg
//     document.querySelector('#output-panel')?.appendChild(item)
// }

// onMounted(() => {
//     for (let i = 0; i < 20; i++) {
//         print(`Print test ${i}`)
//     }
// })

type OutputTab = 'output' | 'watch'
const activeTab = ref<OutputTab>('output')
const outputTabColor = ref(getTabColor('output'))
const watchTabColor = ref(getTabColor('watch'))

const outputActive = ref(true)
const watchActive = ref(false)

function getTabColor(tab: OutputTab) {
    return tab === activeTab.value ? '#2d3341' : '#252a33'
}

function setActiveTabColors() {
    outputTabColor.value = getTabColor('output')
    watchTabColor.value = getTabColor('watch')
}

function activateOutputTab() {
    activeTab.value = 'output'
    setActiveTabColors()
    outputActive.value = true
    watchActive.value = false
}

function activateWatchTab() {
    activeTab.value = 'watch'
    setActiveTabColors()
    outputActive.value = false
    watchActive.value = true
}

</script>


<template>
    <div class="output-wrapper">
        <div class="output-header">
            <div @click="activateOutputTab" class="output-header-item output-tab">Output</div>
            <div @click="activateWatchTab" class="output-header-item watch-tab">Watch</div>
        </div>
        <!-- <hr style="border-color: #252525; border-style:solid"> -->
        <div v-show="outputActive" class="output-panel" id="output-panel" ref="panel">
            <!-- Output items are inserted here -->
        </div>

        <div v-show="watchActive" class="watch-panel">
            Watch
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
    color: var(--nord-text-bright);
    height: 24px;
}

.output-header-item {
    flex-grow: 1;
    text-align: center;
}

.output-tab {
    background-color: v-bind(outputTabColor);
}

.watch-tab {
    background-color: v-bind(watchTabColor);
}

.output-panel {
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

.output-item {
    display: flex;
    font-family: 'Courier New', Courier, monospace;
    /* justify-content: space-between; */
    /* border-bottom: 1px dashed #252a33; */
}

.output-msg {
    padding: 0 .25em;
    background-color: var(--nord-background-neutral);
    flex: 1 1 auto;
}

.output-stamp {
    color: var(--nord-text-dim);
    border-right: 1px solid;
    padding: 0 .25em;
}

.watch-panel {
    display: flex;
    justify-content: center;
    align-content: center;
}
</style>