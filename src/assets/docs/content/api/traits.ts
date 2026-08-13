import type { DocCategoryNode, DocEntryNode } from '../../docsTypes'

// Shared trait mixins composed into the drawable classes (see classes.ts). Each
// class links only to the traits it actually composes — verified against the
// real declarations in src/assets/api/apiLib.ts and src/assets/api/mixins.ts,
// not assumed uniform across classes.

const positionable: DocEntryNode = {
	kind: 'entry',
	slug: 'positionable',
	title: 'Positionable',
	icon: 'tabler:scan-position',
	summary: "Controls an object's position in the world.",
	body: {
		kind: 'api-member',
		memberKind: 'trait',
		description: "Adds world position to an object: x/y coordinates, a combined point, and helpers to move to a specific or random spot.",
		properties: [
			{ name: 'x', type: 'number', description: 'Horizontal position in the world.' },
			{ name: 'y', type: 'number', description: 'Vertical position in the world.' },
			{ name: 'pos', type: 'Point', description: 'Position in the world. Alias of position.' },
			{ name: 'position', type: 'Point', description: 'Position in the world.' },
		],
		methods: [
			{ name: 'goTo', signature: 'goTo(x: number, y: number): void', description: 'Set world position from separate x and y values.' },
			{ name: 'goTo', signature: 'goTo(position: Point): void', description: 'Set world position from a Point.' },
			{ name: 'goToRandom', signature: 'goToRandom(): void', description: 'Set position to a random point within the current visible screen area.' },
		],
	},
}

const sizable: DocEntryNode = {
	kind: 'entry',
	slug: 'sizable',
	title: 'Sizable',
	icon: 'tabler:resize',
	summary: "Controls an object's width, height, and scale.",
	body: {
		kind: 'api-member',
		memberKind: 'trait',
		description: "Adds size to an object — explicit width/height in pixels, plus a uniform scale multiplier (2 doubles size, 0.5 halves it).",
	},
}

const rotatable: DocEntryNode = {
	kind: 'entry',
	slug: 'rotatable',
	title: 'Rotatable',
	icon: 'tabler:rotate-rectangle',
	summary: "Controls an object's rotation angle.",
	body: {
		kind: 'api-member',
		memberKind: 'trait',
		description: 'Adds rotation to an object, readable/settable in degrees (rotation) or radians (radians).',
	},
}

const viewable: DocEntryNode = {
	kind: 'entry',
	slug: 'viewable',
	title: 'Viewable',
	icon: 'tabler:eye',
	summary: "Controls an object's transparency, render order, and visibility.",
	body: {
		kind: 'api-member',
		memberKind: 'trait',
		description: 'Adds display control to an object: alpha (transparency), layer (render order — higher shows in front), and visible.',
	},
}

const interactable: DocEntryNode = {
	kind: 'entry',
	slug: 'interactable',
	title: 'Interactable',
	icon: 'tabler:hand-click',
	summary: 'Registers mouse interaction — clicks, dragging, hovering.',
	body: {
		kind: 'api-member',
		memberKind: 'trait',
		description: 'Adds mouse interaction to an object: draggable, a custom cursor, and per-event handlers (onClick, onRelease, onDoubleClick, left/right/middle variants, onMouseEnter/Exit/Move, onDrag/DragStart/DragEnd, onScroll), plus a combined onMouse() to register several at once.',
	},
}

const timeable: DocEntryNode = {
	kind: 'entry',
	slug: 'timeable',
	title: 'Timeable',
	icon: 'tabler:clock',
	summary: 'Tracks how long an object has existed.',
	body: {
		kind: 'api-member',
		memberKind: 'trait',
		description: 'Adds an age property, tracking how long this object has existed in seconds.',
		properties: [
			{ name: 'age', type: 'number', description: 'How long this object has existed in seconds.' },
		],
	},
}

const gameObject: DocEntryNode = {
	kind: 'entry',
	slug: 'game-object',
	title: 'GameObject',
	icon: 'tabler:cube',
	summary: 'The composed base shape behind Sprite, Rectangle, Circle, and Label.',
	body: {
		kind: 'api-member',
		memberKind: 'trait',
		description: 'GameObject is not a trait a user constructs directly — it is the composition of every trait below, and is what Sprite, Rectangle, Circle, and Label are all built from. Line, VLine, and HLine compose a smaller, direct subset of these traits instead of GameObject as a whole — see each class’s own "Composed From" section.',
		mixins: [
			{ path: 'api/traits/positionable' },
			{ path: 'api/traits/sizable' },
			{ path: 'api/traits/rotatable' },
			{ path: 'api/traits/interactable' },
			{ path: 'api/traits/viewable' },
			{ path: 'api/traits/timeable' },
		],
	},
}

export const traits: DocCategoryNode = {
	kind: 'category',
	slug: 'traits',
	title: 'Shared Traits',
	icon: 'tabler:puzzle',
	summary: 'The reusable building blocks composed into every drawable class.',
	intro: 'Every drawable class (Sprite, Rectangle, Circle, Line, VLine, HLine, Label) is built by composing a subset of these shared traits, rather than each redeclaring the same properties. A class page lists exactly which traits it composes under "Composed From" — click through to see that trait’s own members instead of finding them duplicated on every class.',
	children: [gameObject, positionable, sizable, rotatable, viewable, interactable, timeable],
}
