import { computed, inject, type ComputedRef } from 'vue'
import type { DocRef } from '@/docs/docsTypes'
import { docsNavigationKey } from '@/docs/docsNavigation'
import { docsDataKey, type DocDefaults } from '@/docs/docsData'

/** One run of a Default cell: code (`` `0` ``) or the plain text around it. */
export type DefaultSegment = { text: string; code: boolean }

/**
 * Generated defaults are keyed by class or trait name (Sprite, GameObject,
 * HLine); pages by slug (sprite, game-object, hline). They're the same name
 * once dashes and case are dropped, so that's the key both are looked up by —
 * a page needs nothing in its `meta` to say what it documents.
 */
function subjectKey(name: string): string {
	return name.replace(/-/g, '').toLowerCase()
}

function subjectOf(path: string): string {
	return subjectKey(path.slice(path.lastIndexOf('/') + 1))
}

// Re-keyed once per version's defaults, not once per row.
const bySubjectCache = new WeakMap<DocDefaults, Map<string, Record<string, string>>>()

function bySubject(defaults: DocDefaults): Map<string, Record<string, string>> {
	let map = bySubjectCache.get(defaults)
	if (!map) {
		map = new Map(Object.entries(defaults).map(([name, props]) => [subjectKey(name), props]))
		bySubjectCache.set(defaults, map)
	}
	return map
}

/** Splits `@default` text on its backticks: every other run is code. */
function parseSegments(text: string): DefaultSegment[] {
	return text
		.split('`')
		.map((run, i) => ({ text: run, code: i % 2 === 1 }))
		.filter((segment) => segment.text !== '')
}

/**
 * What a DocProperty's Default cell shows. A `default` the page writes itself
 * wins, and means a code literal, exactly as it always has — the pages frozen
 * into a version before `@default` tags existed are written that way. Failing
 * that, the generated `@default` for the page's own subject, which for a class
 * already folds in what it inherits; then, for a row inherited on a page with
 * no entry of its own (the GameObject trait page), the trait it came `from`.
 */
export function useDocDefault(name: string, written: string | undefined, from: string | DocRef | undefined): ComputedRef<DefaultSegment[] | undefined> {
	const nav = inject(docsNavigationKey)!
	const docsData = inject(docsDataKey)!

	return computed(() => {
		if (written !== undefined) return [{ text: written, code: true }]

		const defaults = bySubject(docsData.value.defaults)
		const fromPath = typeof from === 'string' ? from : from?.path
		const text = defaults.get(subjectOf(nav.currentPath.value))?.[name] ?? (fromPath ? defaults.get(subjectOf(fromPath))?.[name] : undefined)
		return text === undefined ? undefined : parseSegments(text)
	})
}
