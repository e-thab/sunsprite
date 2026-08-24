<script setup lang="ts">
import { computed, provide, reactive, ref, useTemplateRef, watch } from 'vue'
import type { SplitterItem } from '@nuxt/ui'
import { docsTree } from '@/assets/docs/docsContent'
import { nodesByPath, ancestorsOf } from '@/assets/docs/docsIndex'
import { searchDocs } from '@/assets/docs/docsSearch'
import { docsNavigationKey } from '@/assets/docs/docsNavigation'
import DocsTree from './docs/DocsTree.vue'
import DocsSearchResultsList from './docs/DocsSearchResultsList.vue'
import DocsBreadcrumb from './docs/DocsBreadcrumb.vue'
import DocsCategoryLanding from './docs/DocsCategoryLanding.vue'
import DocsBody from './docs/DocsBody.vue'
import CollapsiblePane from './CollapsiblePane.vue'
import { usePixelMinSize } from '@/composables/usePixelMinSize'
import { useStablePanelSizing } from '@/composables/useStablePanelSizing'

defineEmits<{ close: [] }>()

// See usePixelMinSize's own comment for the full reasoning — this keeps
// docs-tree-pane/docs-content-pane's own floor pixel-consistent with every
// other pane in the editor, not just matched to each other, and
// collapsible below lets a drag toward it snap the rest of the way past
// the halfway point instead of stopping smoothly at any arbitrary size
// between CollapsiblePane's own icon/label threshold and this floor.
const { minSize, collapsedSize } = usePixelMinSize('docs-tree-pane', 'height')

const panelItems = computed<SplitterItem[]>(() => [
	{ id: 'docs-tree-pane', slot: 'docs-tree-pane', defaultSize: 45, minSize: minSize.value },
	{ id: 'docs-content-pane', slot: 'docs-content-pane', defaultSize: 55, minSize: minSize.value },
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
const searchResults = computed(() => searchDocs(searchQuery.value))

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
	return stored && nodesByPath.has(stored) ? stored : 'getting-started'
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

function navigate(path: string, opts?: { reveal?: boolean }) {
	currentPath.value = path
	localStorage.setItem(DOCS_PANEL_PATH_KEY, path)
	if (opts?.reveal) {
		for (const entry of ancestorsOf(path)) expandOverrides.set(entry.path, true)
	}
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

function resolveHref(path: string) {
	return `/docs/${path}`
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
watch(currentPath, (path) => {
	for (const entry of ancestorsOf(path)) {
		if (!expandOverrides.has(entry.path)) expandOverrides.set(entry.path, true)
	}
}, { immediate: true })

provide(docsNavigationKey, { currentPath, navigate, resolveHref, isExpanded, toggleExpanded })

const currentNode = computed(() => nodesByPath.get(currentPath.value))
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
					<DocsTree v-if="!isSearching" :nodes="docsTree" />
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
	padding: 0.5em 0.75em;
	background-color: var(--theme-bg-elevated);
}

.docs-search-input {
	width: 100%;
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
