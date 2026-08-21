<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { Splitpanes, Pane } from 'splitpanes';
import { resizeStage } from '@/sandbox/hostBridge';
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

// Guest sandbox: populate fileStore's scripts/folders/textFiles from
// localStorage synchronously, here in setup rather than onMounted below —
// CodeEditor (a child) mounts, and makes its own first ensureModel('main.js')
// call, *before* a parent's onMounted ever runs. Without this running first,
// that call would find an empty guest project and show placeholder content
// even for a returning guest with real saved work. Project mode's equivalent
// (fileStore.loadProject) doesn't need the same treatment — ProjectEditorView
// already awaits it before EditorView is mounted at all.
if (!props.projectId) fileStore.loadGuestProject()

// Move splitterDisplay to a component with more reason to have style unscoped,
// also should just be computed()
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
const canvasHeight = ref(77)
const canvasHeightBeforeCollapse = ref(77)

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

// docsStore.isOpen can already be true at mount (restored from localStorage
// — see docsStore.ts), but splitpanes only fires `pane-add` for panes added
// *after* its own initial mount, not ones present from the start, so
// onDocsPaneAdd below would never run for a restored-open docs pane. Take
// its width out of code-pane's share here instead, up front, so the initial
// layout already matches what onDocsPaneAdd would have produced.
if (docsStore.isOpen) paneSize['code-pane'] = (paneSize['code-pane'] ?? 0) - (paneSize['docs-pane'] ?? 0)

// explorer/code need to be refs (not static `size` props) so opening/
// closing the docs pane can restore them after splitpanes' own forced
// re-equalize (see onDocsPaneAdd/onDocsPaneRemove below).
const explorerPaneWidth = ref(paneSize['explorer-pane'] ?? 0)
const codePaneWidth = ref(paneSize['code-pane'] ?? 0)
const docsPaneWidth = ref(docsStore.isOpen ? (paneSize['docs-pane'] ?? 0) : 0)

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

function runMainScript() {
  // The game header's Restart always runs the project's canonical entry
  // point ("main.js"), independent of whichever script happens to be open
  // in the editor — that's what CodeEditor's own per-script Run button
  // (and FileTree's "Run script" action) are for instead.
  editor.value.runMainScript()
}

// FileTree's per-script "Run script" context action — runs that script
// without switching the editor to it, same as the per-script button in
// CodeEditor's own bar but reachable for a script that isn't even open.
function runNamedScript(fileName: string) {
  editor.value.runNamedScript(fileName)
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

  // Keeps FileTree's selected row following the active file even when
  // something other than clicking the tree itself triggered the switch (the
  // error-jump handler below being the case that actually needed this —
  // clicking the tree already does this on its own via UTree's v-model).
  // FileTree keys a selection by id when the item has one (see its
  // :get-key), so a plain { label } stand-in wouldn't highlight a real
  // project script — only the id-less guest-mode tree matches by label alone.
  const record = fileStore.scripts.find((s) => s.name === fileName) ?? fileStore.textFiles.find((f) => f.name === fileName)
  treeSelectionStore.current = record ? { id: record.id, label: fileName } : { label: fileName }
}

// A runtime error's "at script:line" link in the output panel (see
// output.ts) jumps here: switch to the script it happened in, same as
// clicking it in the file tree, then have the editor highlight/scroll to it.
Output.onJumpToError((script, line) => {
  loadScript(script)
  editor.value.revealErrorLine(script, line)
})

// Every runtime error with a known location highlights its line as soon as
// it happens, not just ones the user clicks through to — but without
// switching files out from under them, unlike the click handler above. Also
// marks the script itself in FileTree, so a script that isn't even open
// still shows something's wrong with it.
Output.onErrorLocation((script, line) => {
  editor.value?.revealErrorLine(script, line)
  fileStore.setErroredScript(script)
})

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

	// Correct the active file if CodeEditor's own default ('main.js') isn't
	// actually one of this project's — or guest sandbox's — scripts (e.g. it
	// was renamed). Both are real, record-backed script lists now.
	if (!fileStore.scripts.some((s) => s.name === fileStore.activeFileName)) {
		const firstScript = fileStore.scripts[0]?.name
		if (firstScript) {
			fileStore.activate(firstScript)
			editor.value.switchToScript(firstScript)
		}
	}

	runMainScript()
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
          <FileTree @select-script="loadScript" @run-script="runNamedScript" />
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
            @run-game="runMainScript"
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
  /* This used to come for free from App.vue's `.content` (RouterView
     forwards its class onto whichever route this mounts as), but that no
     longer sets overflow — and ProjectEditorView.vue's own `.content` only
     wraps this when it's nested under /edit/:slug, not when it's the
     direct route at /sandbox. Panes (FileTree, AssetLibrary, OutputPane,
     Monaco) each own their own internal scroll; nothing here should ever
     need the page itself to scroll. */
  overflow: hidden;
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

.inner-pane {
  width: 100%;
  height: 100%;
}

.splitpanes--vertical > .splitpanes__splitter {
  background-color: var(--theme-bg-accented);
  min-width: 6px;
  display: v-bind(splitterDisplay);
  transition: 0.15s 0.1s;
}
.splitpanes--vertical > .splitpanes__splitter:hover {
  min-width: 9px;
  background-color: var(--theme-text-muted);
}

.splitpanes--horizontal > .splitpanes__splitter {
  background-color: var(--theme-bg-accented);
  min-height: 6px;
  display: v-bind(splitterDisplay);
  transition: 0.15s 0.1s;
}
.splitpanes--horizontal > .splitpanes__splitter:hover {
  min-height: 9px;
  background-color: var(--theme-text-muted);
}
</style>