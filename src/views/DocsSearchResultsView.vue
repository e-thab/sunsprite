<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { searchDocs } from '@/assets/docs/docsSearch'
import DocsSearchResultsList from '@/components/docs/DocsSearchResultsList.vue'

const route = useRoute()
const router = useRouter()

const query = ref(typeof route.query.q === 'string' ? route.query.q : '')

// Keeps the address bar in sync as the user edits the query here, same as
// any normal search results page — replace (not push) so retyping doesn't
// spam browser history.
watch(query, (value) => {
	router.replace({ path: '/docs/search', query: value ? { q: value } : {} })
})

watch(() => route.query.q, (value) => {
	const next = typeof value === 'string' ? value : ''
	if (next !== query.value) query.value = next
})

const results = computed(() => searchDocs(query.value))

function onSelect(path: string) {
	router.push(`/docs/${path}`)
}
</script>

<template>
	<div class="search-view">
		<UContainer class="search-container">
			<h1 class="search-title">Search Docs</h1>
			<UInput
				v-model="query"
				icon="fa7-solid:magnifying-glass"
				placeholder="Search docs..."
				size="lg"
				autofocus
				class="search-input"
			/>

			<p class="result-count">{{ results.length }} result{{ results.length === 1 ? '' : 's' }}</p>

			<DocsSearchResultsList :results="results" @select="onSelect" />
		</UContainer>
	</div>
</template>

<style scoped>
.search-view {
	height: 100%;
	overflow-y: auto;
	background-color: var(--theme-bg-elevated);
}

.search-container {
	max-width: 40rem;
	padding-block: 2em;
}

.search-title {
	margin: 0 0 0.75em;
	color: var(--theme-text-highlighted);
}

.search-input {
	width: 100%;
}

.result-count {
	margin: 1em 0 0.5em;
	font-size: 0.85em;
	color: var(--theme-text-toned);
}
</style>
