<script setup lang="ts">
import { computed, provide, reactive, ref } from 'vue'
import { docsSections } from '@/assets/docs/docsContent'
import { filterDocsSections } from '@/assets/docs/docsSearch'
import { docsExpandStateKey } from '../assets/docs/docsExpandState.ts'
import DocsSectionItem from './DocsSectionItem.vue'

defineEmits<{ close: [] }>()

const searchQuery = ref('')

// Getting Started open by default, like a friendly landing point; searching
// temporarily treats every section in the filtered results as expanded (see
// isExpanded below) so matches never need an extra click to reveal, without
// touching this set — clearing the search restores exactly what the user
// had manually opened before.
const manuallyExpanded = reactive(new Set<string>(['getting-started']))

function toggle(id: string) {
	if (manuallyExpanded.has(id)) manuallyExpanded.delete(id)
	else manuallyExpanded.add(id)
}

const isSearching = computed(() => searchQuery.value.trim().length > 0)

function isExpanded(id: string): boolean {
	if (isSearching.value) return true
	return manuallyExpanded.has(id)
}

provide(docsExpandStateKey, { isExpanded, toggle })

const filteredSections = computed(() => filterDocsSections(docsSections, searchQuery.value))

// TODO: don't accept game input while typing into the search bar
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

		<div class="docs-content">
			<DocsSectionItem
				v-for="section in filteredSections"
				:key="section.id"
				:section="section"
				:depth="0"
			/>

			<p v-if="isSearching && filteredSections.length === 0" class="docs-no-results">
				No matching sections found.
			</p>
		</div>
	</div>
</template>

<style scoped>
.docs-search {
	flex-shrink: 0;
	padding: 0.5em 0.75em;
	/* border-bottom: 1px solid var(--theme-border); */
	background-color: var(--theme-bg-neutral);
}

.docs-search-input {
	width: 100%;
}

.docs-content {
	flex: 1 1 auto;
	overflow-y: auto;
	padding: 0.25em 0;
	color: var(--theme-text-bright);
	background-color: var(--theme-bg-neutral);
}

.docs-no-results {
	padding: 0.75em 1em;
	margin: 0;
	font-size: 0.85em;
	color: var(--theme-text-dim);
}
</style>
