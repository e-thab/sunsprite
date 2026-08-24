<script setup lang="ts">
import type { DocsTocSection } from '@/assets/docs/docsToc'

// Sections come from the page itself — each DocSection registers as it mounts
// (see docsToc.ts) — rather than being derived from the node, since a page is
// free-form markup and only it knows what's in it. That also means this
// renders its own anchor list rather than using @nuxt/ui's ContentToc, which
// expects @nuxt/content's TocLink shape (that package isn't installed here).
defineProps<{
	sections: DocsTocSection[]
}>()

function scrollTo(id: string) {
	document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// No registered section to scrollIntoView here — this goes to the top of the
// scroll container itself. Queried live rather than held as a template ref,
// same reasoning as DocsView.vue's own tree/toc lookups: this renders inside
// UPage's `right` slot, and reka-ui's Slot re-clones that vnode on every
// render, dropping any ref on slot content after the first one.
function scrollToTop() {
	document.querySelector('.docs-view')?.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
	<PageAside v-if="sections.length > 1" class="docs-toc">
		<div class="toc-title">On this page</div>
		<button type="button" class="toc-link" @click="scrollToTop">Top<UIcon style="margin-top: 0.2rem; font-size: 1rem;" :name="'tabler:arrow-narrow-up'"/></button>
		<button v-for="section in sections" :key="section.id" type="button" class="toc-link" @click="scrollTo(section.id)">
			{{ section.label }}
		</button>
	</PageAside>
</template>

<style scoped>
.docs-toc {
	display: flex;
	flex-direction: column;
	gap: 0.35em;
	padding: 1em 0.75em;
	position: sticky;
	top: 0;
	/* Same fix as .docs-view-tree (DocsView.vue): PageAside's own Nuxt UI
	   theme tries this via `lg:max-h-[calc(100vh-var(--ui-header-height))]`,
	   but --ui-header-height is never defined in this app (only --nav-height
	   is), so that max-height silently resolves to `none` and this is
	   unconstrained instead. */
	max-height: calc(100vh - var(--nav-height));
	overflow-y: auto;
	scrollbar-gutter: stable;
}

.toc-title {
	font-size: 0.8em;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: var(--theme-text);
	margin-bottom: 0.25em;
	border-bottom: var(--theme-text-muted) solid 1px;
}

.toc-link {
	background: none;
	border: none;
	padding: 0.2em 0;
	text-align: left;
	color: var(--theme-text);
	font-size: 0.85em;
	cursor: pointer;
	display: grid;
	grid-template-columns: 0fr 0.1fr;
}

.toc-link:hover {
	color: var(--theme-text-highlighted);
}
</style>
