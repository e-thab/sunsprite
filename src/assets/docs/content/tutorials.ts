import type { DocCategoryNode, DocEntryNode } from '../docsTypes'

function tutorial(slug: string, title: string, text: string): DocEntryNode {
	return {
		kind: 'entry',
		slug,
		title,
		icon: 'tabler:book-2',
		summary: text,
		body: { kind: 'prose', paragraphs: [text] },
	}
}

export const tutorials: DocCategoryNode = {
	kind: 'category',
	slug: 'tutorials',
	title: 'Tutorials',
	icon: 'tabler:school',
	summary: 'Guided walkthroughs for common game-building tasks.',
	intro: 'Guided walkthroughs for common game-building tasks, from moving things with the keyboard to detecting collisions.',
	children: [
		tutorial('keyboard-input', 'Keyboard Input', 'Moving objects and triggering actions with the keyboard.'),
		tutorial('labels', 'Using Labels to Display Text', 'Showing a score, timer, or message on screen.'),
		tutorial('drag-and-drop', 'Drag and Drop', 'Making objects draggable with the mouse.'),
		tutorial('playing-sounds', 'Playing Sounds', 'Adding sound effects and music to a game.'),
		tutorial('detecting-collisions', 'Detecting Collisions', 'Using touching() to check when objects overlap.'),
	],
}
