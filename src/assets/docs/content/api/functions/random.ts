import { random } from '@/assets/api/utility'
import type { DocCategoryNode, DocEntryNode } from '../../../docsTypes'

// Documents Random.* as declared in src/assets/api/apiLib.ts. Note: the
// runtime implementation (src/assets/api/utility.ts) also has a `letter()`
// member that isn't yet exposed in the public declarations — intentionally
// left undocumented here since it isn't part of the shipped API surface.

function fn(entry: Omit<DocEntryNode, 'kind'>): DocEntryNode {
	return { kind: 'entry', ...entry }
}

const range = fn({
	slug: 'range',
	title: 'Random.range()',
	icon: 'tabler:brackets-contain',
	summary: 'A random integer in a given range.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'Random.range(min: number, max: number): number',
		description: 'Returns a random integer in a given range, min and max inclusive. If min > max, they’re automatically swapped for you.',
		params: [
			{ name: 'min', type: 'number', description: 'The low end of the range.' },
			{ name: 'max', type: 'number', description: 'The high end of the range.' },
		],
		returns: { type: 'number', description: 'A random integer between min and max, inclusive.' },
		example: `const sides = Random.range(1, 6)`,
		related: [{ path: 'api/functions/random/float' }],
	},
})

const float = fn({
	slug: 'float',
	title: 'Random.float()',
	icon: 'tabler:decimal',
	summary: 'A random decimal value in a given range.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'Random.float(min: number, max: number): number',
		description: 'Returns a random float in a given range, min inclusive / max exclusive. If min > max, they’re automatically swapped for you.',
		params: [
			{ name: 'min', type: 'number', description: 'The low end of the range.' },
			{ name: 'max', type: 'number', description: 'The high end of the range.' },
		],
		returns: { type: 'number', description: 'A random decimal value, min inclusive / max exclusive.' },
		example: `bunny.scale = Random.float(0.5, 1.5)`,
		related: [{ path: 'api/functions/random/range' }],
	},
})

const coinFlip = fn({
	slug: 'coin-flip',
	title: 'Random.coinFlip()',
	icon: 'tabler:coin',
	summary: 'A random true/false, 50/50 chance.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'Random.coinFlip(): boolean',
		description: 'Returns a random boolean, 50/50 chance for true/false.',
		returns: { type: 'boolean', description: 'true or false, each with 50% chance.' },
		example:
`if (Random.coinFlip()) {
    bunny.rotation += 180
}`,
	},
})

const choice = fn({
	slug: 'choice',
	title: 'Random.choice()',
	icon: 'tabler:list-search',
	summary: 'A random item from an array.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'Random.choice(array: any[]): any',
		description: 'Returns a random item from a given array.',
		params: [
			{ name: 'array', type: 'any[]', description: 'The array to choose an element from.' },
		],
		returns: { type: 'any', description: 'One randomly-chosen element from the array.' },
		example: `const color = Random.choice(['#F72585', '#7209B7', '#3A0CA3'])`,
	},
})

const color = fn({
	slug: 'color',
	title: 'Random.color()',
	icon: 'tabler:color-swatch',
	summary: 'A random hex RGB color string.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'Random.color(): string',
		description: 'Returns a random hex RGB color string.',
		returns: { type: 'string', description: 'A hex color string, e.g. "#3a9fd6".' },
		example: `rect.color = Random.color()`,
		related: [{ path: 'api/functions/random/choice' }],
	},
})

const roll = fn({
	slug: 'roll',
	title: 'Random.roll()',
	icon: `tabler:dice-${random.range(1, 6)}`,
	summary: 'The result of rolling a die with a given number of sides.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'Random.roll(sides: number): number',
		description: 'Returns the result of rolling a die with a given number of sides.',
		params: [{ name: 'sides', type: 'number', description: 'The number of sides on the die.' }],
		returns: { type: 'number', description: 'An integer between 1 and sides, inclusive.' },
	},
})

const char = fn({
	slug: 'char',
	title: 'Random.char()',
	icon: 'tabler:letter-a',
	summary: 'A random character from a string.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'Random.char(str: string): string',
		description: 'Returns a random character from a given string.',
		params: [{ name: 'str', type: 'string', description: 'The string to choose a character from.' }],
		returns: { type: 'string', description: 'One randomly-chosen character from str.' },
	},
})

const radians = fn({
	slug: 'radians',
	title: 'Random.radians()',
	icon: 'tabler:angle',
	summary: 'A random rotation in radians.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'Random.radians(): number',
		description: 'Returns a random rotation in radians as a float/decimal value. Range: [0, 2*pi).',
		returns: { type: 'number', description: 'A decimal value from 0 up to (but not including) 2*pi.' },
	},
})

const degrees = fn({
	slug: 'degrees',
	title: 'Random.degrees()',
	icon: 'tabler:angle',
	summary: 'A random rotation in degrees.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'Random.degrees(): number',
		description: 'Returns a random rotation in degrees as an integer. Range: [0, 359].',
		returns: { type: 'number', description: 'An integer from 0 to 359.' },
	},
})

const position = fn({
	slug: 'position',
	title: 'Random.position()',
	icon: 'tabler:map-pin',
	summary: 'A random position within the screen.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'Random.position(): Point',
		description: 'Returns a random position within the screen.',
		returns: { type: 'Point', description: 'A random point within the visible screen area.' },
		related: [{ path: 'api/functions/random/pos' }],
	},
})

const pos = fn({
	slug: 'pos',
	title: 'Random.pos()',
	icon: 'tabler:map-pin',
	summary: 'A random position within the screen. (alias for position)',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'Random.pos(): Point',
		description: 'Returns a random position within the screen. Alias for Random.position().',
		returns: { type: 'Point', description: 'A random point within the visible screen area.' },
		related: [{ path: 'api/functions/random/position' }],
	},
})

const x = fn({
	slug: 'x',
	title: 'Random.x()',
	icon: 'tabler:axis-x',
	summary: 'A random x position within the screen.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'Random.x(): number',
		description: 'Returns a random x position within the screen.',
		returns: { type: 'number', description: 'A random horizontal coordinate within the visible screen area.' },
	},
})

const y = fn({
	slug: 'y',
	title: 'Random.y()',
	icon: 'tabler:axis-y',
	summary: 'A random y position within the screen.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'Random.y(): number',
		description: 'Returns a random y position within the screen.',
		returns: { type: 'number', description: 'A random vertical coordinate within the visible screen area.' },
	},
})

export const randomFns: DocCategoryNode = {
	kind: 'category',
	slug: 'random',
	title: 'Random',
	icon: 'tabler:dice-5',
	summary: 'Helpers for random numbers, colors, positions, and choices.',
	intro: 'A collection of functions useful for generating random values, all available on the global Random object.',
	children: [range, float, coinFlip, roll, char, color, choice, radians, degrees, position, pos, x, y],
}
