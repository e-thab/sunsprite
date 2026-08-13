import type { InjectionKey, Ref } from 'vue'

/**
 * Shared contract consumed by every docs rendering component (tree, breadcrumb,
 * body, category landing). DocsPanel.vue provides an implementation backed by a
 * local ref; DocsView.vue provides one backed by the route — components using
 * this contract don't know or care which.
 */
export interface DocsNavigationContext {
	currentPath: Ref<string>
	/**
	 * `reveal: true` force-expands every ancestor of `path` (even ones the
	 * user explicitly collapsed) so the destination is visible in the tree —
	 * used for navigation that jumps somewhere via page content (a category
	 * landing card, a "Composed From"/related link) rather than the tree
	 * itself, where the user could not have already seen (or collapsed) the
	 * specific branch they're about to land in. Tree clicks and the
	 * breadcrumb don't need it: a tree click's target is already visible by
	 * definition, and breadcrumb navigation stays within the user's own
	 * explicit expand choices on purpose.
	 */
	navigate: (path: string, opts?: { reveal?: boolean }) => void
	/** Real /docs/... URL for a path, for right-click / open-in-new-tab / the "open full page" link. */
	resolveHref: (path: string) => string
	isExpanded: (path: string) => boolean
	toggleExpanded: (path: string) => void
}

export const docsNavigationKey: InjectionKey<DocsNavigationContext> = Symbol('docsNavigation')
