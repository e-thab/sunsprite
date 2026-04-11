<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Splitpanes, Pane } from 'splitpanes';
import { resizeStage } from '@/assets/api/core';
import { useFullscreenStore } from '@/stores/fullscreen';
import PixiCanvas from '@/components/PixiCanvas.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import Output from '@/components/Output.vue';

// const canvas = ref()
const editor = ref()
const fsStore = useFullscreenStore()
const splitterDisplay = ref<'inline' | 'none'>('inline')

const canvasWidth = ref(44)
const canvasHeight = ref(80)

const paneSize: { [index: string]: number } = {
  // Column panes (left - middle - right)
  'explorer-pane': 12,
  'code-pane': 44,
  'right-pane': 44,

  // Right side nested row panes (top right - bottom right)
  'canvas-pane': 80,
  'output-pane': 20
}

function runActiveUserCode() {
  // Run the code currently in the code editor
  editor.value.runActiveUserCode()
}

async function toggleFullscreen() {
  // Toggle fullscreen state (pinia store) when pressing fullscreen button
  if (fsStore.toggle()) {
    splitterDisplay.value = 'none'
    canvasWidth.value = 100
    canvasHeight.value = 100
  } else {
    splitterDisplay.value = 'inline'
    canvasWidth.value = paneSize['right-pane'] ?? 0
    canvasHeight.value = paneSize['canvas-pane'] ?? 0
  }

  await new Promise(resolve => setTimeout(resolve, 0)).then(() => {
    // Without the await, stage doesn't resize after fullscreen
    resizeStage()
  })
}

type EventPane = { el: HTMLElement, size: number }
type ResizeEvent = { prevPane: EventPane, nextPane: EventPane }

const storePaneSizes = ({ prevPane, nextPane }: ResizeEvent) => {
  paneSize[`${prevPane.el.id}`] = prevPane.size
  paneSize[`${nextPane.el.id}`] = nextPane.size
}

function resizeSplitpanes(event: ResizeEvent) {
  storePaneSizes(event)
  resizeStage()
}
</script>

<template>
  <splitpanes
  :push-other-panes="false"
  @resize="resizeStage"
  @resized="resizeSplitpanes"
  >
  <!-- class="default-theme" -->
    <!-- Left side pane: File explorer -->
    <pane id="explorer-pane" v-show="!fsStore.fullscreen" size="12">
      <span>Files</span>
    </pane>

    <!-- Center pane: Code editor -->
    <pane id="code-pane" v-show="!fsStore.fullscreen" size="44" min-size="15">
      <CodeEditor ref="editor" class="inner-pane"/>
    </pane>

    <!-- Right side pane: Nested game/output splitpanes -->
    <pane id="right-pane" :size="canvasWidth" min-size="15">
      <splitpanes
        horizontal
        :push-other-panes="false"
        @resize="resizeStage"
        @resized="resizeSplitpanes"
      >
        <!-- Top right pane: Game view -->
        <pane :size="canvasHeight" min-size="60">
          <PixiCanvas
            @run-game="runActiveUserCode"
            @fullscreen="toggleFullscreen"
            id="canvas-pane"
            ref="canvas"
            class="inner-pane"/>
        </pane>

        <!-- Bottom left pane: Output -->
        <pane id="output-pane" v-show="!fsStore.fullscreen" :size="100-canvasHeight">
          <Output></Output>
        </pane>
      </splitpanes>
    </pane>
  </splitpanes>
</template>

<style>
/* .game-pane {
  width: 100%;
  height: 100%;
} */

.inner-pane {
  width: 100%;
  height: 100%;
}

.splitpanes {
  background-color: #252a33;
}

.splitpanes__pane {
  /* background: linear-gradient(-45deg, #EE7752, #E73C7E, #23A6D5, #23D5AB); */
  /* box-shadow: 0 0 5px rgba(255, 255, 255, 0.05) inset; */
  justify-content: center;
  align-items: center;
  display: flex;
  transition: none !important;
}

.splitpanes--vertical > .splitpanes__splitter {
  background-color: #23252b;
  min-width: 6px;
  display: v-bind(splitterDisplay);
}

.splitpanes--horizontal > .splitpanes__splitter {
  background-color: #23252b;
  min-height: 6px;
  display: v-bind(splitterDisplay);
}
</style>