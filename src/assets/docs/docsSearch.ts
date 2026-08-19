import type { DocNode } from './docsTypes'
import { searchEntries, type DocIndexEntry } from './docsIndex'

function levenshtein(a: string, b: string): number {
	const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) => {
		const row = new Array<number>(b.length + 1).fill(0)
		row[0] = i
		return row
	})
	for (let j = 0; j <= b.length; j++) dp[0]![j] = j

	for (let i = 1; i <= a.length; i++) {
		for (let j = 1; j <= b.length; j++) {
			dp[i]![j] = a[i - 1] === b[j - 1]
				? dp[i - 1]![j - 1]!
				: 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!)
		}
	}
	return dp[a.length]![b.length]!
}

function tokenize(text: string): string[] {
	return text.toLowerCase().split(/\W+/).filter(Boolean)
}

// A query word matches if it (or the haystack word) contains the other as a
// substring, or is a one-typo-away near miss — "reveals ... matching (or
// very similar) text" per the request, without pulling in a fuzzy-search
// dependency for what's still a small, hand-authored doc tree.
function wordMatches(queryWord: string, haystackWords: string[]): boolean {
	return haystackWords.some((word) => {
		if (word === queryWord) return true
		// Substring/fuzzy checks on short words (articles, prepositions —
		// "a", "on", "to") false-positive constantly, since e.g. "on" turns
		// up inside all sorts of unrelated words ("nonexistent"). Only worth
		// doing once both sides have enough length to mean something.
		if (word.length < 3 || queryWord.length < 3) return false
		if (word.includes(queryWord) || queryWord.includes(word)) return true
		return levenshtein(queryWord, word) <= 1
	})
}

// A page's own text comes from its SFC source (flattened at build time, see
// docsContent.ts) rather than from a structured body — pages are free-form
// markup now, so their prose, param descriptions and examples are only
// searchable through that.
function searchableText(node: DocNode): string {
	return `${node.title} ${node.summary} ${node.searchText}`
}

function nodeMatchesSelf(node: DocNode, queryWords: string[]): boolean {
	const haystack = tokenize(searchableText(node))
	return queryWords.every((word) => wordMatches(word, haystack))
}

// Keeps a node if it (or any descendant) matches. A node that matches by its
// own text keeps its full subtree intact (the whole category was what was
// searched for); one that only qualifies via a matching descendant keeps
// just the matching descendants, so results stay focused.
function filterNode(node: DocNode, queryWords: string[]): DocNode | null {
	if (nodeMatchesSelf(node, queryWords)) return node

	if (node.kind === 'category') {
		const filteredChildren = node.children
			.map((child) => filterNode(child, queryWords))
			.filter((child): child is DocNode => child !== null)

		if (filteredChildren.length > 0) return { ...node, children: filteredChildren }
	}
	return null
}

function queryWordsOf(query: string): string[] {
	return query.trim().toLowerCase().split(/\s+/).filter(Boolean)
}

/** Pruned-subtree filter for the in-panel/in-tree live search — unchanged UX from before. */
export function filterTree(nodes: DocNode[], query: string): DocNode[] {
	const queryWords = queryWordsOf(query)
	if (queryWords.length === 0) return nodes

	return nodes
		.map((node) => filterNode(node, queryWords))
		.filter((node): node is DocNode => node !== null)
}

/** Flat, ranked-by-tree-order results for the command palette and the /docs/search results page. */
export function searchDocs(query: string): DocIndexEntry[] {
	const queryWords = queryWordsOf(query)
	if (queryWords.length === 0) return []

	return searchEntries.filter((entry) => nodeMatchesSelf(entry.node, queryWords))
}
