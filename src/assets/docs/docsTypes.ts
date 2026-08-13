import type { DocWidgetName } from '@/components/docs/widgets'

export type DocRef = {
	path: string
	label?: string
}

/**
 * An escape hatch from the templated body layout: renders a registered widget
 * component (see `@/components/docs/widgets`) as its own section, so a page can
 * show something the structured `DocBody` shape can't express — the Colors
 * palette grid, for instance.
 */
export type DocWidgetSection = {
	/** Key into the widget registry. */
	widget: DocWidgetName
	/** Anchor suffix — the section's DOM id becomes `section-<id>`. Must be unique within a page. */
	id: string
	/** Section heading. Omit for a bare, heading-less block (then it's left out of the table of contents too). */
	title?: string
	/** Rendered above the templated content instead of below it. */
	placement?: 'top' | 'bottom'
	/** Bound onto the widget component. */
	props?: Record<string, unknown>
}

export type DocCategoryNode = {
	kind: 'category'
	slug: string
	title: string
	icon?: string
	summary: string
	intro?: string
	children: DocNode[]
}

export type DocEntryNode = {
	kind: 'entry'
	slug: string
	title: string
	icon?: string
	summary: string
	body: DocBody
}

export type DocNode = DocCategoryNode | DocEntryNode

export type ProseBody = {
	kind: 'prose'
	paragraphs: string[]
	widgets?: DocWidgetSection[]
	related?: DocRef[]
}

export type ApiMemberBody = {
	kind: 'api-member'
	memberKind: 'trait' | 'class' | 'function' | 'namespace' | 'property' | 'enum'
	signature?: string
	description: string
	params?: { name: string; type: string; description: string; optional?: boolean }[]
	returns?: { type: string; description: string }
	/** Own members only — members from a composed trait belong on that trait's own page, see `mixins`. */
	properties?: { name: string; type: string; description: string }[]
	/** Own members only — members from a composed trait belong on that trait's own page, see `mixins`. */
	methods?: { name: string; signature: string; description: string }[]
	mixins?: DocRef[]
	example?: string
	widgets?: DocWidgetSection[]
	related?: DocRef[]
}

export type DocBody = ProseBody | ApiMemberBody
