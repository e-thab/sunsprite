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
</script>

<template>
	<PageAside v-if="sections.length > 1" class="docs-toc">
		<div class="toc-title">On this page</div>
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
}

.toc-title {
	font-size: 0.8em;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: var(--theme-text-toned);
	margin-bottom: 0.25em;
}

.toc-link {
	background: none;
	border: none;
	padding: 0.2em 0;
	text-align: left;
	color: var(--theme-text-toned);
	font-size: 0.85em;
	cursor: pointer;
}

.toc-link:hover {
	color: var(--theme-text);
}
</style>
