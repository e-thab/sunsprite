<script setup lang="ts">
import { computed, inject } from 'vue'
import type { TreeItem } from '@nuxt/ui'
import type { DocNode } from '@/assets/docs/docsTypes'
import { nodesByPath } from '@/assets/docs/docsIndex'
import { docsNavigationKey } from '@/assets/docs/docsNavigation'

const props = defineProps<{
	nodes: DocNode[]
}>()

const nav = inject(docsNavigationKey)!

// Categories never select (that's what the label's own click does, see
// item-label below) and never toggle natively either — onToggle's
// preventDefault blocks Tree's own click-to-expand/reveal-selected behavior
// entirely, so the chevron's own explicit click handler (below) is the only
// thing that ever changes expand state. This is deliberately stricter than
// just suppressing onSelect: Tree's native toggle-on-select can otherwise
// silently expand/collapse categories unrelated to whatever the user
// actually clicked (e.g. when selecting a deeply-nested item reveals its
// ancestors), which fights the "expand state is entirely user-controlled"
// requirement — routing every change through nav.toggleExpanded ourselves is
// what makes that guarantee actually hold.
function preventCategorySelect(event: Event) {
	event.preventDefault()
}

function preventNativeToggle(event: Event) {
	event.preventDefault()
}

// The label does double duty: it navigates to the category's own landing
// page, and — depending on the category's current state — may also toggle
// expand/collapse, so collapsing isn't chevron-only:
//   - collapsed -> always expands (regardless of whether it's already
//     current, e.g. re-clicking a category you'd collapsed while viewing it).
//   - expanded, not the current page -> just navigates; doesn't collapse.
//     Lets you click into/around an already-expanded branch (e.g. Output ->
//     print() -> back to Output) without it collapsing out from under you.
//   - expanded, and already the current page -> a second, deliberate click
//     on the same spot is what collapses it.
function onCategoryLabelClick(path: string) {
	const wasCurrent = nav.currentPath.value === path
	const wasExpanded = nav.isExpanded(path)
	nav.navigate(path)
	if (!wasExpanded || wasCurrent) nav.toggleExpanded(path)
}

// Paths aren't stored on DocNode itself — they're positional (slugs joined
// by ancestry), and filterTree() can return cloned category objects while
// pruning to matches, so a node -> path reverse lookup wouldn't be reliable.
// Recomputing by threading parentPath through, same as docsIndex.ts's own
// walk(), is what stays correct regardless of node identity.
function buildItems(nodes: DocNode[], parentPath: string | null): TreeItem[] {
	return nodes.map((node): TreeItem => {
		const path = parentPath ? `${parentPath}/${node.slug}` : node.slug
		if (node.kind === 'category') {
			return {
				id: path,
				label: node.title,
				icon: node.icon,
				path,
				isCategory: true,
				onSelect: preventCategorySelect,
				onToggle: preventNativeToggle,
				children: buildItems(node.children, path),
			}
		}
		return {
			id: path,
			label: node.title,
			icon: node.icon,
			path,
			isCategory: false,
			onSelect: () => nav.navigate(path),
		}
	})
}

const items = computed(() => buildItems(props.nodes, null))

// UTree's v-model expects the selected TreeItem object itself (matched
// against `items` by `getKey`, not by identity) — driving it from
// nav.currentPath rather than click-based selection is what highlights
// whatever's currently open, including entries reached via a link/breadcrumb
// rather than a tree click. Deliberately one-way (no @update:model-value):
// UTree's own selection isn't what drives navigation here, the onSelect
// handlers above already do that.
function findItemByPath(nodes: TreeItem[], path: string): TreeItem | undefined {
	for (const item of nodes) {
		if (item.path === path) return item
		if (item.children) {
			const found = findItemByPath(item.children, path)
			if (found) return found
		}
	}
	return undefined
}

const selectedItem = computed(() => findItemByPath(items.value, nav.currentPath.value))

// Only category paths are ever expandable — leaves never appear in `expanded`.
const categoryPaths = computed(() => Array.from(nodesByPath.entries()).filter(([, node]) => node.kind === 'category').map(([path]) => path))

// Purely one-way: :expanded here is always authoritative, driven only by
// nav.isExpanded/toggleExpanded (via the chevron's own click handler) — not
// reconciled against anything Tree itself emits, since that's exactly the
// mechanism that could otherwise introduce unintended expand/collapse.
const expandedPaths = computed(() => categoryPaths.value.filter((path) => nav.isExpanded(path)))
</script>

<template>
	<UTree
		:items="items"
		:get-key="(item: TreeItem) => item.id"
		:model-value="selectedItem"
		:expanded="expandedPaths"
		:ui="{ linkLabel: 'flex-1 min-w-0' }"
		class="docs-tree"
	>
		<!-- TEMPORARY: item-leading override removed so Nuxt UI renders its
		own default leading icon (item.icon, no left chevron) for comparison
		against the right-side chevron. Restore the previous #item-leading
		block (chevron + doc-icon, with doc-icon-current highlighting) to
		revert. -->

		<!-- The label wrapper is stretched to fill the row (via the `ui`
		override above) so this span's own box — not just its text — spans the
		full gap up to the trailing chevron. That's deliberate: it's what
		makes clicking the empty space next to a category's title behave the
		same as clicking the title text itself, per onCategoryLabelClick. -->
		<template #item-label="{ item }">
			<span
				v-if="item.isCategory"
				class="doc-title doc-title-fill"
				:class="{ 'doc-title-current': item.path === nav.currentPath.value }"
				@click.stop="onCategoryLabelClick(item.path)"
			>{{ item.label }}</span>
			<span
				v-else
				class="doc-title doc-title-fill"
				:class="{ 'doc-title-current': item.path === nav.currentPath.value }"
			>{{ item.label }}</span>
		</template>

		<!-- Mirrors the leading chevron exactly (same handler, same
		unconditional toggle) so left and right chevrons are interchangeable. -->
		<template #item-trailing="{ item, expanded }">
			<UIcon
				v-if="item.isCategory"
				:name="expanded ? 'tabler:chevron-down' : 'tabler:chevron-right'"
				class="doc-chevron"
				@click.stop="nav.toggleExpanded(item.path)"
			/>
		</template>
	</UTree>
</template>

<style scoped>
.docs-tree {
	font-size: 0.9em;
}

.doc-chevron {
	flex-shrink: 0;
	color: var(--theme-text-toned);
	cursor: pointer;
}

.doc-chevron-spacer {
	display: inline-block;
	width: 1em;
	flex-shrink: 0;
}

.doc-icon {
	flex-shrink: 0;
	color: var(--theme-text-toned);
}

.doc-icon-current {
	color: var(--theme-primary);
}

.doc-title {
	color: var(--theme-text-highlighted);
	cursor: pointer;
}

/* Fills the label wrapper's flex-grown width (see the `ui` override on
   UTree above) so the clickable/hoverable box extends through the empty
   space up to the trailing chevron, not just the text itself. */
.doc-title-fill {
	display: block;
	width: 100%;
	/* The ancestor is a native <button> (UTree's row), which centers text by
	   default — invisible while this span only spanned its own text, but
	   this override matters now that it's stretched to full width. */
	text-align: left;
}

.doc-title:hover {
	color: var(--theme-text);
}

.doc-title-current {
	color: var(--theme-primary);
	font-weight: bold;
}

/* :hover alone outweighs a single class (higher specificity), so without
   this, hovering the current item would fall back to the plain hover color
   instead of keeping the primary highlight. */
.doc-title-current:hover {
	color: var(--theme-primary);
}
</style>
