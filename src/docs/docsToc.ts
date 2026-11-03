import { inject, provide, shallowRef, type InjectionKey, type ShallowRef } from 'vue'

export type DocsTocSection = {
	/** DOM id of the section element this links to. */
	id: string
	label: string
	el: HTMLElement
}

export type DocsTocRegistry = {
	register: (section: DocsTocSection) => void
	unregister: (id: string) => void
}

export const docsTocKey: InjectionKey<DocsTocRegistry> = Symbol('docsToc')

/**
 * Collects the sections of whichever page is currently mounted, for DocsToc.
 *
 * Pages are free-form SFCs, so their sections aren't knowable from the node —
 * they only exist once the page renders, and each one (DocSection, and the
 * blocks built on it) registers itself here. Sorting by document position
 * rather than registration order is what keeps a nested or conditionally
 * rendered section listed where the reader actually sees it.
 */
export function provideDocsToc(): ShallowRef<DocsTocSection[]> {
	// Shallow: these hold real DOM elements, which have no business being
	// turned into reactive proxies.
	const sections = shallowRef<DocsTocSection[]>([])

	function inDocumentOrder(list: DocsTocSection[]): DocsTocSection[] {
		return [...list].sort((a, b) =>
			a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
		)
	}

	provide(docsTocKey, {
		register(section) {
			sections.value = inDocumentOrder([...sections.value.filter((s) => s.id !== section.id), section])
		},
		unregister(id) {
			sections.value = sections.value.filter((section) => section.id !== id)
		},
	})

	return sections
}

/** For section components. Null when nothing above is collecting — the docs panel has no TOC. */
export function useDocsToc(): DocsTocRegistry | null {
	return inject(docsTocKey, null)
}
