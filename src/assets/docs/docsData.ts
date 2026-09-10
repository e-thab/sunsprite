import type { InjectionKey, Ref } from 'vue'
import type { DocNode } from './docsTypes'
import type { DocIndexEntry } from './docsIndex'

/**
 * The resolved docs content for whichever API version is currently active —
 * a sibling contract to docsNavigation.ts's DocsNavigationContext, kept
 * deliberately separate from it: navigation state (current path, which
 * categories are expanded) is orthogonal to which version's *data* backs it,
 * so switching versions shouldn't reset what the user has expanded, and
 * expanding a category shouldn't care which version it's browsing.
 *
 * DocsPanel.vue (keyed off apiVersionStore.selectedVersion) and DocsView.vue
 * (its own local selector) each resolve this via docsVersions.ts's
 * loadVersionedDocsData and `provide` it; DocsTree.vue, DocsBreadcrumb.vue,
 * and useDocRefs.ts `inject` it instead of importing docsIndex.ts's old
 * module-level singletons directly.
 */
export type DocsDataContext = {
	tree: DocNode[]
	nodesByPath: Map<string, DocNode>
	searchEntries: DocIndexEntry[]
	ancestorsOf: (path: string) => DocIndexEntry[]
}

// A Ref, not the bundle directly: the whole point is that this changes over
// time (a version switch swaps every field at once) — see docsVersions.ts's
// useDocsData, which is what DocsPanel.vue/DocsView.vue actually provide.
export const docsDataKey: InjectionKey<Ref<DocsDataContext>> = Symbol('docsData')
