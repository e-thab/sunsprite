import type { DocCategoryNode, DocEntryNode } from '../../docsTypes'

// Verified against the real declarations in src/assets/api/apiLib.ts (the
// actual public API surface shown to users in the editor) rather than the
// deeper runtime implementation, which occasionally exposes a bit more than
// what's currently declared publicly (e.g. GameObject's touching()/corner
// getters, or Line's length getter) — those aren't documented here since
// they aren't part of the shipped public API yet.

const sprite: DocEntryNode = {
	kind: 'entry',
	slug: 'sprite',
	title: 'Sprite',
	icon: 'tabler:photo',
	summary: 'An image-based game object.',
	body: {
		kind: 'api-member',
		memberKind: 'class',
		signature: 'new Sprite(options?: SpriteProps)',
		description: 'An image-based game object — the most common way to draw something with a picture. Composes every trait in GameObject (position, size, rotation, mouse interaction, visibility, age), plus its own src.',
		params: [
			{ name: 'options', type: 'SpriteProps', description: 'Initial properties: any GameObject property (x, y, width, height, scale, rotation, alpha, layer, visible, draggable, cursor, mouse event handlers) plus src.', optional: true },
		],
		properties: [
			{ name: 'src', type: 'string', description: "A URL path to the sprite's image." },
		],
		mixins: [{ path: 'api/traits/game-object' }],
		example:
`const bunny = new Sprite({
    src: 'https://pixijs.com/assets/bunny.png',
    x: 200,
})

forever(delta => {
    bunny.rotation += 2
})`,
	},
}

const line: DocEntryNode = {
	kind: 'entry',
	slug: 'line',
	title: 'Line',
	icon: 'tabler:line',
	summary: 'A straight line between two points.',
	body: {
		kind: 'api-member',
		memberKind: 'class',
		signature: 'new Line(options?: LineProps)',
		description: 'A straight line from point A to point B. Unlike Sprite/Rectangle/Circle/Label, Line does not compose GameObject — it has no x/y/width/height/draggable of its own, since its position is defined entirely by its two endpoints.',
		params: [
			{ name: 'options', type: 'LineProps', description: 'Initial properties: pointA, pointB, color, thickness, plus any Rotatable/Viewable property.', optional: true },
		],
		properties: [
			{ name: 'pointA', type: 'Point', description: 'Position of end point A.' },
			{ name: 'pointB', type: 'Point', description: 'Position of end point B.' },
			{ name: 'color', type: 'string', description: 'The color of the line.' },
			{ name: 'thickness', type: 'number', description: 'The thickness of the line. Default 2.' },
		],
		mixins: [
			{ path: 'api/traits/rotatable' },
			{ path: 'api/traits/timeable' },
			{ path: 'api/traits/viewable' },
		],
		example:
`const divider = new Line({
    pointA: { x: -100, y: 0 },
    pointB: { x: 100, y: 0 },
    color: '#ffffff',
    thickness: 4,
})`,
	},
}

const hline: DocEntryNode = {
	kind: 'entry',
	slug: 'hline',
	title: 'HLine',
	icon: 'tabler:arrows-horizontal',
	summary: 'An infinitely long horizontal line.',
	body: {
		kind: 'api-member',
		memberKind: 'class',
		signature: 'new HLine(options?: HLineProps)',
		description: 'A straight, infinitely long horizontal line spanning the full width of the screen at a given y. The minimal case in this API — it composes only Viewable, nothing else.',
		params: [
			{ name: 'options', type: 'HLineProps', description: 'Initial properties: y, color, thickness, plus any Viewable property.', optional: true },
		],
		properties: [
			{ name: 'y', type: 'number', description: 'The vertical position of the line.' },
			{ name: 'color', type: 'string', description: 'The color of the line.' },
			{ name: 'thickness', type: 'number', description: 'The thickness of the line.' },
		],
		mixins: [{ path: 'api/traits/viewable' }],
		example:
`const groundLine = new HLine({
    y: -150,
    color: '#33aa55',
})`,
	},
}

const rectangle: DocEntryNode = {
	kind: 'entry',
	slug: 'rectangle',
	title: 'Rectangle',
	icon: 'tabler:square',
	summary: 'A filled rectangle shape.',
	body: {
		kind: 'api-member',
		memberKind: 'class',
		signature: 'new Rectangle(options?: RectangleProps)',
		description: 'A filled rectangle shape. Composes every trait in GameObject, plus its own fill color.',
		properties: [
			{ name: 'color', type: 'string', description: 'The fill color.' },
		],
		mixins: [{ path: 'api/traits/game-object' }],
	},
}

const circle: DocEntryNode = {
	kind: 'entry',
	slug: 'circle',
	title: 'Circle',
	icon: 'tabler:circle',
	summary: 'A filled circle shape.',
	body: {
		kind: 'api-member',
		memberKind: 'class',
		signature: 'new Circle(options?: CircleProps)',
		description: 'A filled circle shape. Composes every trait in GameObject, plus its own fill color and radius.',
		properties: [
			{ name: 'color', type: 'string', description: 'The fill color.' },
			{ name: 'radius', type: 'number', description: 'The distance from the center of the circle to the edge.' },
		],
		mixins: [{ path: 'api/traits/game-object' }],
	},
}

const vline: DocEntryNode = {
	kind: 'entry',
	slug: 'vline',
	title: 'VLine',
	icon: 'tabler:arrows-vertical',
	summary: 'An infinitely long vertical line.',
	body: {
		kind: 'api-member',
		memberKind: 'class',
		signature: 'new VLine(options?: VLineProps)',
		description: 'A straight, infinitely long vertical line spanning the full height of the screen at a given x. Like HLine, it composes only Viewable.',
		properties: [
			{ name: 'x', type: 'number', description: 'The horizontal position of the line.' },
			{ name: 'color', type: 'string', description: 'The color of the line.' },
			{ name: 'thickness', type: 'number', description: 'The thickness of the line.' },
		],
		mixins: [{ path: 'api/traits/viewable' }],
	},
}

const label: DocEntryNode = {
	kind: 'entry',
	slug: 'label',
	title: 'Label',
	icon: 'tabler:letter-case',
	summary: 'An object that displays text.',
	body: {
		kind: 'api-member',
		memberKind: 'class',
		signature: 'new Label(options?: LabelProps)',
		description: 'An object that displays text — useful for scores, timers, and messages. Composes every trait in GameObject, plus its own text/size/font/color.',
		properties: [
			{ name: 'text', type: 'string | string[]', description: 'Text content of the label.' },
			{ name: 'size', type: 'number', description: 'Font size.' },
			{ name: 'font', type: 'string', description: 'Font family.' },
			{ name: 'color', type: 'string', description: 'Fill color.' },
		],
		mixins: [{ path: 'api/traits/game-object' }],
	},
}

const vector2: DocEntryNode = {
	kind: 'entry',
	slug: 'vector2',
	title: 'Vector2',
	icon: 'tabler:vector',
	summary: 'A 2D vector — not yet implemented.',
	body: {
		kind: 'api-member',
		memberKind: 'class',
		description: 'Reserved for a future 2D vector type. It exists as a placeholder in the API declarations today but has no members yet.',
	},
}

export const classes: DocCategoryNode = {
	kind: 'category',
	slug: 'classes',
	title: 'Classes',
	icon: 'tabler:triangle-square-circle',
	summary: 'The drawable objects: sprites, shapes, lines, and text.',
	intro: 'The objects you can create and place in a game. Most compose the full GameObject trait set (position, size, rotation, mouse interaction, visibility, age); Line, VLine, and HLine compose a smaller, direct subset instead — see each class’s "Composed From" section.',
	children: [sprite, rectangle, circle, line, vline, hline, label, vector2],
}
