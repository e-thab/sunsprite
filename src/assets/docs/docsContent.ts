import type { Component } from 'vue'
import type { DocCategoryNode, DocEntryNode, DocNode, DocPageMeta } from './docsTypes'

export * from './docsTypes'

// --- The docs tree, from the filesystem -----------------------------------
// Every page under content/ is a Vue SFC, and where the file sits is what
// places it in the tree: `content/api/classes/sprite.vue` is the page at
// /docs/api/classes/sprite, and a folder becomes a category whose landing
// page is its own `index.vue`. Adding a page means adding one .vue file —
// there's no manifest to keep in sync, which is the whole point.
//
// Each page exports its own `meta` (title/icon/summary/order) from a plain
// `<script>` block, alongside the default export that makes it a component;
// see DocPageMeta for the exact shape.

type DocPageModule = {
	default: Component
	meta?: DocPageMeta
}

const pageModules = import.meta.glob<DocPageModule>('./content/**/*.vue', { eager: true })

// The same files again as plain source text. Pages are free-form markup now,
// so there's no structured body left to search over — the text has to come
// back out of the source (see pageText below).
const pageSources = import.meta.glob<string>('./content/**/*.vue', {
	eager: true,
	query: '?raw',
	import: 'default',
})

const CONTENT_PREFIX = './content/'

type DocPageFile = {
	/** Partial because it's whatever the page actually exported — see readPage. */
	meta: Partial<DocPageMeta>
	component: Component
	searchText: string
}

type DocDir = {
	/** Pages in this folder, keyed by slug. `index.vue` isn't among them — it's `index` below. */
	pages: Map<string, DocPageFile>
	dirs: Map<string, DocDir>
	/** This folder's own `index.vue`, i.e. the category's landing page. */
	index?: DocPageFile
}

function emptyDir(): DocDir {
	return { pages: new Map(), dirs: new Map() }
}

/**
 * Everything a reader would actually see on the page, as one string. Script
 * and style blocks go (they're plumbing, and matching a page because of its
 * imports would be noise), then tag and attribute *names* go while attribute
 * *values* stay — the text of a param or property lives in an attribute or a
 * slot, and both need to be searchable.
 */
function pageText(source: string): string {
	return source
		.replace(/<script[\s\S]*?<\/script>/gi, ' ')
		.replace(/<style[\s\S]*?<\/style>/gi, ' ')
		.replace(/<!--[\s\S]*?-->/g, ' ')
		.replace(/<\/?[A-Za-z][\w.-]*/g, ' ')
		.replace(/[\w:@.-]+=/g, ' ')
		.replace(/\/?>/g, ' ')
		.replace(/&[a-z]+;|&#\d+;/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

function titleFromSlug(slug: string): string {
	return slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

// Deliberately unvalidated: a page missing its `meta` still becomes a node
// (with a warning, see nodeTitle) rather than vanishing from the tree, which
// is a far easier thing to debug than a page that silently isn't there.
function readPage(key: string): DocPageFile {
	const module = pageModules[key]!

	return {
		meta: module.meta ?? {},
		component: module.default,
		searchText: pageText(pageSources[key] ?? ''),
	}
}

function buildDirTree(): DocDir {
	const root = emptyDir()

	for (const key of Object.keys(pageModules)) {
		const page = readPage(key)

		const segments = key.slice(CONTENT_PREFIX.length, -'.vue'.length).split('/')
		const slug = segments.pop()!

		let dir = root
		for (const segment of segments) {
			if (!dir.dirs.has(segment)) dir.dirs.set(segment, emptyDir())
			dir = dir.dirs.get(segment)!
		}

		if (slug === 'index') dir.index = page
		else dir.pages.set(slug, page)
	}

	return root
}

function nodeTitle(meta: Partial<DocPageMeta>, slug: string, path: string): string {
	if (meta.title) return meta.title

	console.warn(`[docs] ${path} has no meta.title — falling back to "${titleFromSlug(slug)}". See DocPageMeta.`)
	return titleFromSlug(slug)
}

/**
 * Sibling order comes from the folder's own index.vue — `meta.order`, a list
 * of slugs — so reordering a category means moving one line in one file
 * rather than renumbering every page in it. Pages the list doesn't mention
 * follow the ones it does, alphabetically, so a page added without touching
 * the list still lands somewhere predictable.
 */
function sortByFolderOrder(nodes: DocNode[], order: string[] | undefined, path: string): DocNode[] {
	const rank = new Map(order?.map((slug, index) => [slug, index]))

	for (const slug of order ?? []) {
		if (!nodes.some((node) => node.slug === slug)) {
			console.warn(`[docs] "${path || 'the docs root'}" lists "${slug}" in meta.order, but has no such page.`)
		}
	}

	// MAX_SAFE_INTEGER rather than Infinity: two unlisted pages would otherwise
	// subtract to NaN, and a comparator that returns NaN never reaches the
	// alphabetical tiebreak.
	const rankOf = (node: DocNode) => rank.get(node.slug) ?? Number.MAX_SAFE_INTEGER

	return nodes.sort((a, b) => rankOf(a) - rankOf(b) || a.title.localeCompare(b.title))
}

function buildNodes(dir: DocDir, parentPath: string): DocNode[] {
	const nodes: DocNode[] = []

	for (const [slug, subDir] of dir.dirs) {
		const path = parentPath ? `${parentPath}/${slug}` : slug
		const meta = subDir.index?.meta

		if (!meta) {
			console.warn(`[docs] the "${path}" folder has no index.vue — its landing page has no title or summary.`)
		}

		nodes.push({
			kind: 'category',
			slug,
			path,
			title: nodeTitle(meta ?? {}, slug, `${path}/index.vue`),
			icon: meta?.icon,
			summary: meta?.summary ?? '',
			component: subDir.index?.component,
			searchText: subDir.index?.searchText ?? '',
			children: buildNodes(subDir, path),
		} satisfies DocCategoryNode)
	}

	for (const [slug, page] of dir.pages) {
		const path = parentPath ? `${parentPath}/${slug}` : slug

		nodes.push({
			kind: 'entry',
			slug,
			path,
			title: nodeTitle(page.meta, slug, `${path}.vue`),
			icon: page.meta.icon,
			summary: page.meta.summary ?? '',
			component: page.component,
			searchText: page.searchText,
		} satisfies DocEntryNode)
	}

	return sortByFolderOrder(nodes, dir.index?.meta.order, parentPath)
}

export const docsTree: DocNode[] = buildNodes(buildDirTree(), '')
