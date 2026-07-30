<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { Splitpanes, Pane } from 'splitpanes';
import { resizeStage } from '@/assets/api/core';
import { useFullscreenStore } from '@/stores/fullscreen';
import { useFileStore } from '@/stores/fileStore';
import { useDocsStore } from '@/stores/docsStore';
import { useTreeSelectionStore } from '@/stores/treeSelectionStore';
// import PixiCanvas from '@/components/PixiCanvas.vue'
import PhaserCanvas from '@/components/PhaserCanvas.vue';
import CodeEditor from '@/components/CodeEditor.vue'
import FileTree from '@/components/FileTree.vue';
import AssetLibrary from '@/components/AssetLibrary.vue';
import OutputPane from '@/components/OutputPane.vue';
import DocsPanel from '@/components/DocsPanel.vue';
import ImagePreviewModal from '@/components/ImagePreviewModal.vue';
import Output from '@/assets/api/output'

const props = defineProps<{
  projectId?: string
}>()

const editor = ref()
const fsStore = useFullscreenStore()
const fileStore = useFileStore()
const docsStore = useDocsStore()
const treeSelectionStore = useTreeSelectionStore()
const splitterDisplay = ref<'inline' | 'none'>('inline')

// FileTree (guest sandbox) and AssetLibrary (project mode) both bind their
// UTree directly to treeSelectionStore.current as a shared v-model, so
// selecting an image/script in either one is automatically reflected as the
// selection in both trees (Reka UI's own toggle-select logic just becomes
// cross-tree-aware once both are reading/writing the same ref) — no manual
// "clear the other tree" plumbing needed. This watcher is the one place
// that turns "what's currently selected" into "what the preview shows":
// anything with a thumbnail/path opens it, anything else (a script, or the
// selection being cleared entirely) closes it.
const previewImagePath = ref<string | null>(null)
const previewImageLabel = ref<string>('')

watch(() => treeSelectionStore.current, (item) => {
  if (item?.thumbnail && item?.path) {
    previewImagePath.value = item.path
    previewImageLabel.value = item.label ?? ''
  } else {
    previewImagePath.value = null
  }
})

function closePreview() {
  treeSelectionStore.current = undefined
}

// Tracks the explorer pane's live rendered width so the image preview
// overlay can start exactly at its right edge — it covers everything else
// (docs/code/right panes) while leaving the file tree/asset library
// visible and clickable underneath, so picking another image while a
// preview is open just works.
const explorerPixelWidth = ref(0)

const canvasWidth = ref(44)
const canvasHeight = ref(80)
const canvasHeightBeforeCollapse = ref(80)

// explorer/code need to be refs (not static `size` props) so opening/
// closing the docs pane can restore them after splitpanes' own forced
// re-equalize (see onDocsPaneAdd/onDocsPaneRemove below).
const explorerPaneWidth = ref(12)
const codePaneWidth = ref(44)
const docsPaneWidth = ref(0)

const paneSize: { [index: string]: number } = {
  // Column panes (left - middle - right)
  'explorer-pane': 12,
  'code-pane': 44,
  'right-pane': 44,
  'docs-pane': 20,

  // Right side nested row panes (top right - bottom right)
  'canvas-v-pane': 80,
  'output-v-pane': 20
}

// splitpanes unconditionally redistributes every pane's size equally
// whenever a pane is added or removed (its own equalize-after-add/remove
// step doesn't consider prior sizes at all) — so opening the docs pane
// clobbers the explorer/code/right widths the user already had. Restore
// them here, taking the docs pane's width only out of the code editor's
// share so the file tree and game/output panes are never affected.
// splitpanes only re-reads a pane's `:size` prop when Vue's own patching
// sees it change — but the target we're restoring to is often the exact
// number the ref already held (nothing here ever touched it; only
// splitpanes' internal state drifted via equalize), so writing the same
// value back is a no-op vnode-diff-wise and the stale equalized width just
// stays on screen. Multiple synchronous writes to the same ref within one
// tick don't help either — Vue batches them and only the final value at
// flush time reaches the child, so a same-tick "nudge away and back"
// collapses right back into a no-op. Actually spanning two ticks (via
// nextTick) is what forces a genuine, detectable change.
async function forceSetSize(sizeRef: Ref<number>, value: number) {
  if (sizeRef.value === value) {
    sizeRef.value = value + 0.001
    await nextTick()
  }
  sizeRef.value = value
}

async function onDocsPaneAdd() {
  // paneSize['code-pane'] has to reflect the shrink too (not just the live
  // ref) — onDocsPaneRemove reclaims space by reading this cache, and if
  // it still held the pre-open width because only the ref was ever
  // updated, closing without an intervening drag would double-count and
  // hand code-pane more width than it's actually owed.
  const shrunkCodeWidth = (paneSize['code-pane'] ?? 0) - (paneSize['docs-pane'] ?? 0)
  paneSize['code-pane'] = shrunkCodeWidth

  await forceSetSize(explorerPaneWidth, paneSize['explorer-pane'] ?? 0)
  await forceSetSize(canvasWidth, paneSize['right-pane'] ?? 0)
  await forceSetSize(docsPaneWidth, paneSize['docs-pane'] ?? 0)
  await forceSetSize(codePaneWidth, shrunkCodeWidth)
}

async function onDocsPaneRemove() {
  // Restoring code-pane to its pre-open cached width (like explorer/right)
  // would only be correct if docs was never resized — dragging its
  // splitter against the code editor updates paneSize['docs-pane'] and
  // paneSize['code-pane'] (via storePaneSizes) but never reconciles that
  // the freed space needs to land somewhere once docs is gone, leaving a
  // gap the width of whatever docs had grown to. Reclaim docs' *current*
  // width into code-pane specifically, since that's the only neighbor
  // onDocsPaneAdd ever takes space from.
  const reclaimedCodeWidth = (paneSize['code-pane'] ?? 0) + (paneSize['docs-pane'] ?? 0)
  paneSize['code-pane'] = reclaimedCodeWidth

  await forceSetSize(explorerPaneWidth, paneSize['explorer-pane'] ?? 0)
  await forceSetSize(canvasWidth, paneSize['right-pane'] ?? 0)
  await forceSetSize(codePaneWidth, reclaimedCodeWidth)
  await forceSetSize(docsPaneWidth, 0)
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
type ResizeEvent = { prevPane?: EventPane, nextPane?: EventPane }

const storePaneSizes = ({ prevPane, nextPane }: ResizeEvent) => {
  // Adding/removing a pane (see onDocsPaneAdd/onDocsPaneRemove) also fires
  // `resized`, but without prevPane/nextPane — only a real splitter drag
  // has those, which is the only case that should update this bookkeeping.
  if (!prevPane || !nextPane) return

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
  // Switching scripts no longer saves the outgoing one — edits stay in its
  // Monaco model (kept alive in CodeEditor.vue's modelEntries) until an
  // explicit save, so nothing is lost by just activating the new file.
  fileStore.activate(fileName)
  editor.value.switchToScript(fileName)
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
	if (canvas) {
		new ResizeObserver(() => {
		resizeStage()
		})
		.observe(canvas)
	}

	const explorer = document.getElementById('explorer-pane')
	if (explorer) {
		// Includes the splitpanes splitter's own width (its next sibling),
		// not just the pane — otherwise the overlay's z-index sits directly
		// on top of that splitter and blocks dragging it while a preview is
		// open.
		const measure = () => {
			const splitterWidth = (explorer.nextElementSibling as HTMLElement | null)?.clientWidth ?? 0
			explorerPixelWidth.value = explorer.clientWidth + splitterWidth
		}
		measure()
		new ResizeObserver(measure).observe(explorer)
	}

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
			editor.value.switchToScript(firstScript)
		}
	}

	runActiveUserCode()
	editor.value.updateSaveMsg()

	window.addEventListener('beforeunload', onBeforeUnload)
})

onBeforeUnmount(() => {
	window.removeEventListener('beforeunload', onBeforeUnload)
})

function onBeforeUnload(event: BeforeUnloadEvent) {
	if (!fileStore.hasUnsavedChanges) return
	event.preventDefault()
	// Chrome requires returnValue to be set for the native prompt to show.
	event.returnValue = ''
}

// In-app navigation (e.g. to /projects or /account) isn't caught by
// beforeunload, so it needs its own confirmation.
onBeforeRouteLeave(() => {
	if (!fileStore.hasUnsavedChanges) return true
	return window.confirm('You have unsaved changes. Leave without saving?')
})
</script>

<template>
  <div class="editor-root">
  <splitpanes
    :push-other-panes="false"
    @resize="resizeStage"
    @resized="resizeSplitpanes"
    @pane-add="onDocsPaneAdd"
    @pane-remove="onDocsPaneRemove"
  >

    <!-- Left side pane: File explorer + built-in asset library -->
    <pane id="explorer-pane" v-show="!fsStore.fullscreen" :size="explorerPaneWidth">
      <splitpanes horizontal :push-other-panes="false">
        <pane id="file-tree-v-pane" size="65">
          <FileTree @select-script="loadScript" />
        </pane>

        <pane id="asset-library-v-pane" size="35">
          <AssetLibrary />
        </pane>
      </splitpanes>
    </pane>

    <!-- Docs pane: toggled from the NavBar, closable from its own header -->
    <pane v-if="docsStore.isOpen" id="docs-pane" v-show="!fsStore.fullscreen" :size="docsPaneWidth">
      <DocsPanel @close="docsStore.close()" />
    </pane>

    <!-- Center pane: Code editor -->
    <pane id="code-pane" v-show="!fsStore.fullscreen" :size="codePaneWidth">
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

  <ImagePreviewModal
    v-if="previewImagePath"
    :path="previewImagePath"
    :label="previewImageLabel"
    class="image-preview-overlay"
    :style="{ left: explorerPixelWidth + 'px', width: `calc(100% - ${explorerPixelWidth}px)` }"
    @close="closePreview"
  />
  </div>
</template>

<style>
/* .game-pane {
  width: 100%;
  height: 100%;
} */

.editor-root {
  position: relative;
  width: 100%;
  height: 100%;
}

/* Docks over the docs/code/right panes only — left edge tracks the
   explorer pane's live width so the file tree/asset library stay visible
   and clickable underneath, letting the user pick another image while a
   preview is already open. */
.image-preview-overlay {
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 20;
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