<script setup lang="ts">
import { computed, provide, reactive, ref, useTemplateRef, watch } from 'vue'
import type { SplitterItem } from '@nuxt/ui'
import { searchDocs } from '@/assets/docs/docsSearch'
import { docsNavigationKey } from '@/assets/docs/docsNavigation'
import { currentDocsScroll, restoreDocsScroll, scrollToDocAnchor } from '@/assets/docs/docsAnchors'
import { docsDataKey } from '@/assets/docs/docsData'
import { useDocsData } from '@/assets/docs/docsVersions'
import { useApiVersionStore } from '@/stores/apiVersionStore'
import DocsTree from './docs/DocsTree.vue'
import DocsSearchResultsList from './docs/DocsSearchResultsList.vue'
import DocsBreadcrumb from './docs/DocsBreadcrumb.vue'
import DocsCategoryLanding from './docs/DocsCategoryLanding.vue'
import DocsBody from './docs/DocsBody.vue'
import CollapsiblePane from './CollapsiblePane.vue'
import { usePixelMinSize } from '@/composables/usePixelMinSize'
import { useStablePanelSizing } from '@/composables/useStablePanelSizing'

defineEmits<{ close: [] }>()

// Follows the project's own pinned/live version — the same one CodeEditor.vue
// and the sandbox use — so the docs panel never disagrees with the code
// that's actually running. No selector of its own here; see DocsView.vue for
// the standalone route's independent one.
const apiVersionStore = useApiVersionStore()
const docsData = useDocsData(() => apiVersionStore.selectedVersion)
provide(docsDataKey, docsData)

// See usePixelMinSize's own comment for the full reasoning — this keeps
// docs-tree-pane/docs-content-pane's own floor pixel-consistent with every
// other pane in the editor, not just matched to each other, and
// collapsible below lets a drag toward it snap the rest of the way past
// the halfway point instead of stopping smoothly at any arbitrary size
// between CollapsiblePane's own icon/label threshold and this floor.
const { minSize, collapsedSize } = usePixelMinSize('docs-tree-pane', 'height')

const panelItems = computed<SplitterItem[]>(() => [
	{ id: 'docs-tree-pane', slot: 'docs-tree-pane', defaultSize: 45, minSize: minSize.value, collapsible: true, collapsedSize: collapsedSize.value },
	{ id: 'docs-content-pane', slot: 'docs-content-pane', defaultSize: 55, minSize: minSize.value, collapsible: true, collapsedSize: collapsedSize.value },
])

const docsSplitterRef = useTemplateRef('docsSplitter')

// See useStablePanelSizing's own comment — keeps docs-tree-pane and
// docs-content-pane from sub-pixel jittering against each other while
// dragging their own handle.
useStablePanelSizing(docsSplitterRef, 'height')

// Handles the height half of a pane-expand-request for docs-tree-pane/
// docs-content-pane specifically — the width half (their containing
// docs-pane column, owned by EditorView's outer splitter) is handled by
// EditorView's own listener further up; this one doesn't stop the event
// from continuing to bubble there. See CollapsiblePane's own comment for
// why this travels as a DOM event rather than a prop/emit chain, and
// EditorView.vue's PANE_EXPAND_TARGETS for the width half.
function onPaneExpandRequest(event: Event) {
	const { paneId, expandHeight } = (event as CustomEvent<{ paneId: string, expandWidth: boolean, expandHeight: boolean }>).detail
	if (!expandHeight) return
	const idx = panelItems.value.findIndex((item) => item.id === paneId)
	const defaultSize = panelItems.value[idx]?.defaultSize
	if (idx >= 0 && defaultSize != null) docsSplitterRef.value?.panelsRef[idx]?.resize(defaultSize)
}

const searchQuery = ref('')
const isSearching = computed(() => searchQuery.value.trim().length > 0)
// Flat, snippet-bearing results (see docsSearch.ts) rather than the pruned
// tree this used to filter down to — a tree of nested categories has no
// natural place to show *why* each node matched, and this is a more direct
// functional match for the reference the search rework was built against
// (Vue's own docs search: a flat list of results, each excerpted around the
// match).
const searchResults = computed(() => searchDocs(searchQuery.value, docsData.value.searchEntries))

// The panel's own navigation state — intentionally NOT synced to the
// browser route (see docs/plans/docs-panel-rebuild.md, decision #1). The
// "open full page" link is what turns this into a real, shareable URL.
// It's still persisted, just via localStorage instead of the URL, so a page
// reload reopens the panel where it was left rather than always resetting to
// Getting Started — that doesn't entangle it with routing the way a
// query-param sync would.
const DOCS_PANEL_PATH_KEY = 'sunsprite:docsPanelPath'

function loadStoredPath(): string {
	const stored = localStorage.getItem(DOCS_PANEL_PATH_KEY)
	return stored && docsData.value.nodesByPath.has(stored) ? stored : 'getting-started'
}

const currentPath = ref(loadStoredPath())

// Expand/collapse state, keyed by path — entirely persistent and
// user-controlled from here on: nothing ever *removes* a path once it's
// been decided, so navigating elsewhere can never make a category collapse.
// (An earlier version fell back to "is this path an ancestor of the current
// page" for anything untouched, which made navigation-driven auto-expand
// look right up until you navigated *away* — the ancestry check would then
// just as automatically go false again, reading as an unwanted collapse.)
const expandOverrides = reactive(new Map<string, boolean>())

/**
 * Where a single step of the panel's history went. The anchor rides along so
 * stepping back onto a page reached by following an inherited member lands
 * where that click did, rather than at the top of a page the reader never saw
 * the top of — which is what the browser's own back button does for the
 * full-page view's anchored URLs.
 */
type VisitedPage = {
	path: string
	anchor?: string
	/**
	 * How far down the reader had got when they left, filled in as they leave
	 * and read back if they step onto this entry again. Absent on an entry
	 * never visited yet, which is what makes a first arrival start at the top.
	 */
	scrollTop?: number
}

// The panel's back/forward stack. It needs one of its own because its
// navigation deliberately isn't routed (see currentPath above), so the
// browser's buttons don't know this panel moved at all — in the editor they'd
// leave the project entirely. Session-only, unlike the stored path: reopening
// the editor tomorrow on the page you left is useful, and a day-old idea of
// "back" is not.
const pageHistory = ref<VisitedPage[]>([{ path: currentPath.value }])
const historyIndex = ref(0)

const canGoBack = computed(() => historyIndex.value > 0)
const canGoForward = computed(() => historyIndex.value < pageHistory.value.length - 1)

/** Everything a move involves except deciding what it does to the history. */
function showPage(page: VisitedPage, reveal: boolean) {
	currentPath.value = page.path
	// Only the path is stored: an anchor is where a single click wanted to
	// land, not where the panel should reopen days later.
	localStorage.setItem(DOCS_PANEL_PATH_KEY, page.path)
	if (reveal) {
		for (const entry of docsData.value.ancestorsOf(page.path)) expandOverrides.set(entry.path, true)
	}
	// A page arrives at its top unless the move named somewhere better. Every
	// move runs through here — links, the tree, search results, back and
	// forward — so there's one place this has to be true.
	if (page.anchor) scrollToDocAnchor(page.anchor)
	else restoreDocsScroll(page.scrollTop ?? 0)
}

/**
 * Files the current scroll offset against the entry being left, so a later
 * step back onto it can restore it. Called before every move — the offset has
 * to be read while the page it belongs to is still the one on screen.
 */
function rememberScroll() {
	const here = pageHistory.value[historyIndex.value]
	if (here) here.scrollTop = currentDocsScroll()
}

function navigate(path: string, opts?: { reveal?: boolean, anchor?: string }) {
	rememberScroll()
	const here = pageHistory.value[historyIndex.value]
	// Re-selecting exactly where you already are isn't a move: pushing it would
	// leave a back button that appears to do nothing. Still shown rather than
	// returned from, so clicking an anchored link twice re-runs its scroll.
	if (here?.path !== path || here.anchor !== opts?.anchor) {
		// Anything ahead of here is a future that just stopped happening —
		// dropped, the same way a browser drops it when you navigate after
		// going back.
		pageHistory.value = [...pageHistory.value.slice(0, historyIndex.value + 1), { path, anchor: opts?.anchor }]
		historyIndex.value = pageHistory.value.length - 1
	}
	// A fresh entry, deliberately not the remembered one: arriving by link or by
	// tree click starts the page over, even where an older entry for the same
	// page still holds an offset for back to restore.
	showPage({ path, anchor: opts?.anchor }, opts?.reveal ?? false)
}

// Both steps reveal, whether or not the move that first got there did: time
// has passed and the tree can have been collapsed since, so the destination
// isn't necessarily still somewhere the reader can see.
function goBack() {
	if (!canGoBack.value) return
	rememberScroll()
	historyIndex.value--
	showPage(pageHistory.value[historyIndex.value]!, true)
}

function goForward() {
	if (!canGoForward.value) return
	rememberScroll()
	historyIndex.value++
	showPage(pageHistory.value[historyIndex.value]!, true)
}

// Selecting a search result is a content-driven jump, not a tree click — the
// user couldn't have already seen (or collapsed) the branch it lands in via
// the tree itself — so it reveals its ancestors the same way a category
// landing card or a related-doc link does. Clearing the query afterward
// swaps the tree pane back from results to the browsable tree, landing on
// the now-expanded destination instead of leaving the flat result list up
// behind a page that's already changed underneath it.
function selectSearchResult(path: string) {
	navigate(path, { reveal: true })
	searchQuery.value = ''
}

function resolveHref(path: string, anchor?: string) {
	return anchor ? `/docs/${path}#${anchor}` : `/docs/${path}`
}

function isExpanded(path: string): boolean {
	return expandOverrides.get(path) ?? false
}

function toggleExpanded(path: string) {
	expandOverrides.set(path, !isExpanded(path))
}

// Reveals where the current page lives the first time you arrive there —
// seeds each of its ancestors to expanded, but only ones with no explicit
// choice yet, so this never overrides something the user already decided
// (in either direction) for an unrelated or previously-visited branch.
// Also re-runs when docsData changes (a version switch), not just on
// currentPath — a historical version can structure content/api/ differently,
// so the ancestor chain for the *same* path string may differ across
// versions. The !has() guard still means this only ever adds newly-
// encountered categories; a user's own expand/collapse choices survive a
// version switch untouched.
watch([currentPath, docsData], ([path]) => {
	for (const entry of docsData.value.ancestorsOf(path)) {
		if (!expandOverrides.has(entry.path)) expandOverrides.set(entry.path, true)
	}
}, { immediate: true })

provide(docsNavigationKey, { currentPath, navigate, resolveHref, isExpanded, toggleExpanded })

const currentNode = computed(() => docsData.value.nodesByPath.get(currentPath.value))
</script>

<template>
	<USplitter ref="docsSplitter" :items="panelItems" orientation="vertical" class="docs-panes" @pane-expand-request="onPaneExpandRequest">
		<template #docs-tree-pane>
			<CollapsiblePane label="Docs" icon="tabler:book-filled">
			<div class="panel-wrapper">
				<div class="panel-bar">
					<div></div>
					<div>Docs</div>
					<UTooltip text="Close">
						<UButton icon="tabler:x" variant="ghost" color="neutral" size="xs" @click="$emit('close')" />
					</UTooltip>
				</div>

				<div class="docs-search">
					<!-- The full-page view has no counterpart: its navigation is the
					     route, so the browser's own buttons already do this.

					     Color carries the enabled/disabled state rather than leaving it
					     to the dimming a disabled button gets on its own: that reads as
					     a shade of the same button, and at this size the difference has
					     to be visible at a glance. -->
					<div class="docs-history">
						<UTooltip text="Back" ignore-non-keyboard-focus>
							<UButton icon="tabler:arrow-left" variant="subtle" :color="canGoBack ? 'primary' : 'neutral'" size="xs" :disabled="!canGoBack" @click="goBack" />
						</UTooltip>
						<UTooltip text="Forward" ignore-non-keyboard-focus>
							<UButton icon="tabler:arrow-right" variant="subtle" :color="canGoForward ? 'primary' : 'neutral'" size="xs" :disabled="!canGoForward" @click="goForward" />
						</UTooltip>
					</div>

					<UInput
						v-model="searchQuery"
						icon="fa7-solid:magnifying-glass"
						placeholder="Search docs..."
						size="sm"
						class="docs-search-input"
					>
						<template v-if="searchQuery" #trailing>
							<UButton icon="tabler:x" variant="link" color="neutral" size="xs" @click="() => { searchQuery = '' }" />
						</template>
					</UInput>
				</div>

				<div class="docs-breadcrumb-row">
					<DocsBreadcrumb class="breadcrumb" />
				</div>

				<div class="docs-tree-scroll">
					<DocsTree v-if="!isSearching" :nodes="docsData.tree" />
					<div v-else class="docs-search-results">
						<DocsSearchResultsList :results="searchResults" @select="selectSearchResult" />
					</div>
				</div>
			</div>
			</CollapsiblePane>
		</template>

		<template #docs-content-pane>
			<CollapsiblePane :label="currentNode?.title ?? 'Docs'" :icon="currentNode?.icon ?? 'tabler:book-filled'">
			<div class="docs-content-scroll">
				<DocsCategoryLanding v-if="currentNode?.kind === 'category'" :node="currentNode">
					<template #header-actions>
						<UTooltip text="Open in new tab" ignore-non-keyboard-focus>
							<UButton
								icon="tabler:arrow-up-right"
								variant="subtle"
								color="primary"
								size="xs"
								:to="resolveHref(currentPath)"
								target="_blank"
							/>
						</UTooltip>
					</template>
				</DocsCategoryLanding>
				<DocsBody v-else-if="currentNode?.kind === 'entry'" :node="currentNode">
					<template #header-actions>
						<UTooltip text="Open in new tab" ignore-non-keyboard-focus>
							<UButton
								icon="tabler:arrow-up-right"
								variant="subtle"
								color="primary"
								size="xs"
								:to="resolveHref(currentPath)"
								target="_blank"
							/>
						</UTooltip>
					</template>
				</DocsBody>
			</div>
			</CollapsiblePane>
		</template>
	</USplitter>
</template>

<style scoped>
/* .panel-wrapper/.panel-bar's base rules are global (main.css — shared with
   OutputPane's own header), so only the bits specific to this new context
   are added here, scoped: this wrapper used to be the component's own root
   (reka gives every USplitter width/height:100% inline, so it no longer
   needs to state that itself), and now instead sits inside docs-tree-pane,
   a splitter panel — which, like every panel, is a row-direction flex
   container by default. Row layout stretches cross-axis (height) for free
   but never main-axis (width), the opposite of what this column of
   header/search/breadcrumb/tree needs from its own children below. */
.panel-wrapper {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
}

/* docs-tree-pane is framed (see EditorView.vue's general panel rule) with
   rounded corners on all four of *its own* corners — but panel-bar and the
   tree scroll area beneath it are opaque bands stacked edge-to-edge inside
   that frame, not the frame itself, so nothing rounds them to match unless
   told to. Only the two corners each actually touches: panel-bar is first
   (top), the tree scroll is last (bottom); docs-search and the breadcrumb
   row in between touch neither edge and stay square on all sides. */
/* .panel-bar {
	background-color: var(--theme-bg-muted);
	border-top-left-radius: 0.65rem;
	border-top-right-radius: 0.65rem;
} */

.docs-search {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	gap: 0.25em;
	padding: 0.5em 0.75em;
	background-color: var(--theme-bg-elevated);
}

/* Held at its natural width so the pair doesn't shrink away with the pane:
   these stay useful at any size, and a disabled arrow still has to be a target
   you can hit. */
.docs-history {
	display: flex;
	flex-shrink: 0;
	gap: 0.25em;
}

/* `flex: 1` rather than the `width: 100%` this carried as the row's only
   child. `min-width: 0` because a flex item's automatic minimum is its content
   width, which for an input is a whole placeholder's worth — without it the
   arrows would be pushed out of the pane before the field gave any ground. */
.docs-search-input {
	flex: 1;
	min-width: 0;
}

.docs-breadcrumb-row {
	flex-shrink: 0;
	position: relative;
	display: flex;
	align-items: center;
	background-color: var(--theme-bg-elevated);
}

/* An inset divider rather than a plain border-bottom: docs-tree-pane (the
   splitter panel this whole column lives in) is itself framed with a
   border in the same color, and this row spans its full width — a
   border-bottom reaching edge to edge would run straight into that frame's
   left/right sides, crossing it in a hard T rather than stopping inside it. */
.docs-breadcrumb-row::after {
	content: '';
	position: absolute;
	left: 0.75em;
	right: 0.75em;
	bottom: 0;
	height: 1px;
	background-color: var(--theme-border);
}

.breadcrumb {
	min-width: 0;
	flex: 1 1 auto;
}

.docs-panes {
	flex: 1 1 auto;
	min-height: 0;
}

.docs-tree-scroll {
	/* The last of four stacked children in .panel-wrapper's own column now
	   (panel-bar/docs-search/docs-breadcrumb-row above it), not a splitter
	   panel's sole direct child anymore — so unlike those three's fixed
	   height, it needs flex-grow to claim whatever they don't, and
	   min-height: 0 so that growth can still shrink below its content's
	   natural height and scroll rather than overflowing the column. */
	flex: 1 1 auto;
	min-height: 0;
	overflow-y: auto;
	padding: 0.25em 0;
	background-color: var(--theme-bg-elevated);
	/* border-bottom-left-radius: 0.65rem;
	border-bottom-right-radius: 0.65rem; */
}

/* Results are bordered cards (see DocsSearchResultsList.vue), unlike the
   tree's own borderless rows — this is the horizontal breathing room that
   keeps them off the pane edge, scoped to just the search state so the
   tree's own flush layout is untouched. */
.docs-search-results {
	padding: 0 0.5em;
}

.docs-content-scroll {
	width: 100%;
	height: 100%;
	overflow-y: auto;
	padding: 0.75em 1em;
	background-color: var(--theme-bg-elevated);
	/* border-top: 1px solid var(--theme-border); */
}
</style>
