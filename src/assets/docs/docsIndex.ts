import type { DocNode } from './docsTypes'
import { docsTree } from './docsContent'

export type DocIndexEntry = {
	node: DocNode
	path: string
	breadcrumbLabel: string
}

export type DocsIndex = {
	nodesByPath: Map<string, DocNode>
	searchEntries: DocIndexEntry[]
	/** Ancestor chain for `path`, root-first, including `path` itself. Empty if `path` doesn't resolve. */
	ancestorsOf: (path: string) => DocIndexEntry[]
}

/**
 * Derives the lookup structures a docs tree needs at render time — factored
 * out of what used to be one fixed module-level computation so
 * docsVersions.ts can build the identical shape for a historical version's
 * tree, not just the live one. Cheap: one O(n) walk over however many nodes
 * the tree has (~80 for the live tree today).
 */
export function buildDocsIndex(tree: DocNode[]): DocsIndex {
	const nodesByPath = new Map<string, DocNode>()
	const breadcrumbLabelOf = new Map<string, string>()
	const searchEntries: DocIndexEntry[] = []

	function walk(nodes: DocNode[], parentLabel: string) {
		for (const node of nodes) {
			const breadcrumbLabel = parentLabel ? `${parentLabel} / ${node.title}` : node.title

			nodesByPath.set(node.path, node)
			breadcrumbLabelOf.set(node.path, breadcrumbLabel)
			searchEntries.push({ node, path: node.path, breadcrumbLabel })

			if (node.kind === 'category') {
				walk(node.children, breadcrumbLabel)
			}
		}
	}
	walk(tree, '')

	function ancestorsOf(path: string): DocIndexEntry[] {
		if (!nodesByPath.has(path)) return []

		const segments = path.split('/')
		const chain: DocIndexEntry[] = []

		for (let depth = 1; depth <= segments.length; depth++) {
			const ancestorPath = segments.slice(0, depth).join('/')
			const node = nodesByPath.get(ancestorPath)
			if (!node) break

			chain.push({ node, path: ancestorPath, breadcrumbLabel: breadcrumbLabelOf.get(ancestorPath) ?? node.title })
		}

		return chain
	}

	return { nodesByPath, searchEntries, ancestorsOf }
}

const liveIndex = buildDocsIndex(docsTree)

export const nodesByPath = liveIndex.nodesByPath
export const searchEntries = liveIndex.searchEntries
export const ancestorsOf = liveIndex.ancestorsOf
