import { ref, watch, type Ref, type WatchSource } from 'vue'
import { DEV_VERSION } from '@/assets/api/versions/constants'
import type { DocPageModule } from './docsContent'
import { buildDocsTree, docsTree } from './docsContent'
import { buildDocsIndex, nodesByPath as liveNodesByPath, searchEntries as liveSearchEntries, ancestorsOf as liveAncestorsOf } from './docsIndex'
import type { DocsDataContext } from './docsData'
import type { DocNode } from './docsTypes'

/** The live tree's already-built index, reused rather than rebuilt on every dev-version resolution. */
function liveDocsData(): DocsDataContext {
	return { tree: docsTree, nodesByPath: liveNodesByPath, searchEntries: liveSearchEntries, ancestorsOf: liveAncestorsOf }
}

// Sandbox-side runtime versioning (src/assets/api/versions/runtime.ts) keeps
// every versioned core.ts copy out of the main host bundle via a lazy glob;
// this is the same idea for docs, which render in the *host* app instead —
// so it's its own lazy glob here, not eager, and not the sandbox's problem at
// all. Only content/api/** is ever frozen per version (see
// docs/plans/api-versioning.md) — concepts/tutorials/ui stay live, merged in
// below regardless of which version is active.
const versionedPageModules = import.meta.glob<DocPageModule>('../api/versions/*/src/assets/docs/content/api/**/*.vue')
const versionedPageSources = import.meta.glob<string>('../api/versions/*/src/assets/docs/content/api/**/*.vue', {
	query: '?raw',
	import: 'default',
})

const VERSIONED_KEY_RE = /^\.\.\/api\/versions\/([^/]+)\/src\/assets\/docs\/content\/api\/(.+)$/

type VersionEntry<T> = { relativeKey: string; loader: () => Promise<T> }

function groupByVersion<T>(glob: Record<string, () => Promise<T>>): Map<string, VersionEntry<T>[]> {
	const byVersion = new Map<string, VersionEntry<T>[]>()

	for (const [key, loader] of Object.entries(glob)) {
		const match = key.match(VERSIONED_KEY_RE)
		if (!match) continue

		const version = match[1]!
		const relativeKey = match[2]!
		if (!byVersion.has(version)) byVersion.set(version, [])
		byVersion.get(version)!.push({ relativeKey, loader })
	}

	return byVersion
}

const moduleEntriesByVersion = groupByVersion(versionedPageModules)
const sourceEntriesByVersion = groupByVersion(versionedPageSources)

function buildDocsData(tree: DocNode[]): DocsDataContext {
	return { tree, ...buildDocsIndex(tree) }
}

async function loadEntries<T>(entries: VersionEntry<T>[]): Promise<Record<string, T>> {
	const result: Record<string, T> = {}
	await Promise.all(entries.map(async ({ relativeKey, loader }) => {
		// Re-prefixed with "api/" so the resulting keys match the shape
		// buildDocsTree expects (and the live tree's own api/** nodes already
		// have) — content/api/colors.vue's live node path is "api/colors";
		// a versioned copy needs to resolve to that same path so cross-page
		// links (DocRelated/DocMixins, resolved by path string) still work.
		result[`api/${relativeKey}`] = await loader()
	}))
	return result
}

async function loadVersionedApiNode(version: string): Promise<DocNode | undefined> {
	const pageModules = await loadEntries(moduleEntriesByVersion.get(version) ?? [])
	const pageSources = await loadEntries(sourceEntriesByVersion.get(version) ?? [])
	return buildDocsTree(pageModules, pageSources)[0]
}

const cache = new Map<string, Promise<DocsDataContext>>()

/**
 * Resolves the full docs bundle (tree + index) for whichever API version is
 * active. DEV_VERSION returns the live tree with no glob lookup at all —
 * mirrors loadVersionedApiLib's own dev special-case. A real version's
 * frozen api/** subtree (a single category node, since content/api/ is one
 * folder) replaces the live tree's own "api" node in place — everything else
 * (concepts/tutorials/ui) comes from the live tree unchanged, per the scope
 * decision recorded in docs/plans/api-versioning.md. Memoized per version so
 * switching back to an already-loaded one is instant.
 */
export function loadVersionedDocsData(version: string): Promise<DocsDataContext> {
	if (version === DEV_VERSION) return Promise.resolve(liveDocsData())

	let cached = cache.get(version)
	if (!cached) {
		cached = loadVersionedApiNode(version).then((apiNode) => {
			// No frozen api/ files for this version — shouldn't happen for a
			// real cut version (docs are always cut alongside the runtime),
			// but stays defensive rather than throwing: falls back to the
			// live api node so the merge still has something to show.
			const resolvedApiNode = apiNode ?? docsTree.find((node) => node.slug === 'api')
			const mergedTree = docsTree
				.map((node) => (node.slug === 'api' ? resolvedApiNode : node))
				.filter((node): node is DocNode => node !== undefined)
			return buildDocsData(mergedTree)
		})
		cache.set(version, cached)
	}
	return cached
}

/**
 * Reactive wrapper around loadVersionedDocsData, for DocsPanel.vue/DocsView.vue
 * to provide(docsDataKey, ...) directly. `version` takes the same shape
 * Vue's own watch() accepts — a ref or a getter — so DocsPanel.vue can pass
 * `() => apiVersionStore.selectedVersion` and DocsView.vue can pass its own
 * local ref directly. Seeded synchronously to the live data (always
 * instantly available, unlike a real version's glob-backed load) so there's
 * no flash of empty content on mount — the watcher then takes over for every
 * subsequent change, `version`'s initial one included.
 */
export function useDocsData(version: WatchSource<string>): Ref<DocsDataContext> {
	const data = ref<DocsDataContext>(liveDocsData()) as Ref<DocsDataContext>

	watch(version, async (v) => {
		data.value = await loadVersionedDocsData(v)
	}, { immediate: true })

	return data
}
