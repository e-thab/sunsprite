<script setup lang="ts">
import type { DocSearchResult } from '@/assets/docs/docsSearch'

defineProps<{
	results: DocSearchResult[]
}>()

const emit = defineEmits<{
	select: [path: string]
}>()
</script>

<template>
	<div class="results-list">
		<button
			v-for="result in results"
			:key="result.path"
			type="button"
			class="result-row"
			@click="emit('select', result.path)"
		>
			<UIcon v-if="result.node.icon" :name="result.node.icon" class="result-icon" />
			<div class="result-body">
				<div class="result-breadcrumb">{{ result.breadcrumbLabel }}</div>
				<!-- No whitespace between the parts: each part's own text already carries
				whatever spacing separated it from its neighbor in the source sentence, so an
				added newline/indent here would introduce space that was never really there. -->
				<div v-if="result.snippet" class="result-summary"><template v-for="(part, i) in result.snippet" :key="i"><mark v-if="part.matched" class="result-match">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></div>
				<div v-else class="result-summary">{{ result.node.summary }}</div>
			</div>
		</button>

		<p v-if="results.length === 0" class="no-results">No matching docs found.</p>
	</div>
</template>

<style scoped>
.results-list {
	display: flex;
	flex-direction: column;
	gap: 0.4em;
}

.result-row {
	display: flex;
	align-items: flex-start;
	gap: 0.65em;
	padding: 0.6em 0.85em;
	background-color: var(--theme-bg);
	border: 1px solid var(--theme-border);
	border-radius: var(--panel-border-radius);
	cursor: pointer;
	text-align: left;
}

.result-row:hover {
	background-color: var(--theme-bg-accented);
}

.result-icon {
	flex-shrink: 0;
	margin-top: 0.15em;
	color: var(--theme-text-toned);
}

.result-body {
	min-width: 0;
}

.result-breadcrumb {
	color: var(--theme-text-highlighted);
	font-size: 0.9em;
}

.result-summary {
	color: var(--theme-text-toned);
	font-size: 0.85em;
}

/* Matches docsSearch.ts's snippetFor() output — the query words within a
   result's excerpt, called out the same way Vue's own docs search highlights
   its snippets. */
.result-match {
	background-color: color-mix(in srgb, var(--theme-primary) 35%, transparent);
	color: var(--theme-text-highlighted);
	border-radius: 0.2em;
	padding: 0 0.15em;
	font-weight: 600;
}

.no-results {
	padding: 0.75em 0;
	margin: 0;
	font-size: 0.85em;
	color: var(--theme-text-toned);
}
</style>
