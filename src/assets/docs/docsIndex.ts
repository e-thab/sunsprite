import type { DocNode } from './docsTypes'
import { docsTree } from './docsContent'

export type DocIndexEntry = {
	node: DocNode
	path: string
	/** Ancestor titles joined with " / ", including this node's own title. */
	breadcrumbLabel: string
}

export const nodesByPath = new Map<string, DocNode>()

const breadcrumbLabelOf = new Map<string, string>()
export const searchEntries: DocIndexEntry[] = []

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
walk(docsTree, '')

/** Ancestor chain for `path`, root-first, including `path` itself. Empty if `path` doesn't resolve. */
export function ancestorsOf(path: string): DocIndexEntry[] {
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
