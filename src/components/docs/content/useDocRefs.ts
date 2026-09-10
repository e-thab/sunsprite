import { inject } from 'vue'
import type { DocRef } from '@/assets/docs/docsTypes'
import { docsNavigationKey } from '@/assets/docs/docsNavigation'
import { docsDataKey } from '@/assets/docs/docsData'

/**
 * Links from a page's body to another page. Titles and icons come from the
 * target's own `meta`, so a plain path is usually all a page needs to write:
 * `<DocRelated :paths="['api/traits/positionable']" />`.
 */
export function useDocRefs() {
	const nav = inject(docsNavigationKey)!
	const docsData = inject(docsDataKey)!

	function normalize(refs: (string | DocRef)[]): DocRef[] {
		return refs.map((ref) => (typeof ref === 'string' ? { path: ref } : ref))
	}

	function labelOf(ref: DocRef): string {
		return ref.label ?? docsData.value.nodesByPath.get(ref.path)?.title ?? ref.path
	}

	function iconOf(ref: DocRef): string | undefined {
		return docsData.value.nodesByPath.get(ref.path)?.icon
	}

	// Links resolve to a real /docs/... href so middle-click and open-in-new-tab
	// work, while a plain click is intercepted for in-place navigation (which,
	// in the docs panel, is the only kind that keeps you in the editor).
	function go(ref: DocRef) {
		nav.navigate(ref.path, { reveal: true })
	}

	return { nav, normalize, labelOf, iconOf, href: (ref: DocRef) => nav.resolveHref(ref.path), go }
}
