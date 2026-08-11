<script setup lang="ts">
import { computed, provide, reactive, ref, watch } from 'vue'
import { Splitpanes, Pane } from 'splitpanes'
import { docsTree } from '@/assets/docs/docsContent'
import { nodesByPath, ancestorsOf } from '@/assets/docs/docsIndex'
import { filterTree } from '@/assets/docs/docsSearch'
import { docsNavigationKey } from '@/assets/docs/docsNavigation'
import DocsTree from './docs/DocsTree.vue'
import DocsBreadcrumb from './docs/DocsBreadcrumb.vue'
import DocsCategoryLanding from './docs/DocsCategoryLanding.vue'
import DocsBody from './docs/DocsBody.vue'

defineEmits<{ close: [] }>()

const searchQuery = ref('')
const isSearching = computed(() => searchQuery.value.trim().length > 0)
const visibleTree = computed(() => filterTree(docsTree, searchQuery.value))

// The panel's own navigation state — intentionally NOT synced to the
// browser route (see docs/plans/docs-panel-rebuild.md, decision #1). The
// "open full page" link is what turns this into a real, shareable URL.
const currentPath = ref('getting-started')

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
	if (opts?.reveal) {
		for (const entry of ancestorsOf(path)) expandOverrides.set(entry.path, true)
	}
}

function resolveHref(path: string) {
	return `/docs/${path}`
}

function isExpanded(path: string): boolean {
	if (isSearching.value) return true
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
				icon="tabler:search"
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

		<splitpanes horizontal class="docs-panes" :push-other-panes="false">
			<pane size="45" class="docs-tree-pane">
				<div class="docs-tree-scroll">
					<DocsTree :nodes="visibleTree" />
					<p v-if="isSearching && visibleTree.length === 0" class="docs-no-results">No matching sections found.</p>
				</div>
			</pane>

			<pane size="55" class="docs-content-pane">
				<div class="docs-content-scroll">
					<DocsCategoryLanding v-if="currentNode?.kind === 'category'" :node="currentNode" :path="currentPath">
						<template #header-actions>
							<UTooltip text="Open full page">
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
							<UTooltip text="Open full page">
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
			</pane>
		</splitpanes>
	</div>
</template>

<style scoped>
.panel-wrapper {
	display: flex;
	flex-direction: column;
	height: 100%;
}

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
	display: flex;
	align-items: center;
	background-color: var(--theme-bg-elevated);
	border-bottom: 1px solid var(--theme-border);
}

.breadcrumb {
	min-width: 0;
	flex: 1 1 auto;
}

.docs-panes {
	flex: 1 1 auto;
	min-height: 0;
}

.docs-tree-pane {
	height: 100%;
}

.docs-content-pane {
	height: 100%;
}

.docs-tree-scroll {
	height: 100%;
	overflow-y: auto;
	padding: 0.25em 0;
	background-color: var(--theme-bg-elevated);
}

.docs-content-scroll {
	height: 100%;
	overflow-y: auto;
	padding: 0.75em 1em;
	background-color: var(--theme-bg-elevated);
	border-top: 1px solid var(--theme-border);
}

.docs-no-results {
	padding: 0.75em 1em;
	margin: 0;
	font-size: 0.85em;
	color: var(--theme-text-toned);
}
</style>
