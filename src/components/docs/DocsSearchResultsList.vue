<script setup lang="ts">
import type { DocIndexEntry } from '@/assets/docs/docsIndex'

defineProps<{
	results: DocIndexEntry[]
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
				<div class="result-summary">{{ result.node.summary }}</div>
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
	border-radius: 0.3rem;
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

.no-results {
	padding: 0.75em 0;
	margin: 0;
	font-size: 0.85em;
	color: var(--theme-text-toned);
}
</style>
