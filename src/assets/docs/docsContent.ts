export interface DocSection {
	id: string
	title: string
	content?: string
	children?: DocSection[]
}

// TODO: populate with real documentation, tutorials, and tips. Structure
// mirrors the actual Sunsprite API (see src/assets/api/apiLib.ts) so the
// categories below aren't placeholders themselves — only their body text is.
export const docsSections: DocSection[] = [
	{
		id: 'getting-started',
		title: 'Getting Started',
		content: 'A quick tour of the editor, the file tree, and running your first script.',
	},
	{
		id: 'api',
		title: 'Sunsprite API',
		children: [
			{
				id: 'api-classes',
				title: 'Classes',
				children: [
					{ id: 'class-sprite', title: 'Sprite', content: 'An image-based game object.' },
					{ id: 'class-rectangle', title: 'Rectangle', content: 'A filled rectangle shape.' },
					{ id: 'class-circle', title: 'Circle', content: 'A filled circle shape.' },
					{ id: 'class-line', title: 'Line', content: 'A straight line between two points.' },
					{ id: 'class-vline', title: 'VLine', content: 'An infinitely long vertical line.' },
					{ id: 'class-hline', title: 'HLine', content: 'An infinitely long horizontal line.' },
					{ id: 'class-label', title: 'Label', content: 'An object that displays text.' },
				],
			},
			{
				id: 'api-functions',
				title: 'Functions',
				children: [
					{ id: 'fn-forever', title: 'forever()', content: 'Runs a function every frame — the primary game loop.' },
					{ id: 'fn-repeat', title: 'repeat()', content: 'Runs a function a set number of times, once per frame.' },
					{ id: 'fn-repeatUntil', title: 'repeatUntil()', content: 'Runs a function every frame until a condition becomes true.' },
					{ id: 'fn-after', title: 'after()', content: 'Runs a function once, after a delay in seconds.' },
					{ id: 'fn-every', title: 'every()', content: 'Runs a function repeatedly at a fixed time interval.' },
					{ id: 'fn-keyPressed', title: 'keyPressed() / onKeyPress()', content: 'Check or react to keyboard input.' },
					{ id: 'fn-onMouse', title: 'onMouse()', content: 'Register functions for mouse/click events.' },
					{ id: 'fn-print', title: 'print() / warn()', content: 'Display messages in the output panel.' },
					{ id: 'fn-random', title: 'random', content: 'Helpers for random numbers, colors, and choices.' },
				],
			},
		],
	},
	{
		id: 'tutorials',
		title: 'Tutorials',
		children: [
			{ id: 'tut-keyboard', title: 'Keyboard Input', content: 'Moving objects and triggering actions with the keyboard.' },
			{ id: 'tut-labels', title: 'Using Labels to Display Text', content: 'Showing a score, timer, or message on screen.' },
			{ id: 'tut-drag', title: 'Drag and Drop', content: 'Making objects draggable with the mouse.' },
			{ id: 'tut-sounds', title: 'Playing Sounds', content: 'Adding sound effects and music to a game.' },
			{ id: 'tut-collisions', title: 'Detecting Collisions', content: 'Using touching() to check when objects overlap.' },
		],
	},
	{
		id: 'challenges',
		title: 'Challenges',
		content: 'Small project ideas to practice what you’ve learned.',
	},
	{
		id: 'tips',
		title: 'Tips',
		content: 'Shortcuts and patterns for getting the most out of the editor.',
	},
]
