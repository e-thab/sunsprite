<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import type { SplitterItem } from '@nuxt/ui';
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

const DOCS_PANE_OPEN_SIZE = 20

const outerSplitterRef = useTemplateRef('outerSplitter')
const rightSplitterRef = useTemplateRef('rightSplitter')

// Outer columns: explorer | docs | code | right. Docs stays permanently
// registered (collapsible, never conditionally added/removed) rather than
// v-if'd — USplitter/reka-ui recalculates every panel's size from
// defaultSize whenever panel *membership* changes, which would wipe out
// any live user-resized widths on every open/close. collapse()/expand()
// (see the docsStore.isOpen watch below) resize just the adjacent sibling
// instead, and since docs sits right before code-pane here, that sibling
// is always code-pane — matching the old behavior of only ever borrowing
// width from the code editor, never the explorer or right pane.
const outerItems: SplitterItem[] = [
  { id: 'explorer-pane', slot: 'explorer-pane', defaultSize: 12, class: 'hide-in-fullscreen' },
  { id: 'docs-pane', slot: 'docs-pane', defaultSize: docsStore.isOpen ? DOCS_PANE_OPEN_SIZE : 0, collapsible: true, collapsedSize: 0, class: 'hide-in-fullscreen' },
  { id: 'code-pane', slot: 'code-pane', defaultSize: docsStore.isOpen ? 44 - DOCS_PANE_OPEN_SIZE : 44, class: 'hide-in-fullscreen' },
  { id: 'right-pane', slot: 'right-pane', defaultSize: 44 },
]

// Right side nested row: game view | output. Output is collapsible so
// collapseOutput() below can hide it via the same mechanism.
const rightItems: SplitterItem[] = [
  { id: 'canvas-v-pane', slot: 'canvas-v-pane', defaultSize: 77 },
  { id: 'output-v-pane', slot: 'output-v-pane', defaultSize: 23, collapsible: true, collapsedSize: 0, class: 'hide-in-fullscreen' },
]

// Explorer nested column: file tree | asset library.
const explorerItems: SplitterItem[] = [
  { id: 'file-tree-v-pane', slot: 'file-tree-v-pane', defaultSize: 65 },
  { id: 'asset-library-v-pane', slot: 'asset-library-v-pane', defaultSize: 35 },
]

// Opening always resizes to a fixed width rather than calling expand():
// expand() restores whichever size was recorded at this panel's last
// actual collapse() call, and a docs pane that starts closed at mount was
// never collapse()'d (it just rendered at defaultSize: 0) — so on the
// first open of a docs-closed session, expand() would find nothing
// recorded and fall back to minSize instead of DOCS_PANE_OPEN_SIZE.
watch(() => docsStore.isOpen, (isOpen) => {
  const index = outerItems.findIndex((item) => item.id === 'docs-pane')
  const panel = outerSplitterRef.value?.panelsRef[index]
  if (isOpen) panel?.resize(DOCS_PANE_OPEN_SIZE)
  else panel?.collapse()
})

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

function toggleFullscreen() {
  // Toggle fullscreen state (pinia store) when pressing fullscreen button
  Output.print('fullscreen')
  fsStore.toggle()
  resizeStage()
}

function collapseOutput() {
  const index = rightItems.findIndex((item) => item.id === 'output-v-pane')
  rightSplitterRef.value?.panelsRef[index]?.collapse()
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
		// Includes the USplitter resize handle's own width (its next
		// sibling), not just the pane — otherwise the overlay's z-index sits
		// directly on top of that handle and blocks dragging it while a
		// preview is open.
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
  <div class="editor-root" :data-fullscreen="fsStore.fullscreen">
  <USplitter ref="outerSplitter" :items="outerItems" orientation="horizontal" @layout="resizeStage">

    <!-- Left side pane: File explorer + built-in asset library -->
    <template #explorer-pane>
      <USplitter :items="explorerItems" orientation="vertical">
        <template #file-tree-v-pane>
          <FileTree @select-script="loadScript" @run-script="runNamedScript" />
        </template>

        <template #asset-library-v-pane>
          <AssetLibrary />
        </template>
      </USplitter>
    </template>

    <!-- Docs pane: toggled from the NavBar, closable from its own header -->
    <template #docs-pane>
      <DocsPanel @close="docsStore.close()" />
    </template>

    <!-- Center pane: Code editor -->
    <template #code-pane>
      <CodeEditor
        ref="editor"
        class="inner-pane"
        @ready="onEditorReady"
      />
    </template>

    <!-- Right side pane: Nested game/output splitter -->
    <template #right-pane>
      <USplitter ref="rightSplitter" :items="rightItems" orientation="vertical" @layout="resizeStage">

        <!-- Top right pane: Game view -->
        <template #canvas-v-pane>
          <PhaserCanvas
            @ready="onCanvasReady"
            @run-game="runMainScript"
            @fullscreen="toggleFullscreen"
            class="inner-pane"
          />
        </template>

        <!-- Bottom left pane: Output -->
        <template #output-v-pane>
          <OutputPane
            @collapse-output="collapseOutput"
            @ready="onOutputReady"
          />
        </template>
      </USplitter>
    </template>
  </USplitter>

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

.editor-root [data-slot="root"] {
  background-color: var(--theme-bg-muted);
}

.editor-root [data-slot="panel"] {
  background-color: var(--theme-bg-elevated);
  border: 1px solid var(--theme-border);
  border-radius: 0.75rem;
}
/* A collapsed panel's flex-computed size is 0, but a 1px border can't
   shrink away with it — left on, it renders as a thin stray line instead
   of a clean gap. reka-ui marks collapsed panels with data-state, so drop
   the border there specifically rather than on every zero-width panel. */
.editor-root [data-slot="panel"][data-state="collapsed"] {
  border: none;
}

.editor-root[data-fullscreen="true"] [data-slot="handle"],
.editor-root[data-fullscreen="true"] [data-slot="panel"].hide-in-fullscreen {
  display: none;
}
</style>