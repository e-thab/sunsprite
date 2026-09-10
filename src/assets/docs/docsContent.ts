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

export type DocPageModule = {
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

/**
 * Re-keys a glob result from `./content/api/colors.vue` down to the plain
 * `api/colors.vue` buildDocsTree expects — the prefix strip is the one part
 * that's different for every caller (docsVersions.ts's per-version globs live
 * at a completely different relative depth), so it happens here, once per
 * glob, rather than being threaded through buildDocsTree itself.
 */
function stripPrefix<T>(glob: Record<string, T>, prefix: string): Record<string, T> {
	return Object.fromEntries(Object.entries(glob).map(([key, value]) => [key.slice(prefix.length), value]))
}

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

type ElementAttrs = Record<string, string | true>

/**
 * Every `<Tag attr="val" ...>body</Tag>` (attributes in any order, self-
 * closing allowed, no same-named tag nested inside) is replaced by whatever
 * `format` returns. Used below to turn the doc blocks whose meaningful text
 * lives in *attributes* (a param's name and type, a return's type) into one
 * clean phrase before the generic stripping further down gets to them — left
 * alone, those attributes read as bare quoted fragments with no connecting
 * words once a search result excerpts the surrounding sentence (see
 * docsSearch.ts's snippetFor), and a type like `() => void` has its own `>`,
 * which the generic tag-closer stripping below would otherwise eat.
 */
function reformatElements(source: string, tag: string, format: (attrs: ElementAttrs, body: string) => string): string {
	const openTag = new RegExp(`<${tag}(?![\\w-])((?:\\s+[\\w:@.-]+(?:=(?:"[^"]*"|'[^']*'))?)*)\\s*/?>(?:([\\s\\S]*?)</${tag}>)?`, 'g')
	const attrPair = /([\w:@.-]+)(?:=(?:"([^"]*)"|'([^']*)'))?/g

	return source.replace(openTag, (_match, attrList: string, body: string | undefined) => {
		const attrs: ElementAttrs = {}
		attrPair.lastIndex = 0
		let pair: RegExpExecArray | null
		while ((pair = attrPair.exec(attrList))) attrs[pair[1]!] = pair[2] ?? pair[3] ?? true
		return format(attrs, body ?? '')
	})
}

function attr(attrs: ElementAttrs, name: string): string {
	const value = attrs[name]
	return typeof value === 'string' ? value : ''
}

// A type that's already its own function signature — `(delta: number) =>
// void` — reads fine on its own; only a bare type name needs parenthesizing
// to read as one unit next to the param/property name it belongs to.
function formatType(type: string): string {
	if (!type) return ''
	return type.startsWith('(') ? ` ${type}` : ` (${type})`
}

// Placeholder pair standing in for a literal `<`/`>` that belongs to a
// param/return *type* (an arrow function, a `Foo<Bar>` generic) while it
// passes through the generic tag-stripping below, which would otherwise
// read either character as tag punctuation. Restored for real once that
// pass is done. Deliberately not applied to a block's body text: unlike an
// attribute value, body text may legitimately contain another nested tag
// (see e.g. random/color.vue's DocReturns, which wraps a live example in a
// <span>) that the generic pass still needs to strip normally.
const ANGLE_GT = 'ZZZ_ANGLE_GT_ZZZ'
const ANGLE_LT = 'ZZZ_ANGLE_LT_ZZZ'

function protectAngles(value: string): string {
	return value.replace(/>/g, ANGLE_GT).replace(/</g, ANGLE_LT)
}

function restoreAngles(text: string): string {
	return text.split(ANGLE_GT).join('>').split(ANGLE_LT).join('<')
}

const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

/**
 * Decodes the handful of HTML entities this hand-authored content actually
 * uses — content/ escapes `<`/`>`/etc. the same way any Vue template must
 * (see DocSnippet.vue's own doc comment on writing code literally in a
 * template). Left alone, an entity either shows up as its literal `&gt;`-
 * style text or — under the blank-to-a-space handling this replaces —
 * silently swallows a comparison/arrow-function operator: "min &gt; max"
 * used to read as "min  max", and an example's `=&gt;` as a bare `=`. An
 * unrecognized entity still blanks to a space, same as before.
 */
function decodeEntities(text: string): string {
	return text.replace(/&([a-z]+);|&#(x[0-9a-f]+|\d+);/gi, (_match, name?: string, code?: string) => {
		if (code) {
			const codePoint = code.toLowerCase().startsWith('x') ? Number.parseInt(code.slice(1), 16) : Number.parseInt(code, 10)
			return Number.isNaN(codePoint) ? ' ' : String.fromCodePoint(codePoint)
		}
		return NAMED_ENTITIES[name!.toLowerCase()] ?? ' '
	})
}

/**
 * Everything a reader would actually see on the page, as one string. Script
 * and style blocks go first (they're plumbing, and matching a page because
 * of its imports would be noise), then the doc blocks reformatted above,
 * then whatever's left goes through the generic pass: tag and attribute
 * *names* go while attribute *values* stay unquoted — the text of a param or
 * property lives in an attribute or a slot, and both need to be searchable.
 * `id` and a bound `:paths`/`:code` are the exceptions, dropped
 * name-and-value together: an `id` (DocSection/DocSnippet anchor slugs like
 * "content-1") is routing plumbing, never prose, and `:paths`/`:code`
 * (DocRelated/DocMixins' linked pages, DocSnippet's multi-language examples)
 * are JS array/object literals that read as noise once flattened, not
 * prose — left in, either surfaces as a stray fragment in a search result's
 * excerpt (see docsSearch.ts's snippetFor).
 */
function pageText(source: string): string {
	let text = source
		.replace(/<script[\s\S]*?<\/script>/gi, ' ')
		.replace(/<style[\s\S]*?<\/style>/gi, ' ')
		.replace(/<!--[\s\S]*?-->/g, ' ')

	text = reformatElements(text, 'DocParam', (attrs, body) => {
		const type = formatType(protectAngles(attr(attrs, 'type')))
		return ` ${attr(attrs, 'name')}${attrs.optional ? '?' : ''}${type}: ${body} `
	})
	text = reformatElements(text, 'DocProperty', (attrs, body) => {
		const type = formatType(protectAngles(attr(attrs, 'type')))
		return ` ${attr(attrs, 'name')}${type}: ${body} `
	})
	text = reformatElements(text, 'DocReturns', (attrs, body) => {
		const type = protectAngles(attr(attrs, 'type'))
		return ` ${type ? `${type} — ` : ''}${body} `
	})
	text = reformatElements(text, 'DocMethod', (attrs, body) => ` ${protectAngles(attr(attrs, 'signature'))}: ${body} `)

	text = text
		.replace(/\bid=(["'])[^"']*\1/g, ' ')
		.replace(/\s+:(?:paths|code)=(["'])(?:(?!\1)[\s\S])*\1/g, ' ')
		.replace(/<\/?[A-Za-z][\w.-]*/g, ' ')
		.replace(/[\w:@.-]+=(["'])((?:(?!\1)[\s\S])*)\1/g, ' $2 ')
		.replace(/\/?>/g, ' ')

	return decodeEntities(restoreAngles(text)).replace(/\s+/g, ' ').trim()
}

function titleFromSlug(slug: string): string {
	return slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

// Deliberately unvalidated: a page missing its `meta` still becomes a node
// (with a warning, see nodeTitle) rather than vanishing from the tree, which
// is a far easier thing to debug than a page that silently isn't there.
function readPage(key: string, pageModules: Record<string, DocPageModule>, pageSources: Record<string, string>): DocPageFile {
	const module = pageModules[key]!

	return {
		meta: module.meta ?? {},
		component: module.default,
		searchText: pageText(pageSources[key] ?? ''),
	}
}

function buildDirTree(pageModules: Record<string, DocPageModule>, pageSources: Record<string, string>): DocDir {
	const root = emptyDir()

	for (const key of Object.keys(pageModules)) {
		const page = readPage(key, pageModules, pageSources)

		const segments = key.slice(0, -'.vue'.length).split('/')
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

/**
 * Builds a docs tree from a glob's module/source maps — factored out of what
 * used to be one fixed module-level computation so docsVersions.ts can call
 * this again over a *historical* version's frozen `content/api/` copy. Keys
 * in both maps must already be prefix-stripped (`api/colors.vue`, not
 * `./content/api/colors.vue` or some versions/<v>/... path) — see
 * stripPrefix above for the live case, docsVersions.ts for the versioned one.
 */
export function buildDocsTree(pageModules: Record<string, DocPageModule>, pageSources: Record<string, string>): DocNode[] {
	return buildNodes(buildDirTree(pageModules, pageSources), '')
}

export const docsTree: DocNode[] = buildDocsTree(stripPrefix(pageModules, CONTENT_PREFIX), stripPrefix(pageSources, CONTENT_PREFIX))
