import type { Component } from 'vue'

export type DocRef = {
	path: string
	label?: string
}

/**
 * What every page SFC exports as `meta` from its plain `<script>` block:
 *
 * ```vue
 * <script lang="ts">
 * export const meta = { title: 'Sprite', icon: 'tabler:photo', summary: 'An image-based game object.' }
 *
 * // The page component. A page that needs logic replaces this with a
 * // `<script setup>` block of its own (and drops this line — Vue allows
 * // only one of the two).
 * export default {}
 * </script>
 *
 * <template>
 *   <DocSnippet><pre>new Sprite(options?: SpriteProps)</pre></DocSnippet>
 *   <p>...</p>
 * </template>
 * ```
 *
 * Nothing here repeats where the file lives — a page's slug is its filename
 * and its place in the tree is its folder (see docsContent.ts), so moving or
 * renaming the file is what moves the page.
 */
export type DocPageMeta = {
	title: string
	icon?: string
	/** One-liner, shown in search results and on the parent category's card for this page. */
	summary: string
	/**
	 * Only meaningful on a category's `index.vue` (and on the content root's):
	 * the order this folder's pages appear in, listed by slug — a page's
	 * filename, or a subcategory's folder name. Reordering a category is
	 * editing this one list; pages it leaves out follow the listed ones,
	 * alphabetically by title.
	 */
	order?: string[]
}

type DocNodeBase = {
	/** URL segment, unique among siblings — the page's filename (or folder name, for a category). */
	slug: string
	/** Every ancestor slug plus this node's own, joined — i.e. its /docs/... address. */
	path: string
	title: string
	icon?: string
	summary: string
	/** The page's own SFC. Only ever missing on a category folder with no index.vue. */
	component?: Component
	/** The page's visible text, flattened out of its source at build time, for search. */
	searchText: string
}

export type DocCategoryNode = DocNodeBase & {
	kind: 'category'
	children: DocNode[]
}

export type DocEntryNode = DocNodeBase & {
	kind: 'entry'
	component: Component
}

export type DocNode = DocCategoryNode | DocEntryNode
