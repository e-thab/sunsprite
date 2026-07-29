import type { DocSection } from './docsContent'

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

function sectionMatchesSelf(section: DocSection, queryWords: string[]): boolean {
	const haystack = tokenize(`${section.title} ${section.content ?? ''}`)
	return queryWords.every((word) => wordMatches(word, haystack))
}

// Keeps a section if it (or any descendant) matches. A section that
// matches by its own title/content keeps its full subtree intact (the
// whole category was what was searched for); one that only qualifies via a
// matching descendant keeps just the matching descendants, so results stay
// focused.
function filterSection(section: DocSection, queryWords: string[]): DocSection | null {
	if (sectionMatchesSelf(section, queryWords)) return section

	const filteredChildren = section.children
		?.map((child) => filterSection(child, queryWords))
		.filter((child): child is DocSection => child !== null)

	if (filteredChildren && filteredChildren.length > 0) {
		return { ...section, children: filteredChildren }
	}
	return null
}

export function filterDocsSections(sections: DocSection[], query: string): DocSection[] {
	const queryWords = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
	if (queryWords.length === 0) return sections

	return sections
		.map((section) => filterSection(section, queryWords))
		.filter((section): section is DocSection => section !== null)
}
