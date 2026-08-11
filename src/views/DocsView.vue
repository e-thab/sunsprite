<script setup lang="ts">
import { computed, provide, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { docsTree } from '@/assets/docs/docsContent'
import { nodesByPath, ancestorsOf } from '@/assets/docs/docsIndex'
import { docsNavigationKey } from '@/assets/docs/docsNavigation'
import DocsTree from '@/components/docs/DocsTree.vue'
import DocsBreadcrumb from '@/components/docs/DocsBreadcrumb.vue'
import DocsCategoryLanding from '@/components/docs/DocsCategoryLanding.vue'
import DocsBody from '@/components/docs/DocsBody.vue'
import DocsToc from '@/components/docs/DocsToc.vue'
import ErrorView from './ErrorView.vue'

const route = useRoute()
const router = useRouter()

const currentPath = computed(() => {
	const raw = route.params.pathMatch
	return Array.isArray(raw) ? raw.join('/') : (raw ?? '')
})

function navigate(path: string, opts?: { reveal?: boolean }) {
	router.push(`/docs/${path}`)
	if (opts?.reveal) {
		for (const entry of ancestorsOf(path)) expandOverrides.set(entry.path, true)
	}
}

function resolveHref(path: string) {
	return `/docs/${path}`
}

// Expand/collapse state, keyed by path — entirely persistent and
// user-controlled from here on: nothing ever *removes* a path once it's
// been decided, so navigating elsewhere can never make a category collapse.
// (An earlier version fell back to "is this path an ancestor of the current
// page" for anything untouched, which made navigation-driven auto-expand
// look right up until you navigated *away* — the ancestry check would then
// just as automatically go false again, reading as an unwanted collapse.)
const expandOverrides = reactive(new Map<string, boolean>())

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
	<ErrorView
		v-if="!currentNode"
		:status-code="404"
		status-message="Doc not found"
		message="There's no documentation page at this address."
		back-label="Back to docs"
		back-to="/docs"
	/>

	<UPage v-else class="docs-view">
		<template #left>
			<div class="docs-view-tree">
				<DocsTree :nodes="docsTree" />
			</div>
		</template>

		<DocsBreadcrumb />

		<PageBody>
			<Container class="docs-view-container">
				<DocsCategoryLanding v-if="currentNode.kind === 'category'" :node="currentNode" :path="currentPath" />
				<DocsBody v-else :node="currentNode" />
			</Container>
		</PageBody>

		<template #right>
			<DocsToc :node="currentNode" />
		</template>
	</UPage>
</template>

<style scoped>
.docs-view {
	height: 100%;
	overflow-y: auto;
	background-color: var(--theme-bg-elevated);
}

.docs-view-tree {
	padding: 1em 0.5em;
	position: sticky;
	top: 0;
}

.docs-view-container {
	max-width: 48rem;
	padding-block: 1.5em;
}
</style>
