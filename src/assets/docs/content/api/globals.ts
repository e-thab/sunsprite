import type { DocCategoryNode, DocEntryNode } from '../../docsTypes'

function fn(entry: Omit<DocEntryNode, 'kind'>): DocEntryNode {
	return { kind: 'entry', ...entry }
}

const mouse = fn({
	slug: 'mouse',
	title: 'Mouse',
	icon: 'tabler:mouse',
	summary: "The user's mouse reference.",
	body: {
		kind: 'api-member',
		memberKind: 'namespace',
		description: "A live reference to the user's mouse — cursor position and which buttons are currently held.",
		properties: [
			{ name: 'x', type: 'number', description: "Horizontal position of the user's cursor." },
			{ name: 'y', type: 'number', description: "Vertical position of the user's cursor." },
			{ name: 'position', type: 'Point', description: "Position of the user's cursor as a Point." },
			{ name: 'pos', type: 'Point', description: "Position of the user's cursor as a Point. Alias of position." },
			{ name: 'leftButtonDown', type: 'boolean', description: 'Whether the left mouse button is currently held down.' },
			{ name: 'rightButtonDown', type: 'boolean', description: 'Whether the right mouse button is currently held down.' },
			{ name: 'middleButtonDown', type: 'boolean', description: 'Whether the middle mouse button is currently held down.' },
			{ name: 'anyButtonDown', type: 'boolean', description: 'Whether any mouse button is currently held down.' },
		],
		related: [{ path: 'api/functions/input/on-mouse' }, { path: 'api/traits/interactable' }],
	},
})

const screen = fn({
	slug: 'screen',
	title: 'Screen',
	icon: 'tabler:device-desktop',
	summary: 'The game screen reference.',
	body: {
		kind: 'api-member',
		memberKind: 'namespace',
		description: 'A live reference to the game screen’s current size and edges.',
		properties: [
			{ name: 'width', type: 'number', description: 'Current width of the game screen.' },
			{ name: 'height', type: 'number', description: 'Current height of the game screen.' },
			{ name: 'top', type: 'number', description: 'Y coordinate of the top edge of the screen.' },
			{ name: 'bottom', type: 'number', description: 'Y coordinate of the bottom edge of the screen.' },
			{ name: 'left', type: 'number', description: 'X coordinate of the left edge of the screen.' },
			{ name: 'right', type: 'number', description: 'X coordinate of the right edge of the screen.' },
			{ name: 'center', type: 'Point', description: 'Point at the center of the screen.' },
		],
	},
})

const clock = fn({
	slug: 'clock',
	title: 'Clock',
	icon: 'tabler:clock',
	summary: 'A live reference to elapsed game time.',
	body: {
		kind: 'api-member',
		memberKind: 'namespace',
		description: 'A live reference to elapsed time and frame count since the game started.',
		properties: [
			{ name: 'time', type: 'number', description: 'Time since start, does not increment during pause.' },
			{ name: 'totalTime', type: 'number', description: 'Time since start, including pause time.' },
			{ name: 'delta', type: 'number', description: 'Normalized time since last frame. At 60 FPS, this is around 1.0.' },
			{ name: 'deltaMs', type: 'number', description: 'Time since last frame in milliseconds.' },
			{ name: 'frame', type: 'number', description: 'Frames since game start, does not increment during pause.' },
		],
		related: [{ path: 'api/functions/game-loop/forever' }],
	},
})

const keysPressed = fn({
	slug: 'keys-pressed',
	title: 'keysPressed',
	icon: 'tabler:keyboard',
	summary: 'An array of all keys currently pressed.',
	body: {
		kind: 'api-member',
		memberKind: 'property',
		signature: 'const keysPressed: string[]',
		description: 'An array of all keys currently pressed.',
		related: [{ path: 'api/functions/input/key-pressed' }],
	},
})

export const globals: DocCategoryNode = {
	kind: 'category',
	slug: 'globals',
	title: 'Globals',
	icon: 'tabler:world',
	summary: 'Live references available everywhere: Mouse, Screen, Clock, keysPressed.',
	intro: 'A handful of always-available globals that reflect live engine state, rather than functions you call.',
	children: [mouse, screen, clock, keysPressed],
}
