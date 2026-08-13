import type { DocEntryNode } from '../docsTypes'

export const challenges: DocEntryNode = {
	kind: 'entry',
	slug: 'challenges',
	title: 'Challenges',
	icon: 'tabler:target-arrow',
	summary: 'Small project ideas to practice what you’ve learned.',
	body: {
		kind: 'prose',
		paragraphs: [
			'Small project ideas to practice what you’ve learned.',
		],
	},
}
