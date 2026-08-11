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

// Reka UI's Dialog returns focus to whatever triggered it (the NavBar search
// button) once this closes. When that close came from the keyboard (Escape,
// or Enter to select a result), the browser's focus-visible heuristic treats
// the returned focus as keyboard-driven too — which re-opens that button's
// tooltip (ignore-non-keyboard-focus only screens out mouse-driven focus)
// and leaves it stuck open with nothing left to close it. Skipping the
// auto-focus entirely avoids that; the trade-off is keyboard users land back
// at the top of the tab order instead of exactly on the search button.
function onContentCloseAutoFocus(event: Event) {
	event.preventDefault()
}
</script>

<template>
	<UModal
		:open="searchStore.isOpen"
		:ui="{ content: 'sm:max-w-2xl' }"
		:content="{ onCloseAutoFocus: onContentCloseAutoFocus }"
		@update:open="onUpdateOpen"
	>
		<template #content>
			<UCommandPalette
				v-model:search-term="searchTerm"
				:groups="groups"
				icon="fa7-solid:magnifying-glass"
				placeholder="Search docs..."
				close
				@update:open="onUpdateOpen"
			/>
		</template>
	</UModal>
</template>
