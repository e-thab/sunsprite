export type DocRef = {
	path: string
	label?: string
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
	related?: DocRef[]
}

export type DocBody = ProseBody | ApiMemberBody
