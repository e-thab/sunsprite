import type { DocCategoryNode, DocEntryNode } from '../../../docsTypes'

function fn(entry: Omit<DocEntryNode, 'kind'>): DocEntryNode {
	return { kind: 'entry', ...entry }
}

const forever = fn({
	slug: 'forever',
	title: 'forever()',
	icon: 'tabler:infinity',
	summary: 'Runs a function every frame — the primary game loop.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'forever(func: (delta: number) => void): void',
		description: 'The primary game loop. Runs the given function once per frame, for as long as the game runs.',
		params: [
			{ name: 'func', type: '(delta: number) => void', description: 'The function to run each frame. Receives delta, the time since the previous frame.' },
		],
		example:
`forever(delta => {
    bunny.rotation += 2
})`,
		related: [{ path: 'api/functions/game-loop/repeat' }, { path: 'api/functions/game-loop/every' }],
	},
})

const repeat = fn({
	slug: 'repeat',
	title: 'repeat()',
	icon: 'tabler:repeat',
	summary: 'Runs a function a set number of times, once per frame.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'repeat(times: number, func: (i: number) => void): { then(afterFunc: (i: number) => void): void }',
		description: 'Runs a specified number of times alongside the game loop, one iteration per frame.',
		params: [
			{ name: 'times', type: 'number', description: 'The number of times to repeat.' },
			{ name: 'func', type: '(i: number) => void', description: 'The function to be repeated. Receives i, the current iteration (times repeated so far).' },
		],
		returns: { type: '{ then(afterFunc: (i: number) => void): void }', description: 'Call .then() to register a function that runs once, when the repeat ends.' },
		example:
`repeat(45, () => {
    gator.rotation += 8
}).then(() => {
    print('done')
})`,
		related: [{ path: 'api/functions/game-loop/forever' }, { path: 'api/functions/game-loop/repeat-until' }],
	},
})

const repeatUntil = fn({
	slug: 'repeat-until',
	title: 'repeatUntil()',
	icon: 'tabler:player-stop',
	summary: 'Runs a function every frame until a condition becomes true.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'repeatUntil(condition: () => boolean, func: (i: number) => void): { then(afterFunc: (i: number) => void): void }',
		description: 'Runs alongside the game loop, one iteration per frame, until the given condition becomes true.',
		params: [
			{ name: 'condition', type: '() => boolean', description: 'The predicate condition to check each frame.' },
			{ name: 'func', type: '(i: number) => void', description: 'The function to be repeated. Receives i, the current iteration (times repeated so far).' },
		],
		returns: { type: '{ then(afterFunc: (i: number) => void): void }', description: 'Call .then() to register a function that runs once, when the loop ends.' },
		example:
`repeatUntil(() => bunny.rotation >= 360, i => {
    bunny.rotation += 2
}).then(i => print(\`done after \${i} frames\`))`,
		related: [{ path: 'api/functions/game-loop/repeat-while' }, { path: 'api/functions/game-loop/repeat' }],
	},
})

const repeatWhile = fn({
	slug: 'repeat-while',
	title: 'repeatWhile()',
	icon: 'tabler:player-play',
	summary: 'Runs a function every frame while a condition stays true.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'repeatWhile(condition: () => boolean, func: (i: number) => void): { then(afterFunc: (i: number) => void): void }',
		description: 'Runs repeatedly while the given condition is true, alongside the game loop, one iteration per frame.',
		params: [
			{ name: 'condition', type: '() => boolean', description: 'The predicate condition to check each frame.' },
			{ name: 'func', type: '(i: number) => void', description: 'The function to be repeated. Receives i, the current iteration (times repeated so far).' },
		],
		returns: { type: '{ then(afterFunc: (i: number) => void): void }', description: 'Call .then() to register a function that runs once, every time the condition switches from true to false.' },
		related: [{ path: 'api/functions/game-loop/repeat-until' }],
	},
})

const after = fn({
	slug: 'after',
	title: 'after()',
	icon: 'tabler:clock-play',
	summary: 'Runs a function once, after a delay in seconds.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'after(seconds: number, func: () => void): void',
		description: 'Runs the given function once, after the specified number of seconds have passed.',
		params: [
			{ name: 'seconds', type: 'number', description: 'The number of seconds to wait before running.' },
			{ name: 'func', type: '() => void', description: 'The function to run.' },
		],
		example:
`after(2, () => {
    print('2 seconds have passed')
})`,
		related: [{ path: 'api/functions/game-loop/every' }],
	},
})

const every = fn({
	slug: 'every',
	title: 'every()',
	icon: 'tabler:clock-repeat',
	summary: 'Runs a function repeatedly at a fixed time interval.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'every(seconds: number, func: () => void): void',
		description: 'Runs the given function once immediately, then repeatedly at the specified time interval.',
		params: [
			{ name: 'seconds', type: 'number', description: 'The number of seconds to wait before running each time.' },
			{ name: 'func', type: '() => void', description: 'The function to run.' },
		],
		example:
`every(0.1, () => {
    new Sprite({ src: 'https://pixijs.com/assets/bunny.png' })
})`,
		related: [{ path: 'api/functions/game-loop/after' }, { path: 'api/functions/game-loop/forever' }],
	},
})

const when = fn({
	slug: 'when',
	title: 'when()',
	icon: 'tabler:bolt',
	summary: 'Runs a function once each time a condition becomes true.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'when(condition: () => boolean, func: () => void): void',
		description: 'Checks the given condition every frame, and runs func once each time it transitions from false to true.',
		params: [
			{ name: 'condition', type: '() => boolean', description: 'The condition to check.' },
			{ name: 'func', type: '() => void', description: 'The function to run.' },
		],
		related: [{ path: 'api/functions/game-loop/repeat-until' }],
	},
})

export const gameLoop: DocCategoryNode = {
	kind: 'category',
	slug: 'game-loop',
	title: 'Game Loop & Timing',
	icon: 'tabler:clock-play',
	summary: 'Functions that run code every frame, on a delay, or on a condition.',
	intro: 'The core scheduling functions almost every script is built on — from the primary forever() loop to one-shot delays and conditional triggers.',
	children: [forever, repeat, repeatUntil, repeatWhile, after, every, when],
}
