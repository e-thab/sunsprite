<script setup lang="ts">
import { computed } from 'vue'
import type { DocBody, DocNode } from '@/assets/docs/docsTypes'

// Sections here are synthetic (derived from the structured api-member body),
// not real parsed headings — so this renders its own simple anchor list
// rather than using @nuxt/ui's ContentToc, which expects @nuxt/content's
// TocLink shape (that package isn't installed in this project).
const props = defineProps<{
	node: DocNode
}>()

type TocSection = { id: string; label: string }

// Custom widget sections are anchored the same way the templated ones are, so
// they list here too — titleless ones have nothing to label a link with, and
// DocsBody renders them without a heading, so they're skipped.
function widgetSections(body: DocBody, placement: 'top' | 'bottom'): TocSection[] {
	return (body.widgets ?? [])
		.filter((w) => (placement === 'top' ? w.placement === 'top' : w.placement !== 'top') && w.title)
		.map((w) => ({ id: `section-${w.id}`, label: w.title! }))
}

const sections = computed<TocSection[]>(() => {
	if (props.node.kind === 'category') return []
	const body = props.node.body

	const list: TocSection[] = widgetSections(body, 'top')

	if (body.kind === 'prose') return [...list, ...widgetSections(body, 'bottom')]

	list.push({ id: 'section-description', label: 'Description' })
	if (body.params?.length) list.push({ id: 'section-params', label: 'Params' })
	if (body.returns) list.push({ id: 'section-returns', label: 'Returns' })
	if (body.properties?.length) list.push({ id: 'section-properties', label: 'Properties' })
	if (body.methods?.length) list.push({ id: 'section-methods', label: 'Methods' })
	if (body.mixins?.length) list.push({ id: 'section-composed-from', label: 'Composed From' })
	if (body.example) list.push({ id: 'section-example', label: 'Example' })
	list.push(...widgetSections(body, 'bottom'))
	return list
})

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
