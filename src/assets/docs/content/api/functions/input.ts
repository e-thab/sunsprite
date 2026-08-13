import type { DocCategoryNode, DocEntryNode } from '../../../docsTypes'

function fn(entry: Omit<DocEntryNode, 'kind'>): DocEntryNode {
	return { kind: 'entry', ...entry }
}

const keyPressed = fn({
	slug: 'key-pressed',
	title: 'keyPressed()',
	icon: 'tabler:keyboard',
	summary: 'Whether a key is currently held down.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'keyPressed(key: string): boolean',
		description: 'Returns true if the specified key is currently pressed. Will repeatedly be true while the key is held.',
		params: [{ name: 'key', type: 'string', description: 'The key to check.' }],
		returns: { type: 'boolean', description: 'Whether the key is currently held down.' },
		related: [{ path: 'api/functions/input/key-just-pressed' }, { path: 'api/functions/input/on-key-hold' }],
	},
})

const keyJustPressed = fn({
	slug: 'key-just-pressed',
	title: 'keyJustPressed()',
	icon: 'tabler:keyboard',
	summary: 'True for one frame when a key starts being held.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'keyJustPressed(key: string): boolean',
		description: 'Returns true if the specified key is pressed, and this is the first frame that it’s being held. Only true once when a key starts being held.',
		params: [{ name: 'key', type: 'string', description: 'The key to check.' }],
		returns: { type: 'boolean', description: 'Whether this is the first frame the key is held down.' },
		related: [{ path: 'api/functions/input/key-pressed' }, { path: 'api/functions/input/key-just-released' }],
	},
})

const keyJustReleased = fn({
	slug: 'key-just-released',
	title: 'keyJustReleased()',
	icon: 'tabler:keyboard',
	summary: 'True for one frame right after a key is released.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'keyJustReleased(key: string): boolean',
		description: 'Returns true if the specified key is no longer pressed, and this is the first frame after release. Only true once when a key stops being held.',
		params: [{ name: 'key', type: 'string', description: 'The key to check.' }],
		returns: { type: 'boolean', description: 'Whether this is the first frame after the key was released.' },
		related: [{ path: 'api/functions/input/key-just-pressed' }],
	},
})

const onKeyPress = fn({
	slug: 'on-key-press',
	title: 'onKeyPress()',
	icon: 'tabler:keyboard',
	summary: 'Register functions to run when keys are first pressed.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'onKeyPress(actions: KeyAction): void',
		description: 'Register input actions to run once each time a key is pressed.',
		params: [{ name: 'actions', type: 'KeyAction', description: 'An object whose keys are strings representing keyboard keys, and whose values are the functions that pressing that key should run.' }],
		related: [{ path: 'api/functions/input/on-key-release' }, { path: 'api/functions/input/on-key-hold' }],
	},
})

const onKeyRelease = fn({
	slug: 'on-key-release',
	title: 'onKeyRelease()',
	icon: 'tabler:keyboard',
	summary: 'Register functions to run when keys are released.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'onKeyRelease(actions: KeyAction): void',
		description: 'Register input actions to run once each time a key is released.',
		params: [{ name: 'actions', type: 'KeyAction', description: 'An object whose keys are strings representing keyboard keys, and whose values are the functions that releasing that key should run.' }],
		related: [{ path: 'api/functions/input/on-key-press' }],
	},
})

const onKeyHold = fn({
	slug: 'on-key-hold',
	title: 'onKeyHold()',
	icon: 'tabler:keyboard',
	summary: 'Register functions to run repeatedly while keys are held.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'onKeyHold(actions: KeyAction): void',
		description: 'Register input actions to run repeatedly while a key is held.',
		params: [{ name: 'actions', type: 'KeyAction', description: 'An object whose keys are strings representing keyboard keys, and whose values are the functions that holding that key should run.' }],
		related: [{ path: 'api/functions/input/key-pressed' }],
	},
})

const onMouse = fn({
	slug: 'on-mouse',
	title: 'onMouse()',
	icon: 'tabler:mouse',
	summary: 'Register functions for mouse/click events.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'onMouse(actions: MouseInputAction): void',
		description: 'Register input actions to run once each time a mouse event is detected.',
		params: [{ name: 'actions', type: 'MouseInputAction', description: 'An object whose keys are strings representing mouse events, and whose values are the functions that activating that event should run.' }],
		related: [{ path: 'api/traits/interactable' }],
	},
})

export const input: DocCategoryNode = {
	kind: 'category',
	slug: 'input',
	title: 'Input',
	icon: 'tabler:keyboard',
	summary: 'Keyboard and mouse input, checked or reacted to.',
	intro: 'Functions for reading keyboard state directly, or registering handlers that react to key and mouse events as they happen.',
	children: [keyPressed, keyJustPressed, keyJustReleased, onKeyPress, onKeyRelease, onKeyHold, onMouse],
}
