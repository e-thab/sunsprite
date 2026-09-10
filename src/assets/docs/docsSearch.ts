import type { DocNode } from './docsTypes'
import type { DocIndexEntry } from './docsIndex'

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

// Two words "match" if one contains the other as a substring, or is a
// one-typo-away near miss — "reveals ... matching (or very similar) text"
// per the request, without pulling in a fuzzy-search dependency for what's
// still a small, hand-authored doc tree.
function wordsMatch(a: string, b: string): boolean {
	if (a === b) return true
	// Substring/fuzzy checks on short words (articles, prepositions — "a",
	// "on", "to") false-positive constantly, since e.g. "on" turns up inside
	// all sorts of unrelated words ("nonexistent"). Only worth doing once
	// both sides have enough length to mean something.
	if (a.length < 3 || b.length < 3) return false
	if (a.includes(b) || b.includes(a)) return true
	return levenshtein(a, b) <= 1
}

function wordMatches(queryWord: string, haystackWords: string[]): boolean {
	return haystackWords.some((word) => wordsMatch(queryWord, word))
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

function queryWordsOf(query: string): string[] {
	return query.trim().toLowerCase().split(/\s+/).filter(Boolean)
}

// --- Result snippets ---------------------------------------------------
// A short, sentence-scale excerpt of a page's own text that actually
// contains the match, shown alongside each result so it's clear *why* a
// page matched — not just that it did. Functional reference: Vue's own docs
// search (https://vuejs.org/guide/introduction.html), which highlights the
// matching words within a snippet of the surrounding prose.

export type SnippetPart = { text: string; matched: boolean }

type Token = { word: string; start: number; end: number }

/** Every run of word characters in `text`, lowercased, with its character offsets. */
function tokensOf(text: string): Token[] {
	const tokens: Token[] = []
	const re = /[\p{L}\p{N}']+/gu
	let match: RegExpExecArray | null
	while ((match = re.exec(text))) {
		tokens.push({ word: match[0].toLowerCase(), start: match.index, end: match.index + match[0].length })
	}
	return tokens
}

type Sentence = { text: string; start: number }

/**
 * Splits flattened page text into sentence-scale chunks on `.`/`!`/`?`. The
 * text arrives already flattened out of SFC markup (see docsContent.ts's
 * pageText) with tags and extra whitespace stripped, so this is just
 * punctuation-splitting, not real sentence grammar — good enough for
 * hand-authored docs prose, which is all this ever runs over.
 */
function splitSentences(text: string): Sentence[] {
	const breaks = [0]
	const re = /[.!?]+(?=\s|$)/g
	let match: RegExpExecArray | null
	while ((match = re.exec(text))) breaks.push(match.index + match[0].length)
	if (breaks[breaks.length - 1] !== text.length) breaks.push(text.length)

	const sentences: Sentence[] = []
	for (let i = 0; i < breaks.length - 1; i++) {
		const raw = text.slice(breaks[i]!, breaks[i + 1]!)
		const start = breaks[i]! + (raw.length - raw.trimStart().length)
		const trimmed = raw.trim()
		if (trimmed) sentences.push({ text: trimmed, start })
	}
	return sentences
}

/** Longest a snippet is shown at full length before it gets trimmed to a window around the match. */
const SNIPPET_MAX_LENGTH = 180
/**
 * Small, fixed lead-in kept before the first match once a sentence needs
 * trimming. Deliberately modest: the trailing side (built below) grows to
 * fill whatever's left of the length budget, so a too-long sentence loses
 * its lead-in first rather than crowding — or, worse, leaving no room to
 * show — the match itself and what comes right after it.
 */
const LEADING_CONTEXT_WORDS = 4

/** Every token that matches one of `queryWords`, plus how many distinct query words were covered. */
function matchTokens(tokens: Token[], queryWords: string[]): { matched: Token[]; distinctWords: number } {
	const matched: Token[] = []
	const covered = new Set<string>()
	for (const token of tokens) {
		const hit = queryWords.find((word) => wordsMatch(word, token.word))
		if (hit) {
			matched.push(token)
			covered.add(hit)
		}
	}
	return { matched, distinctWords: covered.size }
}

/**
 * Trims `sentence` down to a window around its match(es), when it's too long
 * to show whole — asymmetrically: a small fixed lead-in, then the trailing
 * side grows to fill the rest of the length budget, and only once trailing
 * has taken all it can (it runs out of sentence before it runs out of
 * budget) does leading grow past its fixed minimum. This is what keeps a
 * highlighted match from reading as truncated — it's never the side a
 * reader's eye is moving toward that gets cut short — and, since the window
 * spans every matched token (not just the first), a second match well past
 * the first one is still included rather than silently dropped.
 */
function windowAroundMatch(sentence: string, allTokens: Token[], matched: Token[]): { text: string; matched: Token[] } {
	if (sentence.length <= SNIPPET_MAX_LENGTH) return { text: sentence, matched }

	const matchedIndices = matched.map((token) => allTokens.indexOf(token)).sort((a, b) => a - b)
	const firstIdx = matchedIndices[0]!
	let to = matchedIndices[matchedIndices.length - 1]!
	let from = Math.max(0, firstIdx - LEADING_CONTEXT_WORDS)

	while (to < allTokens.length - 1 && allTokens[to + 1]!.end - allTokens[from]!.start <= SNIPPET_MAX_LENGTH) to++
	while (from > 0 && allTokens[to]!.end - allTokens[from - 1]!.start <= SNIPPET_MAX_LENGTH) from--

	// Extend all the way to the sentence's real edge once the window already
	// reaches its first/last *word* — otherwise trailing punctuation with no
	// more words after it (a closing "})" and nothing else) gets silently
	// dropped and wrongly earns an ellipsis it doesn't need.
	const windowStart = from === 0 ? 0 : allTokens[from]!.start
	const windowEnd = to === allTokens.length - 1 ? sentence.length : allTokens[to]!.end

	const prefix = windowStart > 0 ? '… ' : ''
	const suffix = windowEnd < sentence.length ? ' …' : ''

	return {
		text: prefix + sentence.slice(windowStart, windowEnd) + suffix,
		matched: matched
			.filter((token) => token.start >= windowStart && token.end <= windowEnd)
			.map((token) => ({ word: token.word, start: token.start - windowStart + prefix.length, end: token.end - windowStart + prefix.length })),
	}
}

/** Reassembles `text` into alternating plain/matched pieces, ready to render (e.g. plain text and `<mark>`). */
function toParts(text: string, matched: Token[]): SnippetPart[] {
	const parts: SnippetPart[] = []
	let cursor = 0
	for (const token of [...matched].sort((a, b) => a.start - b.start)) {
		if (token.start < cursor) continue
		if (token.start > cursor) parts.push({ text: text.slice(cursor, token.start), matched: false })
		parts.push({ text: text.slice(token.start, token.end), matched: true })
		cursor = token.end
	}
	if (cursor < text.length) parts.push({ text: text.slice(cursor, text.length), matched: false })
	return parts
}

/**
 * The best sentence-scale excerpt of `node`'s own text (summary + body) that
 * contains the query, split into plain/matched parts for highlighting.
 * Null when the query only matched the node's title — there's then no
 * excerpt of its own prose to show, and the caller falls back to the
 * summary as-is.
 */
export function snippetFor(node: DocNode, query: string): SnippetPart[] | null {
	const queryWords = queryWordsOf(query)
	if (queryWords.length === 0) return null

	const text = [node.summary, node.searchText].filter(Boolean).join(' ')
	if (!text) return null

	let best: { sentence: Sentence; tokens: Token[]; matched: Token[]; distinctWords: number } | null = null

	for (const sentence of splitSentences(text)) {
		const tokens = tokensOf(sentence.text)
		const { matched, distinctWords } = matchTokens(tokens, queryWords)
		if (distinctWords === 0) continue
		if (!best || distinctWords > best.distinctWords) best = { sentence, tokens, matched, distinctWords }
		if (best.distinctWords === queryWords.length) break
	}
	if (!best) return null

	const windowed = windowAroundMatch(best.sentence.text, best.tokens, best.matched)
	return toParts(windowed.text, windowed.matched)
}

export type DocSearchResult = DocIndexEntry & {
	/** Sentence-scale excerpt containing the match, or null to fall back to the node's summary — see snippetFor. */
	snippet: SnippetPart[] | null
}

/**
 * Flat, ranked-by-tree-order results for the command palette, the
 * /docs/search results page, and the panel's own search. `entries` is
 * whichever version's index is currently active (see docsVersions.ts) — this
 * used to read a fixed module-level `searchEntries` singleton; now the caller
 * decides which tree it's searching.
 */
export function searchDocs(query: string, entries: DocIndexEntry[]): DocSearchResult[] {
	const queryWords = queryWordsOf(query)
	if (queryWords.length === 0) return []

	return entries
		.filter((entry) => nodeMatchesSelf(entry.node, queryWords))
		.map((entry) => ({ ...entry, snippet: snippetFor(entry.node, query) }))
}
