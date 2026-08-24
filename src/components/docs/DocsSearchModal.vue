<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { CommandPaletteGroup, CommandPaletteItem } from '@nuxt/ui'
import { useDocsSearchStore } from '@/stores/docsSearchStore'
import { searchDocs, type SnippetPart } from '@/assets/docs/docsSearch'

const searchStore = useDocsSearchStore()
const router = useRouter()
const searchTerm = ref('')

function select(path: string) {
	router.push(`/docs/${path}`)
	searchStore.close()
}

function escapeHtml(text: string): string {
	return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// UCommandPalette renders descriptionHtml via v-html, so this is the one
// place that needs real HTML rather than the plain SnippetPart[] the other
// two search surfaces hand straight to a template loop (see
// DocsSearchResultsList.vue) — same query-in-context excerpt, just built as
// a string instead of rendered directly.
function snippetHtml(parts: SnippetPart[]): string {
	return parts.map((part) => (part.matched ? `<mark class="docs-search-mark">${escapeHtml(part.text)}</mark>` : escapeHtml(part.text))).join('')
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
			// Plain-text description as a fallback (accessibility, anything
			// Nuxt UI derives from the item besides the rendered row) plus the
			// highlighted excerpt for the actual visible row — same
			// query-in-context snippet as the other two search surfaces, so
			// all three read as one feature instead of the command palette
			// being the one place still showing just a bare breadcrumb.
			description: entry.snippet ? entry.snippet.map((part) => part.text).join('') : entry.node.summary,
			descriptionHtml: entry.snippet ? snippetHtml(entry.snippet) : escapeHtml(entry.node.summary),
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
			<!-- Nuxt UI's own default for itemDescription is a single-line
			`truncate` (hard pixel-width cutoff, mid-word if that's where the
			width runs out) — fine for a short plain description, but it was
			re-truncating the already width-aware snippet built by
			docsSearch.ts's windowAroundMatch independently of it, sometimes
			slicing right through the highlighted match. line-clamp lets it wrap
			instead, which — being text-reflow-based — only ever breaks on a
			word boundary. -->
			<UCommandPalette
				v-model:search-term="searchTerm"
				:groups="groups"
				:ui="{ itemDescription: 'whitespace-normal line-clamp-3' }"
				icon="fa7-solid:magnifying-glass"
				placeholder="Search docs..."
				close
				@update:open="onUpdateOpen"
			/>
		</template>
	</UModal>
</template>

<style>
/* Deliberately unscoped: descriptionHtml (see snippetHtml above) is rendered
by UCommandPalette via v-html, so the <mark> it produces lands inside that
component's own template, outside this component's scope boundary — a
scoped rule here would never reach it. Same reasoning DocsTree.vue's own
unscoped block documents for UTree. Matches .result-match's treatment in
DocsSearchResultsList.vue, the other two search surfaces' highlight style. */
.docs-search-mark {
	background-color: color-mix(in srgb, var(--theme-primary) 35%, transparent);
	color: var(--theme-text-highlighted);
	border-radius: 0.2em;
	padding: 0 0.15em;
	font-weight: 600;
}
</style>
