import type { DocCategoryNode, DocEntryNode } from '../../../docsTypes'

// Note: apiLib.ts also *declares* sqrt/min/max/floor/ceil/round/PI, but their
// implementations are commented out (unfinished) in utility.ts — intentionally
// left undocumented here since calling them wouldn't actually work today.

function fn(entry: Omit<DocEntryNode, 'kind'>): DocEntryNode {
	return { kind: 'entry', ...entry }
}

const deg2rad = fn({
	slug: 'deg2rad',
	title: 'deg2rad()',
	icon: 'tabler:angle',
	summary: 'Converts an angle from degrees to radians.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'deg2rad(deg: number): number',
		description: 'Returns an angle converted from degrees to radians.',
		params: [{ name: 'deg', type: 'number', description: 'The angle in degrees.' }],
		returns: { type: 'number', description: 'The angle in radians.' },
		related: [{ path: 'api/functions/math/rad2deg' }],
	},
})

const rad2deg = fn({
	slug: 'rad2deg',
	title: 'rad2deg()',
	icon: 'tabler:angle',
	summary: 'Converts an angle from radians to degrees.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'rad2deg(rad: number): number',
		description: 'Returns an angle converted from radians to degrees.',
		params: [{ name: 'rad', type: 'number', description: 'The angle in radians.' }],
		returns: { type: 'number', description: 'The angle in degrees.' },
		related: [{ path: 'api/functions/math/deg2rad' }],
	},
})

const sin = fn({
	slug: 'sin',
	title: 'sin()',
	icon: 'tabler:wave-sine',
	summary: 'The sine of a number.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: "sin(angle: number, unit?: string): number",
		description: 'Returns the sine of a number.',
		params: [
			{ name: 'angle', type: 'number', description: 'The angle.' },
			{ name: 'unit', type: 'string', description: "The measurement unit ('radians'/'degrees'). Defaults to degrees.", optional: true },
		],
		returns: { type: 'number', description: 'The sine of the angle.' },
		related: [{ path: 'api/functions/math/cos' }, { path: 'api/functions/math/tan' }],
	},
})

const cos = fn({
	slug: 'cos',
	title: 'cos()',
	icon: 'tabler:wave-sine',
	summary: 'The cosine of a number.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: "cos(angle: number, unit?: string): number",
		description: 'Returns the cosine of a number.',
		params: [
			{ name: 'angle', type: 'number', description: 'The angle.' },
			{ name: 'unit', type: 'string', description: "The measurement unit ('radians'/'degrees'). Defaults to degrees.", optional: true },
		],
		returns: { type: 'number', description: 'The cosine of the angle.' },
		related: [{ path: 'api/functions/math/sin' }, { path: 'api/functions/math/tan' }],
	},
})

const tan = fn({
	slug: 'tan',
	title: 'tan()',
	icon: 'tabler:wave-sine',
	summary: 'The tangent of a number.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: "tan(angle: number, unit?: string): number",
		description: 'Returns the tangent of a number.',
		params: [
			{ name: 'angle', type: 'number', description: 'The angle.' },
			{ name: 'unit', type: 'string', description: "The measurement unit ('radians'/'degrees'). Defaults to degrees.", optional: true },
		],
		returns: { type: 'number', description: 'The tangent of the angle.' },
		related: [{ path: 'api/functions/math/sin' }, { path: 'api/functions/math/cos' }],
	},
})

const atan2 = fn({
	slug: 'atan2',
	title: 'atan2()',
	icon: 'tabler:arrow-up-right-circle',
	summary: 'The angle between the X axis and a point.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'atan2(y: number, x: number, unit?: string): number',
		description: 'Returns the angle between the X axis and the line going through both the origin and the given point.',
		params: [
			{ name: 'y', type: 'number', description: 'The y position of the given point.' },
			{ name: 'x', type: 'number', description: 'The x position of the given point.' },
			{ name: 'unit', type: 'string', description: "The measurement unit ('radians'/'degrees'). Defaults to degrees.", optional: true },
		],
		returns: { type: 'number', description: 'The angle between the X axis and the point.' },
	},
})

const clamp = fn({
	slug: 'clamp',
	title: 'clamp()',
	icon: 'tabler:container',
	summary: 'Constrains a number to a given range.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'clamp(num: number, min: number, max: number): number',
		description: 'Returns a number constrained to a given range. If num <= min, returns min. If num >= max, returns max. If min > max, they’re automatically swapped for you.',
		params: [
			{ name: 'num', type: 'number', description: 'A number.' },
			{ name: 'min', type: 'number', description: 'The low end of the constraint range.' },
			{ name: 'max', type: 'number', description: 'The high end of the constraint range.' },
		],
		returns: { type: 'number', description: 'num, constrained between min and max.' },
	},
})

export const math: DocCategoryNode = {
	kind: 'category',
	slug: 'math',
	title: 'Math',
	icon: 'tabler:math',
	summary: 'Trigonometry, angle conversion, and range helpers.',
	intro: 'Free functions for common math operations — angle conversion, trigonometry, and constraining values to a range.',
	children: [deg2rad, rad2deg, sin, cos, tan, atan2, clamp],
}
