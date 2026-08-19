import { inject } from 'vue'
import type { DocRef } from '@/assets/docs/docsTypes'
import { nodesByPath } from '@/assets/docs/docsIndex'
import { docsNavigationKey } from '@/assets/docs/docsNavigation'

/**
 * Links from a page's body to another page. Titles and icons come from the
 * target's own `meta`, so a plain path is usually all a page needs to write:
 * `<DocRelated :paths="['api/traits/positionable']" />`.
 */
export function useDocRefs() {
	const nav = inject(docsNavigationKey)!

	function normalize(refs: (string | DocRef)[]): DocRef[] {
		return refs.map((ref) => (typeof ref === 'string' ? { path: ref } : ref))
	}

	function labelOf(ref: DocRef): string {
		return ref.label ?? nodesByPath.get(ref.path)?.title ?? ref.path
	}

	function iconOf(ref: DocRef): string | undefined {
		return nodesByPath.get(ref.path)?.icon
	}

	// Links resolve to a real /docs/... href so middle-click and open-in-new-tab
	// work, while a plain click is intercepted for in-place navigation (which,
	// in the docs panel, is the only kind that keeps you in the editor).
	function go(ref: DocRef) {
		nav.navigate(ref.path, { reveal: true })
	}

	return { nav, normalize, labelOf, iconOf, href: (ref: DocRef) => nav.resolveHref(ref.path), go }
}
