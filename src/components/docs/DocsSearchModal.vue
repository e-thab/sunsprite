<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui'
import { useDocsSearchStore } from '@/stores/docsSearchStore'
import { searchDocs } from '@/assets/docs/docsSearch'

const searchStore = useDocsSearchStore()
const router = useRouter()
const searchTerm = ref('')

function select(path: string) {
	router.push(`/docs/${path}`)
	searchStore.close()
}

// Grouped by top-level category (the first segment of breadcrumbLabel), same
// grouping the docs tree itself uses. ignoreFilter: true keeps this on the
// project's existing hand-rolled matcher (docsSearch.ts) instead of
// UCommandPalette's default Fuse.js filtering.
const groups = computed<CommandPaletteGroup[]>(() => {
	const results = searchDocs(searchTerm.value)
	const order: string[] = []
	const byCategory = new Map<string, CommandPaletteItem[]>()

	for (const entry of results) {
		const topLabel = entry.breadcrumbLabel.split(' / ')[0] ?? entry.node.title
		if (!byCategory.has(topLabel)) {
			byCategory.set(topLabel, [])
			order.push(topLabel)
		}
		byCategory.get(topLabel)!.push({
			label: entry.node.title,
			description: entry.breadcrumbLabel,
			icon: entry.node.icon,
			to: `/docs/${entry.path}`,
			onSelect: () => select(entry.path),
		})
	}

	return order.map((label) => ({
		id: label,
		label,
		items: byCategory.get(label)!,
		ignoreFilter: true,
	}))
})

function onUpdateOpen(open: boolean) {
	if (!open) searchStore.close()
}
</script>

<template>
	<UModal :open="searchStore.isOpen" :ui="{ content: 'sm:max-w-2xl' }" @update:open="onUpdateOpen">
		<template #content>
			<UCommandPalette
				v-model:search-term="searchTerm"
				:groups="groups"
				placeholder="Search docs..."
				close
				@update:open="onUpdateOpen"
			/>
		</template>
	</UModal>
</template>
