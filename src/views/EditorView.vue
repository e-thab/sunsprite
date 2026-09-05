<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import type { SplitterItem } from '@nuxt/ui';
import { resizeStage } from '@/sandbox/hostBridge';
import { useFullscreenStore } from '@/stores/fullscreen';
import { useApiVersionStore } from '@/stores/apiVersionStore';
import { useFileStore } from '@/stores/fileStore';
import { useDocsStore } from '@/stores/docsStore';
import { useTreeSelectionStore } from '@/stores/treeSelectionStore';
import { usePixelMinSize } from '@/composables/usePixelMinSize';
import { useStablePanelSizing } from '@/composables/useStablePanelSizing';
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
const apiVersionStore = useApiVersionStore()
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

// Floor for every column/row across all three splitters here, in percent —
// but a *different* percent per splitter, not one shared constant. A flat
// percentage would put reka's actual pixel floor at a different width than
// height: the outer splitter's track is however wide the window is, a
// nested vertical splitter's is however tall the editor is beneath the
// navbar, and 1% of two different numbers is two different pixel counts.
// usePixelMinSize watches each group's own live extent and keeps
// recalculating the percentage that corresponds to the *same* pixel floor
// for it specifically (see its own comment for the full reasoning and why
// that floor sits below CollapsiblePane's presentation thresholds), so
// dragging any pane in any of these three splitters to its limit stops at
// the same actual size regardless of which one it belongs to.
const { minSize: outerMinSize, collapsedSize: outerCollapsedSize } = usePixelMinSize('explorer-pane', 'width')
const { minSize: explorerMinSize, collapsedSize: explorerCollapsedSize } = usePixelMinSize('file-tree-v-pane', 'height')
const { minSize: rightMinSize, collapsedSize: rightCollapsedSize } = usePixelMinSize('canvas-v-pane', 'height')

const editorRootRef = useTemplateRef('editorRoot')
const outerSplitterRef = useTemplateRef('outerSplitter')
const rightSplitterRef = useTemplateRef('rightSplitter')
const explorerSplitterRef = useTemplateRef('explorerSplitter')

// See useStablePanelSizing's own comment for the full reasoning — this
// keeps every *other* column stable while dragging any one of these
// splitters' own handles, not just the two columns actually being resized.
useStablePanelSizing(outerSplitterRef, 'width')
useStablePanelSizing(explorerSplitterRef, 'height')
useStablePanelSizing(rightSplitterRef, 'height')

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
const EXPLORER_DEFAULT_SIZE = 12
const RIGHT_DEFAULT_SIZE = 44

// collapsible/collapsedSize on every column here (not just docs/output's
// own pre-existing use of the same mechanism) means dragging any of them
// down toward outerMinSize now snaps the rest of the way to
// outerCollapsedSize past the halfway point, the same native reka behavior
// that already made output-v-pane snap fully shut — see usePixelMinSize's
// own comment. Landing on outerCollapsedSize rather than 0 keeps every one
// of these visible at a real, if small, floor: unlike docs/output there's
// no "closed" concept for the explorer, code, or game/output column, only
// a smallest usable size, which CollapsiblePane's own icon/label overlay
// already renders at exactly that floor.
const outerItems = computed<SplitterItem[]>(() => [
  { id: 'explorer-pane', slot: 'explorer-pane', order: 1, defaultSize: EXPLORER_DEFAULT_SIZE, minSize: outerMinSize.value, collapsible: true, collapsedSize: outerCollapsedSize.value, class: 'hide-in-fullscreen' },
  ...(docsStore.isOpen
    ? [{ id: 'docs-pane', slot: 'docs-pane', order: 2, defaultSize: DOCS_PANE_OPEN_SIZE, minSize: outerMinSize.value, collapsible: true, collapsedSize: outerCollapsedSize.value, class: 'hide-in-fullscreen' }]
    : []),
  { id: 'code-pane', slot: 'code-pane', order: 3, defaultSize: docsStore.isOpen ? 44 - DOCS_PANE_OPEN_SIZE : 44, minSize: outerMinSize.value, collapsible: true, collapsedSize: outerCollapsedSize.value, class: 'hide-in-fullscreen' },
  { id: 'right-pane', slot: 'right-pane', order: 4, defaultSize: RIGHT_DEFAULT_SIZE, minSize: outerMinSize.value, collapsible: true, collapsedSize: outerCollapsedSize.value },
])

// Corrects a reka-ui limitation: code-pane's defaultSize prop does change
// (44 -> 24) when docs opens, but code-pane itself never remounts (it's
// matched by :key across the toggle), and SplitterPanel.vue's own watcher
// for "did this panel's constraints meaningfully change" checks
// collapsedSize/collapsible/maxSize/minSize/sizeUnit — not defaultSize. So
// the group never learns code-pane's size changed, and calculates docs'
// very first layout from code-pane's *stale* registered defaultSize (44,
// from whenever it last mounted) instead of the current one. Concretely:
// explorer(12) + docs(20) + code(44, stale) + right(44) sums to 120, gets
// normalized down to sum to 100 — so *every* column drifts off its intended
// size, right-pane (and the game canvas inside it) included, even though
// nothing about docs opening should ever touch it. Only right-pane's width
// is actually guaranteed here — explorer drifting along with the rest of
// this miscalculation is accepted.
//
// The fix reads right-pane's width synchronously, before anything has had
// a chance to disturb it, then restores exactly that once the toggle (and
// reka's own recalculation above) has finished. That's a snapshot taken
// fresh on every toggle, not a value tracked continuously — an earlier
// version instead updated a ref from the outer splitter's own @layout
// event on every layout change and read that back here, which meant the
// fix depended on that event listener staying correctly wired to the
// function that updated the ref. It stopped being wired at some point
// (@layout was still bound to the old plain resizeStage handler), and the
// ref sat frozen at its initial value from then on — silently, since
// nothing about that failure mode throws or looks broken. Reading the
// real value directly, right here, has nothing upstream of it left to
// break.
//
// "Restores exactly that" means the same *pixel* width, not the same
// percentage — reusing the old percentage as-is was an earlier version of
// this fix, and it's wrong: docs' own handle is either in the row or it
// isn't, and every handle claims a fixed pixel share of the group for
// itself *before* percentages are applied to what's left over for
// panels, so the same percentage of a row with one more handle in it is
// a slightly smaller number of pixels. Converting through pixels needs
// two numbers: right-pane's own width, and how much width panels
// collectively have to divide up (the group's width minus however many
// handles currently exist — measured by summing every *panel's* own
// current width instead, since panels and handles together always fill
// the group, which sidesteps needing to know or hardcode any one
// handle's width).
//
// Both conversions — pixels-before to percent-before, and the restored
// percent-after back to pixels — read right-pane's own share via
// getSize(), never via a getBoundingClientRect() measurement of the
// rendered DOM. That distinction is the difference between this being
// stable and this slowly drifting every toggle: reka renders each
// panel's flex-grow CSS value independently rounded to 3 significant
// figures (computePanelFlexBoxStyle's toPrecision(3)), so the rendered
// width can end up a hair off whatever percentage was actually
// requested. That's harmless in isolation, but feeding *that*
// already-slightly-off measurement back in as "before" on the next
// toggle compounds the previous toggle's rounding instead of reproducing
// it — an earlier version of this fix measured right-pane's own width
// that way and drifted a little further narrower on every single toggle,
// open or closed. getSize() reads reka's own internal layout value
// directly, which is never rounded (only the CSS string generated *from*
// it is), so every toggle computes from the same exact number and there's
// nothing left to compound.
//
// The pre-toggle reads have to find right-pane by *position*, not by
// outerItems.value.findIndex(...) the way the post-toggle write below
// does: outerItems is a computed already reflecting docsStore.isOpen's
// *new* value the instant it's read (computed properties re-evaluate
// whenever accessed, independent of whether Vue has actually re-rendered
// yet), but panelsRef/the DOM — reka mutates the former in place during
// render — are still however many panels were on screen *before* this
// toggle, since that render hasn't happened yet. Finding "right-pane" by
// id against the new four-item list and reading that index out of the
// still-three-item array points at nothing (or the wrong panel). Its
// order (4, the highest of any column) means it's always the last
// element of whichever array panelsRef currently holds, three items or
// four, so reading it by position sidesteps the mismatch rather than
// needing to resolve it.
//
// right-pane also gets its rendered width *pinned* over this same window,
// via a CSS override rather than anything reka or Vue's reactivity knows
// about — a different problem from the miscalculation above, and one a
// resize()-after-the-fact correction can't reach. reka's broken
// recalculation is a real (if momentary) layout, not just an internal
// number: it actually gets applied to the DOM before this function ever
// gets a chance to correct it, and the game inside the iframe detects its
// *own* container resizing independently of anything the host tells it
// (see sandbox/main.ts's own ResizeObserver, kept deliberately independent
// so the host doesn't have to chase every layout change) — so suppressing
// resizeStage's own postMessage calls during this window, an earlier
// version of this fix, never addressed the actual cause: the iframe
// resized regardless of whether the host said anything about it. Pinning
// right-pane's flex sizing to its already-measured pixel width via
// !important (the one thing that outranks reka's own inline style)
// means its rendered size, and the iframe's, genuinely never changes
// during the whole window, so the sandbox's observer has nothing to react
// to no matter what reka's internal numbers do underneath. Unpinning
// happens only after the resize() calls below have set the *correct*
// internal value, so the release is seamless — reka's own styling takes
// back over already agreeing with what was just being held in place.
function availablePanelWidth(groupEl: Element) {
  return Array.from(groupEl.querySelectorAll(':scope > [data-slot="panel"]'))
    .reduce((sum, panel) => sum + panel.getBoundingClientRect().width, 0)
}

watch(() => docsStore.isOpen, async (isOpen) => {
  const panels = outerSplitterRef.value?.panelsRef
  const rightEl = document.getElementById('right-pane')
  const rightBefore = panels?.[panels.length - 1]
  // getSize(), not a getBoundingClientRect() measurement, on purpose: reka
  // renders each panel's flex-grow CSS value independently rounded to 3
  // significant figures (computePanelFlexBoxStyle's toPrecision(3)), so
  // the rendered width can be a hair off whatever percentage was actually
  // requested — nothing worth correcting on its own, but if the "before"
  // read for the *next* toggle comes from that already-slightly-off
  // rendered width instead of the exact percentage that produced it, each
  // toggle compounds the previous one's rounding rather than reproducing
  // it, and the drift keeps growing. getSize() reads reka's own internal
  // layout value directly, which is never rounded (only the CSS string
  // generated *from* it is) — converting pixels through that instead of
  // through the DOM keeps every toggle computing from the same exact
  // number, so there's nothing to compound.
  const rightPercentBefore = rightBefore?.getSize()
  const groupEl = rightEl?.parentElement
  const availableWidthBefore = groupEl ? availablePanelWidth(groupEl) : null

  if (rightEl) {
    rightEl.style.setProperty('--pinned-width', `${rightEl.getBoundingClientRect().width}px`)
    rightEl.classList.add('pinned-width')
  }
  await nextTick()

  if (rightPercentBefore != null && availableWidthBefore != null && groupEl) {
    const rightPixelsBefore = (rightPercentBefore / 100) * availableWidthBefore
    const availableWidthAfter = availablePanelWidth(groupEl)
    if (availableWidthAfter > 0) {
      panels?.[panels.length - 1]?.resize((rightPixelsBefore / availableWidthAfter) * 100)
    }
  }
  if (isOpen) {
    // Reaching DOCS_PANE_OPEN_SIZE by resizing explorer-pane, not by calling
    // docs.resize(DOCS_PANE_OPEN_SIZE) directly: docs-pane's own resize()
    // pivots against code-pane, and if code-pane has already been squeezed
    // near its floor (e.g. a prior drag pushed docs to its min and then
    // kept going, shrinking code-pane too), reka's cascade doesn't stop
    // once code-pane is tapped out — it keeps walking rightward looking for
    // more room and reaches right-pane, silently undoing the correction
    // above before this function ever releases the pin. explorer-pane's own
    // pivot partner is docs-pane directly (they're adjacent), so shrinking
    // explorer by whatever docs needs to grow reaches the same target
    // without the cascade ever being able to touch code-pane or right-pane.
    const docsIndex = outerItems.value.findIndex((item) => item.id === 'docs-pane')
    const docsPanel = panels?.[docsIndex]
    const explorerPanel = panels?.[0]
    const docsSizeBefore = docsPanel?.getSize()
    const explorerSizeBefore = explorerPanel?.getSize()
    if (docsSizeBefore != null && explorerSizeBefore != null) {
      explorerPanel?.resize(explorerSizeBefore + (docsSizeBefore - DOCS_PANE_OPEN_SIZE))
    }
  }

  rightEl?.classList.remove('pinned-width')
})

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

// Whether output-v-pane's *own* collapse target is fully hidden (0) rather
// than its ordinary small-but-visible floor. Output otherwise behaves
// exactly like canvas-v-pane below it — collapsible: true with
// rightCollapsedSize as the target — so dragging it small on its own stops
// there, same as every other pane; only collapseOutput()'s explicit
// "Collapse" button (OutputPane.vue's own control, unlike canvas there's a
// real "closed" concept here) sets this true first so the *next* collapse
// goes all the way to 0 instead. Never reset back to false anywhere yet:
// nothing currently offers a way to reopen output-v-pane once fully
// closed, so there's nothing that would need this true→false transition —
// whichever future control adds that will need to reset it before
// resizing output back open, or it'll immediately re-collapse to 0 on the
// next small drag instead of stopping at the floor.
const outputFullyClosed = ref(false)

// Right side nested row: game view | output. Both collapsible to
// rightCollapsedSize, the same small-but-visible floor every column in
// outerItems above also uses — dragging either one down on its own stops
// there, not at 0. output-v-pane's collapsedSize additionally switches to
// 0 once outputFullyClosed is set, which is what lets collapseOutput()
// hide it entirely via the same native mechanism instead of just resting
// at its floor like canvas-v-pane always does.
const rightItems = computed<SplitterItem[]>(() => [
  { id: 'canvas-v-pane', slot: 'canvas-v-pane', defaultSize: 77, minSize: rightMinSize.value, collapsible: true, collapsedSize: rightCollapsedSize.value },
  { id: 'output-v-pane', slot: 'output-v-pane', defaultSize: 23, minSize: rightMinSize.value, collapsible: true, collapsedSize: outputFullyClosed.value ? 0 : rightCollapsedSize.value, class: 'hide-in-fullscreen' },
])

// Explorer nested column: file tree | asset library. Collapsible for the
// same reason as outerItems above — snaps to explorerCollapsedSize's real
// floor past the halfway point instead of leaving a dead zone between
// CollapsiblePane's own icon/label threshold and that floor.
const explorerItems = computed<SplitterItem[]>(() => [
  { id: 'file-tree-v-pane', slot: 'file-tree-v-pane', defaultSize: 65, minSize: explorerMinSize.value, collapsible: true, collapsedSize: explorerCollapsedSize.value },
  { id: 'asset-library-v-pane', slot: 'asset-library-v-pane', defaultSize: 35, minSize: explorerMinSize.value, collapsible: true, collapsedSize: explorerCollapsedSize.value },
])

interface PaneExpandTarget {
  // Item id (in outerItems) to resize for a width expand request — the
  // pane's own id if it's a direct outer-splitter member (code-pane), or
  // its containing column's id for every other leaf here, whose *width*
  // is inherited from that ancestor rather than set by a handle of its own.
  widthItemId?: string
  // Which nested splitter (and item within it) owns this pane's own
  // height, if any — code-pane has no nested splitter inside it, so its
  // height is always the full row and never needs a target here.
  heightSplitter?: 'explorer' | 'right'
  heightItemId?: string
}

// Where a given pane's width and height actually come from — not always
// the pane itself. docs-tree-pane/docs-content-pane only carry a width
// target: their height is owned by DocsPanel.vue's own nested splitter, a
// different component entirely, which handles that half from its own
// listener on the same bubbling event and leaves this one to handle theirs
// — see CollapsiblePane's own comment on why this travels as a DOM event
// rather than a prop/emit chain threaded through every wrapper in between.
const PANE_EXPAND_TARGETS: Record<string, PaneExpandTarget> = {
  'file-tree-v-pane': { widthItemId: 'explorer-pane', heightSplitter: 'explorer', heightItemId: 'file-tree-v-pane' },
  'asset-library-v-pane': { widthItemId: 'explorer-pane', heightSplitter: 'explorer', heightItemId: 'asset-library-v-pane' },
  'code-pane': { widthItemId: 'code-pane' },
  'canvas-v-pane': { widthItemId: 'right-pane', heightSplitter: 'right', heightItemId: 'canvas-v-pane' },
  'output-v-pane': { widthItemId: 'right-pane', heightSplitter: 'right', heightItemId: 'output-v-pane' },
  'docs-tree-pane': { widthItemId: 'docs-pane' },
  'docs-content-pane': { widthItemId: 'docs-pane' },
}

function onPaneExpandRequest(event: Event) {
  const { paneId, expandWidth, expandHeight } = (event as CustomEvent<{ paneId: string, expandWidth: boolean, expandHeight: boolean }>).detail
  const target = PANE_EXPAND_TARGETS[paneId]
  if (!target) return

  if (expandWidth && target.widthItemId) {
    const idx = outerItems.value.findIndex((item) => item.id === target.widthItemId)
    const defaultSize = outerItems.value[idx]?.defaultSize
    if (idx >= 0 && defaultSize != null) outerSplitterRef.value?.panelsRef[idx]?.resize(defaultSize)
  }

  if (expandHeight && target.heightSplitter && target.heightItemId) {
    const items = target.heightSplitter === 'explorer' ? explorerItems.value : rightItems.value
    const splitterRef = target.heightSplitter === 'explorer' ? explorerSplitterRef : rightSplitterRef
    const idx = items.findIndex((item) => item.id === target.heightItemId)
    const defaultSize = items[idx]?.defaultSize
    if (idx >= 0 && defaultSize != null) splitterRef.value?.panelsRef[idx]?.resize(defaultSize)
  }
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

function toggleFullscreen() {
  // Toggle fullscreen state (pinia store) when pressing fullscreen button
  Output.print('fullscreen')
  fsStore.toggle()
  resizeStage()
}

async function collapseOutput() {
  // Set before reading rightItems below, but reka's own registered
  // collapsedSize constraint only updates once SplitterPanel.vue's
  // :collapsed-size prop actually re-renders with it — a later effect than
  // this ref changing, not the same tick. Without awaiting that, .collapse()
  // below would still see the pre-close value (rightCollapsedSize, output's
  // ordinary floor) and land there instead of at 0.
  outputFullyClosed.value = true
  await nextTick()
  const index = rightItems.value.findIndex((item) => item.id === 'output-v-pane')
  rightSplitterRef.value?.panelsRef[index]?.collapse()
}

// The sandboxed game watches its own container via a ResizeObserver
// (sandbox/main.ts) and resizes itself independently — the host's own
// resizeStage() message, posted on @layout below, exists only as a
// belt-and-braces nudge for whatever case that observer might miss, per
// its own comment there. @layout fires on every layout change anywhere in
// a splitter group though, not just ones that touch canvas-v-pane's own
// box — bound straight to resizeStage(), that posts the message on every
// tick of any drag in either splitter, including ones nowhere near
// canvas-v-pane, each one telling the sandbox's already-independent
// observer to go check itself for nothing: canvas.width/height assignments
// (which is what a stage resize ultimately touches) clear and redraw the
// canvas even when set to the same values, so a message posted on every
// tick of an unrelated drag reads as the game canvas visibly flickering in
// sync with a handle it isn't even attached to. This only actually posts
// once canvas-v-pane's own rendered size has moved since the last check.
let lastCanvasSize = { width: 0, height: 0 }
function onLayoutMaybeResizeStage() {
  const canvasEl = document.getElementById('canvas-v-pane')
  if (canvasEl) {
    const rect = canvasEl.getBoundingClientRect()
    if (rect.width === lastCanvasSize.width && rect.height === lastCanvasSize.height) return
    lastCanvasSize = { width: rect.width, height: rect.height }
  }
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

// A runtime error/warning's "at script:line" link in the output panel (see
// output.ts) jumps here: switch to the script it happened in, same as
// clicking it in the file tree, then have the editor highlight/scroll to it.
Output.onJumpToError((script, line, kind, message) => {
  loadScript(script)
  editor.value.revealErrorLine(script, line, kind, message)
})

// Every runtime error/warning with a known location highlights its line as
// soon as it happens, not just ones the user clicks through to — but without
// switching files out from under them, unlike the click handler above. Also
// marks the script itself in FileTree for an error, so a script that isn't
// even open still shows something's wrong with it.
Output.onErrorLocation((script, line, kind, message) => {
  editor.value?.revealErrorLine(script, line, kind, message)
  if (kind === 'error') fileStore.setErroredScript(script)
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
	// Session-local by design (see apiVersionStore.ts) — don't let a version
	// picked while editing this project silently carry over into whatever's
	// opened next.
	apiVersionStore.reset()
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
  <div ref="editorRoot" class="editor-root" :data-fullscreen="fsStore.fullscreen" @pane-expand-request="onPaneExpandRequest">
  <USplitter
    ref="outerSplitter"
    orientation="horizontal"
    :items="outerItems"
    auto-save-id="editor-outer"
    :storage="splitterStorage"
    @layout="onLayoutMaybeResizeStage"
  >
    <!-- Left side pane: File explorer + built-in asset library -->
    <template #explorer-pane>
      <USplitter ref="explorerSplitter" :items="explorerItems" orientation="vertical">
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
      <USplitter ref="rightSplitter" :items="rightItems" orientation="vertical" @layout="onLayoutMaybeResizeStage">

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
    :style="{ left: explorerPixelWidth + 'px', width: `calc(100% - ${explorerPixelWidth}px - 0.35rem)` }"
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
   preview is already open. Inset on the bottom/right by the same 0.35rem
   gutter .editor-root pads its own edges with (left comes for free —
   explorerPixelWidth already lands right at the splitter handle), so the
   panel's rounded corners (added in ImagePreviewModal.vue) read against
   the accented background the same way every CollapsiblePane-framed pane's
   corners do, instead of being flush-cropped at the true viewport edge.
   height: auto is load-bearing here — ImagePreviewModal's own root also
   matches .panel-wrapper (shared with every other pane), which sets an
   unscoped height: 100%. Left at its default `auto`, a non-auto top +
   non-auto bottom together determine an absolutely positioned box's
   height; but the moment *any* rule gives it an explicit height instead,
   the spec has that win over bottom, and bottom is solved-for (i.e.
   silently discarded) rather than actually constraining the box — which
   is exactly how this shipped flush against the true bottom edge the
   first time despite the rule above already setting bottom: 0.35rem. */
.image-preview-overlay {
  position: absolute;
  top: 0;
  bottom: 0.35rem;
  height: auto;
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

/* Grip glyph: three dots centred in every resize handle. Drawn on ::after
   rather than as #resize-handle slot content — that slot is per-instance,
   so the markup would have to be repeated in all three splitters, while
   one rule here covers the outer one and both nested ones. The handle is
   already a centring flex container (see the splitter slots in
   vite.config.ts), so the pseudo-element positions itself in the middle of
   the gutter. Only one real element exists to draw with (::after itself,
   the centre dot) — the other two are box-shadow copies of it, offset
   along the handle's own length, which is what lets a single dot's own
   color and its shadows' colors change together: both sides read the same
   --handle-dot-color custom property, so the hover/drag rule below only
   has to override that once rather than restate every offset with a new
   color.
   Sized to 2px, matching the handle's own fixed 4px thickness (w-1/h-1,
   see vite.config.ts) in parity, not just proportion — flex centers a
   child by splitting (container − child) evenly across both sides, and an
   *odd*-sized dot in that *even*-width gutter leaves a half-pixel
   remainder neither side can actually render, so the browser rounds it
   onto one side only and the dot reads as off-centre by a pixel. 4 − 2 = 2,
   split evenly with nothing left over. */
.editor-root [data-slot="handle"]::after {
  content: '';
  flex: none;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background-color: var(--handle-dot-color, var(--theme-text-muted));
  transition:
    background-color 0.15s ease-in-out,
    box-shadow 0.15s ease-in-out,
    width 0.15s ease-in-out,
    height 0.15s ease-in-out,
    border-radius 0.15s ease-in-out;
}

/* data-orientation carries the *group's* direction, so "horizontal" is the
   one that splits left/right — a vertical gutter, with its dots stacked
   down the y axis. */
.editor-root [data-slot="handle"][data-orientation="horizontal"]::after {
  box-shadow:
    0 -5px 0 var(--handle-dot-color, var(--theme-text-muted)),
    0 5px 0 var(--handle-dot-color, var(--theme-text-muted));
}

.editor-root [data-slot="handle"][data-orientation="vertical"]::after {
  box-shadow:
    -5px 0 0 var(--handle-dot-color, var(--theme-text-muted)),
    5px 0 0 var(--handle-dot-color, var(--theme-text-muted));
}

/* Keyed off reka's own handle state rather than :hover — that state comes
   from its hit-area test (hitAreaMargins, 5px fine / 15px coarse), so the
   grip lights up exactly when the handle can actually be grabbed, not only
   over the 4px it occupies. It also stays lit through a drag, which :hover
   would not: the pointer leaves a 4px handle almost immediately once the
   divider starts moving. */
.editor-root [data-slot="handle"][data-resize-handle-state="hover"]::after,
.editor-root [data-slot="handle"][data-resize-handle-state="drag"]::after {
  --handle-dot-color: var(--theme-primary);
}

/* Grip grows into a full-length divider line rather than staying three
   dots once it's actually grabbable — flex's own align-items/justify-
   content centering (unchanged from the dot state) keeps it growing
   symmetrically from the middle outward instead of needing repositioning.
   box-shadow only ever drew the other two dots, so it has nothing left to
   do once this is one continuous shape; border-radius: 0 makes the two
   ends flush rather than rounded caps poking past the handle's own width,
   which would read as slightly wider than the 4px gutter it sits in. */
.editor-root [data-slot="handle"][data-orientation="horizontal"][data-resize-handle-state="hover"]::after,
.editor-root [data-slot="handle"][data-orientation="horizontal"][data-resize-handle-state="drag"]::after {
  width: 2px;
  height: 100%;
  border-radius: 0;
  box-shadow: none;
}

.editor-root [data-slot="handle"][data-orientation="vertical"][data-resize-handle-state="hover"]::after,
.editor-root [data-slot="handle"][data-orientation="vertical"][data-resize-handle-state="drag"]::after {
  width: 100%;
  height: 2px;
  border-radius: 0;
  box-shadow: none;
}

/* Every leaf panel's actual visible frame — a real border, an
   overflow: hidden clip, and the rounded corners all together — lives in
   CollapsiblePane.vue now, on a dedicated .collapsible-pane-frame div one
   level inside the panel, not here on the panel itself. Three things ruled
   out putting it directly on [data-slot="panel"]:
   - A real border here clamps: every leaf panel sizes itself via
     flex-basis: 0 (reka's computePanelFlexBoxStyle), and box-sizing:
     border-box can't render a border-box smaller than its own border, so
     a bordered flex-basis: 0 panel gets silently floored to ~2px — which
     eats into the *group's* shared free-space pool by an amount that
     depends on how many sibling panels are also bordered leaves versus
     borderless containers, throwing off usePixelMinSize's pixel targets
     for the whole group, not just this panel. Confirmed in a bare,
     reka-free flexbox page.
   - Moving just the border to an absolutely-positioned ::before sidesteps
     that (a pseudo-element has no box-model presence in the parent's flex
     layout at all) but reintroduces a *different* problem: the panel's
     own content-clip and the ::before's border are then two independently
     rasterized shapes on two different elements, and even an identical
     border-radius value on an identical box doesn't guarantee they
     anti-alias a curve onto the same pixels — straight edges never showed
     it (nothing to rasterize differently there), but the curve could
     leave a sliver of whatever's underneath (a canvas especially, being
     its own composited layer) visible right at the corner.
   - Widening that gap with an inset box-shadow masked the sliver but
     visibly pushed real content away from the border along the *entire*
     edge, not just the corners — trading one visible artifact for a more
     obvious one.
   .collapsible-pane-frame avoids all three by being a different kind of
   element entirely: sized via width/height: 100% rather than flex-basis: 0
   (so a real border's own minimum-size clamp is harmless — nothing shares
   free space with it), and one level below .collapsible-pane specifically
   so its border narrows *its own* content-box, not the ancestor
   usePixelMinSize actually measures. Border and clip both being properties
   of that same single element means there's only one shape being
   rasterized, not two independently-drawn ones trying to agree. */

.editor-root[data-fullscreen="true"] [data-slot="handle"],
.editor-root[data-fullscreen="true"] [data-slot="panel"].hide-in-fullscreen {
  display: none;
}

/* Fullscreen drops the framing every other pane is presented in: the game
   is the whole screen now, not one panel in a layout. Two things draw that
   frame and both have to go, or the canvas stops a pixel or so short of the
   viewport with a strip of the accented backdrop (or a clipped corner)
   showing through — the outer gutter .editor-root pads its own edges with
   above, and the border + rounded corners on the leaf pane's own frame.
   The frame lives in CollapsiblePane.vue under `scoped`, which only appends
   a [data-v-*] attribute to that component's own selectors; the rule below
   still outranks it on specificity (three classes/attributes to its two),
   so it doesn't need to be reached from inside that component. Written
   against .collapsible-pane-frame generally rather than #canvas-v-pane's
   specifically since the game pane is the only one still displayed by the
   rule above. */
.editor-root[data-fullscreen="true"] {
  padding: 0;
}

.editor-root[data-fullscreen="true"] .collapsible-pane-frame {
  border: none;
  border-radius: 0;
}

/* Holds right-pane at an exact pixel width, ignoring whatever reka's own
   flex-grow says underneath — see the docsStore.isOpen watch. !important
   is the one thing that outranks an inline style (reka sets flex-basis/
   flex-grow/flex-shrink inline via :style), which a plain .style.width
   assignment from JS wouldn't: Vue's own patch of that same :style
   binding, mid-transition, would just overwrite it right back. */
.editor-root #right-pane.pinned-width {
  flex: 0 0 var(--pinned-width) !important;
}
</style>