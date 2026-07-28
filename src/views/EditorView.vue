<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Splitpanes, Pane } from 'splitpanes';
import { resizeStage } from '@/assets/api/core';
import { useFullscreenStore } from '@/stores/fullscreen';
import { useFileStore } from '@/stores/fileStore';
// import PixiCanvas from '@/components/PixiCanvas.vue'
import PhaserCanvas from '@/components/PhaserCanvas.vue';
import CodeEditor from '@/components/CodeEditor.vue'
import FileTree from '@/components/FileTree.vue';
import OutputPane from '@/components/OutputPane.vue';
import { getExampleCode } from '@/assets/api/examples';
import Output from '@/assets/api/output'

const props = defineProps<{
  projectId?: string
}>()

const editor = ref()
const fsStore = useFullscreenStore()
const fileStore = useFileStore()
const splitterDisplay = ref<'inline' | 'none'>('inline')

const canvasWidth = ref(44)
const canvasHeight = ref(80)
const canvasHeightBeforeCollapse = ref(80)

const paneSize: { [index: string]: number } = {
  // Column panes (left - middle - right)
  'explorer-pane': 12,
  'code-pane': 44,
  'right-pane': 44,

  // Right side nested row panes (top right - bottom right)
  'canvas-v-pane': 80,
  'output-v-pane': 20
}

function runActiveUserCode() {
  // Run the code currently in the code editor
  editor.value.runActiveUserCode()
}

async function toggleFullscreen() {
  // Toggle fullscreen state (pinia store) when pressing fullscreen button
  Output.print('fullscreen')
  if (fsStore.toggle()) {
    splitterDisplay.value = 'none'
    canvasWidth.value = 100
    canvasHeight.value = 100
  } else {
    splitterDisplay.value = 'inline'
    canvasWidth.value = paneSize['right-pane'] ?? 0
    canvasHeight.value = paneSize['canvas-v-pane'] ?? 0
  }
  resizeStage()
}

type EventPane = { el: HTMLElement, size: number }
type ResizeEvent = { prevPane: EventPane, nextPane: EventPane }

const storePaneSizes = ({ prevPane, nextPane }: ResizeEvent) => {
  paneSize[`${prevPane.el.id}`] = prevPane.size
  paneSize[`${nextPane.el.id}`] = nextPane.size

  if (prevPane.el.id === 'canvas-v-pane') {
    canvasHeight.value = prevPane.size
  }
  // console.log(prevPane.el.id)
}

function resizeSplitpanes(event: ResizeEvent) {
  storePaneSizes(event)
  resizeStage()
}

async function collapseOutput() {
  canvasHeightBeforeCollapse.value = canvasHeight.value
  canvasHeight.value = 100
  resizeStage()
}

function loadScript(fileName: string) {
  // First, save active file 
  fileStore.saveCode(fileStore.activeFileName, editor.value.getCode())
  fileStore.activate(fileName)

  // Then open requested
  editor.value.setCode(fileStore.getLocalCode(fileName) ?? getExampleCode(fileName))
  editor.value.updateSaveMsg()
}

// const readyComponents = {
//   output: false,
//   editor: false,
//   canvas: false,
// }

// function allComponentsReady() {
//   return readyComponents.output && readyComponents.editor && readyComponents.canvas
// }

function onCanvasReady() {
	// console.log('canvas ready')
  // readyComponents.canvas = true
  resizeStage()
}

function onOutputReady() {
  // readyComponents.output = true
	// console.log('output ready')
}

function onEditorReady() {
	// console.log('editor ready')
  // readyComponents.editor = true
}

onMounted(async () => {
	const canvas = document.getElementById('canvas-v-pane')
	if (!canvas) return

	new ResizeObserver(() => {
	resizeStage()
	})
	.observe(canvas)

	// await new Promise((resolve) => {
	//   const interval = setInterval(() => {
	//     if (allComponentsReady()) {
	//       clearInterval(interval)
	//       resolve(true)
	//     } else {
	//       console.log('not yet')
	//     }
	//   }, 100)
	// })

	// console.log('components ready')

	// Project mode: correct the active file if CodeEditor's own default
	// ('main.js') isn't one of this project's scripts (e.g. it was renamed).
	if (props.projectId && !fileStore.scripts.some((s) => s.name === fileStore.activeFileName)) {
		const firstScript = fileStore.scripts[0]?.name
		if (firstScript) {
			fileStore.activate(firstScript)
			editor.value.setCode(fileStore.getLocalCode(firstScript) ?? '')
		}
	}

	runActiveUserCode()
	editor.value.updateSaveMsg()
})
</script>

<template>
  <splitpanes
    :push-other-panes="false"
    @resize="resizeStage"
    @resized="resizeSplitpanes"
  >

    <!-- Left side pane: File explorer -->
    <pane id="explorer-pane" v-show="!fsStore.fullscreen" size="12">
      <!-- <span>Files</span> -->
      <FileTree ref="fileTree" @select-script="loadScript" />
    </pane>

    <!-- Center pane: Code editor -->
    <pane id="code-pane" v-show="!fsStore.fullscreen" size="44">
		<CodeEditor
			ref="editor"
			class="inner-pane"
			@ready="onEditorReady"
		/>
    </pane>

    <!-- Right side pane: Nested game/output splitpanes -->
    <pane id="right-pane":size="canvasWidth">
      <splitpanes
        horizontal
        :push-other-panes="false"
        @resize="resizeStage"
        @resized="resizeSplitpanes"
      >

        <!-- Top right pane: Game view -->
        <pane id="canvas-v-pane":size="canvasHeight">
			<PhaserCanvas
				@ready="onCanvasReady"
				@run-game="runActiveUserCode"
				@fullscreen="toggleFullscreen"
				class="inner-pane"
			/>
        </pane>

        <!-- Bottom left pane: Output -->
        <pane id="output-v-pane" v-show="!fsStore.fullscreen" :size="100-canvasHeight">
          <OutputPane
            @collapse-output="collapseOutput" 
            @ready="onOutputReady"
          />
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

#code-pane {
  overflow: visible;
}

.panel-bar {
  display: flex;
	height: 24px;
  flex-shrink: 0;
  padding-left: 0.1em;
  padding-right: 0.2em;
  justify-content: space-between;
  align-items: center;
  color: var(--theme-text-bright);
  background-color: var(--theme-bg-dark);
  font-family:'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
  user-select: none;
}

.panel-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background-color: var(--theme-bg-dark);
}

.inner-pane {
  width: 100%;
  height: 100%;
}

.splitpanes {
  background-color: var(--theme-bg-dark);
}

.splitpanes__pane {
  /* background: linear-gradient(-45deg, #EE7752, #E73C7E, #23A6D5, #23D5AB); */
  /* box-shadow: 0 0 5px rgba(255, 255, 255, 0.05) inset; */
  /* justify-content: center; */
  /* align-items: center; */
  /* display: flex; */
  background-color: var(--theme-bg-neutral);
  transition: none !important;
}

.splitpanes--vertical > .splitpanes__splitter {
  background-color: var(--theme-bg-light);
  min-width: 5px;
  display: v-bind(splitterDisplay);
  transition: 0.15s 0.1s;
}
.splitpanes--vertical > .splitpanes__splitter:hover {
  /* min-width: 7px; */
  background-color: var(--theme-scroll-light);
}

.splitpanes--horizontal > .splitpanes__splitter {
  background-color: var(--theme-bg-light);
  min-height: 5px;
  display: v-bind(splitterDisplay);
  transition: 0.15s 0.1s;
}
.splitpanes--horizontal > .splitpanes__splitter:hover {
  /* min-height: 7px; */
  background-color: var(--theme-scroll-light);
}
</style>