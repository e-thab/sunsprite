import type { DocNode } from './docsTypes'
import { docsTree } from './docsContent'

export type DocIndexEntry = {
	node: DocNode
	path: string
	/** Ancestor titles joined with " / ", including this node's own title. */
	breadcrumbLabel: string
}

export const nodesByPath = new Map<string, DocNode>()

const parentPathOf = new Map<string, string | null>()
const breadcrumbLabelOf = new Map<string, string>()
export const searchEntries: DocIndexEntry[] = []

function walk(nodes: DocNode[], parentPath: string | null, parentLabel: string) {
	for (const node of nodes) {
		const path = parentPath ? `${parentPath}/${node.slug}` : node.slug
		const breadcrumbLabel = parentLabel ? `${parentLabel} / ${node.title}` : node.title

		nodesByPath.set(path, node)
		parentPathOf.set(path, parentPath)
		breadcrumbLabelOf.set(path, breadcrumbLabel)
		searchEntries.push({ node, path, breadcrumbLabel })

		if (node.kind === 'category') {
			walk(node.children, path, breadcrumbLabel)
		}
	}
}
walk(docsTree, null, '')

/** Ancestor chain for `path`, root-first, including `path` itself. Empty if `path` doesn't resolve. */
export function ancestorsOf(path: string): DocIndexEntry[] {
	const chain: DocIndexEntry[] = []
	let current: string | null = path

	while (current !== null) {
		const node = nodesByPath.get(current)
		if (!node) break

		chain.unshift({ node, path: current, breadcrumbLabel: breadcrumbLabelOf.get(current) ?? node.title })
		current = parentPathOf.get(current) ?? null
	}

	return chain
}
