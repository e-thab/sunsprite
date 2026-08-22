<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
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

// Floor for every outer column, as a percentage of the row. Its job is
// geometric, not aesthetic: reka activates *every* handle whose hit area
// contains the pointer (updateResizeHandlerStates flags each one in
// intersectingHandles as active, with no nearest-wins tie-break), and each
// hit area reaches 5px past the handle. Two handles therefore both light up
// — and on mousedown both enter the drag state and keep resizing — as soon
// as the column between them is under ~10px wide, which reka's own default
// of minSize: 0 lets you drag it to. Keeping every column comfortably wider
// than that is what makes "only one handle is live" true by construction.
// 4% is ~24px at a 600px-wide window, still clear of the overlap, and a
// sane smallest useful width for these panes at any size.
const MIN_PANE_SIZE = 4

const editorRootRef = useTemplateRef('editorRoot')
const rightSplitterRef = useTemplateRef('rightSplitter')

// Outer columns: explorer | docs | code | right — docs present only while
// it's open, so closing it takes the pane *and* its resize handle out of
// the layout rather than leaving a zero-width panel wedged between two
// adjacent handles.
//
// Dropping a panel changes group membership, and reka rebuilds the whole
// layout from every panel's defaultSize when that happens (SplitterGroup's
// panelDataArrayChanged watcher) — which would throw away any width the
// user had dragged. Its one exception is the autoSaveId path: that watcher
// checks storage *before* falling back to defaults, and saved layouts are
// keyed by panel arrangement (getPanelKey, a sorted join of panel ids). So
// the three-column and four-column arrangements each remember their own
// widths, and toggling docs restores whatever that arrangement last looked
// like instead of resetting the row. See splitterStorage below for why the
// persistence stays in memory.
// The `order` on each column is load-bearing, not decoration. reka keeps
// its panels in a plain array that registerPanel push()es onto as each one
// mounts, then sorts by `order` — but its comparator returns 0 when both
// sides are undefined, so with no orders at all a stable sort just freezes
// registration order. Docs mounts when it's toggled on, i.e. *after* its
// siblings, so it would land last in that array while sitting second in
// the DOM. Resizing reads both: determinePivotIndices takes a handle's
// index from DOM order (getResizeHandleElementIndex) and uses it as
// [i, i+1] into the panel array — so every handle past the docs pane drove
// the wrong pair of columns. Explicit orders make the sort authoritative
// and keep the two views of the row aligned however the panes were mounted.
const outerItems = computed<SplitterItem[]>(() => [
  { id: 'explorer-pane', slot: 'explorer-pane', order: 1, defaultSize: 12, minSize: MIN_PANE_SIZE, class: 'hide-in-fullscreen' },
  ...(docsStore.isOpen
    ? [{ id: 'docs-pane', slot: 'docs-pane', order: 2, defaultSize: DOCS_PANE_OPEN_SIZE, minSize: MIN_PANE_SIZE, class: 'hide-in-fullscreen' }]
    : []),
  { id: 'code-pane', slot: 'code-pane', order: 3, defaultSize: docsStore.isOpen ? 44 - DOCS_PANE_OPEN_SIZE : 44, minSize: MIN_PANE_SIZE, class: 'hide-in-fullscreen' },
  { id: 'right-pane', slot: 'right-pane', order: 4, defaultSize: 44, minSize: MIN_PANE_SIZE },
])

// reka's autoSaveId writes to localStorage unless it's handed a storage
// object, which would quietly turn pane widths into a persisted setting —
// a bigger behavior change than the docs toggle asked for, and one that
// would also outlive the defaultSize tuning above. This keeps the same
// arrangement-keyed memory reka wants, scoped to the life of this view:
// toggling docs restores widths, reloading starts from defaultSize again.
const layoutMemory = new Map<string, string>()
const splitterStorage = {
  getItem: (name: string) => layoutMemory.get(name) ?? null,
  setItem: (name: string, value: string) => { layoutMemory.set(name, value) },
}

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
	const editorRoot = editorRootRef.value
	if (explorer && editorRoot) {
		// Measures to the right edge of the USplitter resize handle (the
		// pane's next sibling), not just the pane — otherwise the overlay's
		// z-index sits directly on top of that handle and blocks dragging it
		// while a preview is open.
		//
		// Read as an edge position relative to .editor-root rather than as
		// explorer.clientWidth + handle.clientWidth: the overlay is absolutely
		// positioned against .editor-root's *padding* box, so a sum of widths
		// only lines up while the layout starts at x=0. It no longer does —
		// .editor-root carries a left inset (see its padding below), which a
		// width sum can't see, and the overlay would sit that far too far left
		// and clip the handle. An edge measurement absorbs it, and any other
		// offset added ahead of the explorer pane later.
		const measure = () => {
			const handle = explorer.nextElementSibling as HTMLElement | null
			const edge = (handle ?? explorer).getBoundingClientRect().right
			explorerPixelWidth.value = edge - editorRoot.getBoundingClientRect().left
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
  <div ref="editorRoot" class="editor-root" :data-fullscreen="fsStore.fullscreen">
  <USplitter
    orientation="horizontal"
    :items="outerItems"
    auto-save-id="editor-outer"
    :storage="splitterStorage"
    @layout="resizeStage"
  >
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

  /* Closes the layout's outer edges with the same gutter the handles draw
     between panels (w-1/h-1, see vite.config.ts) — sides and bottom only,
     since the navbar already caps the top. Deliberately on .editor-root
     rather than as padding on the splitter group: reka sizes the group
     from getBoundingClientRect() (SplitterGroup.js's getGroupSizeInPixels),
     i.e. the *border* box, while the panels lay out inside its content
     box — padding there would make every drag resolve deltas against a
     track wider than the one on screen, so the divider drifts away from
     the cursor. The background is what actually fills this inset; it's
     the same token [data-panel-group] paints below, so the frame and the
     gutters between panels read as one continuous surface.
     box-sizing comes from Tailwind's preflight, so the padding stays
     inside the 100% height rather than overflowing it. */
  padding: 0 0.35rem 0.35rem;
  background-color: var(--theme-bg-accented);
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

/* The backdrop the panels sit on — visible only in the gaps between them
   (the resize handles are transparent) and behind each panel's rounded
   corners. Matched on reka-ui's own data-panel-group rather than
   [data-slot="root"]: Nuxt UI puts that slot on *every* component root
   (61 of them, UTree included), so the descendant form painted this color
   onto every tree, context menu and dropdown inside the editor too. */
.editor-root [data-panel-group] {
  background-color: var(--theme-bg-accented);
}

/* Hit pad. reka advertises a grab zone wider than the handle itself
   (hitAreaMargins, 5px for a mouse) but implements it by watching mousedown
   on <body> and hit-testing the pointer against the handle's rect. That
   only works if a mousedown is generated at all: Monaco's scrollbar slider
   calls preventDefault() on pointerdown, which cancels the compatibility
   mousedown, so pressing the last few pixels of the code pane's scrollbar
   used to start a scroll drag and reka never heard about it.
   This pad puts a transparent extension of the handle *over* that strip, so
   the press lands on the handle element, Monaco's slider never sees a
   pointerdown to cancel, and the mousedown reaches body as reka expects.
   Keep the offset equal to hitAreaMargins.fine: a pad wider than the margin
   would swallow presses that reka's own hit test then rejects, leaving a
   dead band that neither scrolls nor resizes. */
.editor-root [data-slot="handle"] {
  /* The theme already sets position: relative; this lifts the pad above the
     neighbouring panel's content. The value is pinned between two real
     numbers: Monaco puts z-index: 11 on a *visible* scrollbar
     (scrollbars.css, ".monaco-scrollable-element > .visible"), so anything
     at or below that leaves the slider on top and the press never reaches
     the pad; and .image-preview-overlay sits at 20, which has to keep
     covering the handles while a preview is open. */
  z-index: 15;
}

.editor-root [data-slot="handle"]::before {
  content: '';
  position: absolute;
}

.editor-root [data-slot="handle"][data-orientation="horizontal"]::before {
  inset: 0 -5px;
}

.editor-root [data-slot="handle"][data-orientation="vertical"]::before {
  inset: -5px 0;
}

/* Grip glyph: a short line centred in every resize handle. Drawn on
   ::after rather than as #resize-handle slot content — that slot is
   per-instance, so the markup would have to be repeated in all three
   splitters, while one rule here covers the outer one and both nested
   ones. The handle is already a centring flex container (see the splitter
   slots in vite.config.ts), so the pseudo-element positions itself in the
   middle of the gutter. The radius is half the thickness, which rounds
   the two ends off completely. */
.editor-root [data-slot="handle"]::after {
  content: '';
  flex: none;
  background-color: var(--theme-border);
  border-radius: 1px;
}

/* data-orientation carries the *group's* direction, so "horizontal" is the
   one that splits left/right — a vertical gutter, with its line running
   down the y axis. */
.editor-root [data-slot="handle"][data-orientation="horizontal"]::after {
  width: 2px;
  height: 2rem;
}

.editor-root [data-slot="handle"][data-orientation="vertical"]::after {
  width: 2rem;
  height: 2px;
}

/* Keyed off reka's own handle state rather than :hover — that state comes
   from its hit-area test (hitAreaMargins, 5px fine / 15px coarse), so the
   grip lights up exactly when the handle can actually be grabbed, not only
   over the 4px it occupies. It also stays lit through a drag, which :hover
   would not: the pointer leaves a 4px handle almost immediately once the
   divider starts moving. */
.editor-root [data-slot="handle"][data-resize-handle-state="hover"]::after,
.editor-root [data-slot="handle"][data-resize-handle-state="drag"]::after {
  background-color: var(--theme-primary);
}

/* Only leaf panels are framed. A panel that hosts a nested USplitter
   (explorer-pane, right-pane) renders that splitter's group as its
   direct child, so :has() picks those two out and leaves them bare —
   otherwise their frame would draw a second border around the group
   *and* run its top/bottom edges straight across the handle gap between
   the two panels inside it. The test is reka-ui's own data-panel-group
   rather than [data-slot="root"]: *every* Nuxt UI component roots itself
   with the latter, so a panel merely containing a UTree (FileTree,
   AssetLibrary) or a button would match it and lose its border too. */
.editor-root [data-slot="panel"]:not(:has(> [data-panel-group])) {
  /* background-color: var(--theme-bg-elevated); */
  border: 1px solid var(--theme-text-dimmed);
  border-radius: 0.65rem;
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