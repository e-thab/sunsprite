<script setup lang="ts">
import { Splitpanes, Pane } from 'splitpanes';
import { resizeStage } from '@/assets/api/core';
import { onMounted, ref } from 'vue';
import PixiCanvas from '@/components/PixiCanvas.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import Output from '@/components/Output.vue';


// const canvas = ref()
const editor = ref()
const fullscreen = ref(false)

const canvasWidth = ref(44)
const canvasHeight = ref(80)

const paneSize = {
  // Column panes (left - middle - right)
  'explorer-pane': 12,
  'code-pane': 44,
  'right-pane': 44,

  // Right side nested row panes (top right - bottom right)
  'canvas-pane': 80,
  'output-pane': 20
}

async function resizeAfterSplitpaneAnimation() {
  await new Promise(resolve => setTimeout(resolve, 200))
  resizeStage()
}

function runActiveUserCode() {
  editor.value.runActiveUserCode()
}

function toggleFullscreen() {
  // Sorta works. Just need to store previous 
  fullscreen.value = !fullscreen.value

  if (fullscreen.value) {
    canvasWidth.value = 100
    canvasHeight.value = 100
  } else {
    canvasWidth.value = 44
    canvasHeight.value = 80
  }
}

const storePaneSizes = ({ prevPane, nextPane }) => {
  paneSize[`${prevPane.el.id}`] = prevPane.size
  paneSize[`${nextPane.el.id}`] = nextPane.size
  // for (const pane of panes) {
    //   console.log(pane)
    // }
    
  console.log(paneSize)
}

defineExpose({ fullscreen })

onMounted(() => {
  // resizeAfterSplitpaneAnimation()
})
</script>

<template>
  <splitpanes
  :push-other-panes="false"
  @resized="storePaneSizes"
  >
  <!-- class="default-theme" -->
    <!-- Left side pane: File explorer -->
    <pane id="explorer-pane" v-show="!fullscreen" size="12">
      <span>Files</span>
    </pane>

    <!-- Center pane: Code editor -->
    <pane id="code-pane" v-show="!fullscreen" size="44" min-size="15">
      <CodeEditor ref="editor" class="inner-pane"/>
    </pane>

    <!-- Right side pane: Nested game/output splitpanes -->
    <pane id="right-pane" :size="canvasWidth" min-size="15">
      <splitpanes
        horizontal
        :push-other-panes="false"
        @resized="storePaneSizes"
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
        <pane id="output-pane" v-show="!fullscreen" size="20">
          <Output></Output>
        </pane>
      </splitpanes>
    </pane>
  </splitpanes>
</template>

<style>
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
}

.splitpanes--horizontal > .splitpanes__splitter {
  background-color: #23252b;
  min-height: 6px;
}
</style>