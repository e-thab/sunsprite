<script setup lang="ts">
import { inject } from 'vue'
import type { DocSection } from '@/assets/docs/docsContent'
import { docsExpandStateKey } from './docsExpandState'

defineProps<{
	section: DocSection
	depth: number
}>()

const expandState = inject(docsExpandStateKey)!
</script>

<template>
	<div class="doc-section">
		<button
			class="doc-section-header"
			:style="{ paddingLeft: `${0.5 + depth * 0.9}em` }"
			@click="expandState.toggle(section.id)"
		>
			<UIcon
				v-if="section.children?.length"
				:name="expandState.isExpanded(section.id) ? 'tabler:chevron-down' : 'tabler:chevron-right'"
				class="doc-chevron"
			/>
			<span v-else class="doc-chevron-spacer" />
			<span class="doc-title">{{ section.title }}</span>
		</button>

		<div v-if="expandState.isExpanded(section.id)" class="doc-body">
			<p v-if="section.content" class="doc-content-text" :style="{ paddingLeft: `${0.5 + (depth + 1) * 0.9}em` }">
				{{ section.content }}
			</p>
			<DocsSectionItem
				v-for="child in section.children"
				:key="child.id"
				:section="child"
				:depth="depth + 1"
			/>
		</div>
	</div>
</template>

<style scoped>
.doc-section-header {
	display: flex;
	align-items: center;
	gap: 0.35em;
	width: 100%;
	padding-top: 0.4em;
	padding-bottom: 0.4em;
	padding-right: 0.5em;
	background: none;
	border: none;
	color: var(--theme-text-highlighted);
	font-size: 0.9em;
	text-align: left;
	cursor: pointer;
}

.doc-section-header:hover {
	color: var(--theme-text-bright);
}

.doc-chevron {
	flex-shrink: 0;
	color: var(--theme-text-dim);
}

.doc-chevron-spacer {
	display: inline-block;
	width: 1em;
	flex-shrink: 0;
}

.doc-content-text {
	margin: 0 0 0.5em;
	padding-right: 0.75em;
	font-size: 0.85em;
	color: var(--theme-text-dim);
	line-height: 1.4;
}
</style>
