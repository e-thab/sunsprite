import type { DocCategoryNode, DocEntryNode } from '../../docsTypes'

// Template only — intentionally not drafted. Copy the shape of the example
// entry below for each real UI feature entry; add its slug to `children`.

const example: DocEntryNode = {
	kind: 'entry',
	slug: 'docs-panel',
	title: 'Docs Panel',
	icon: 'tabler:book-2',
	summary: 'TODO: one-line summary of this panel/feature.',
	body: {
		kind: 'prose',
		paragraphs: [
			'TODO: describe what this panel/feature is and where to find it in the UI.',
			'TODO: describe how to use it, including any non-obvious controls or shortcuts.',
		],
		// related: [{ path: 'api/classes/sprite' }],
	},
}

export const uiFeatures: DocCategoryNode = {
	kind: 'category',
	slug: 'ui',
	title: 'UI Features',
	icon: 'tabler:layout-dashboard',
	summary: 'The editor’s own panels and tools.',
	intro: 'Documentation for the editor’s own interface — panels, toolbars, and workflows — as distinct from the scripting API.',
	children: [example],
}
