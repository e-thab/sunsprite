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
		// description: 'An image-based game object — the most common way to draw something with a picture. Composes every trait in GameObject (position, size, rotation, mouse interaction, visibility, age), plus its own src.',
		description: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque quis finibus felis. Duis vestibulum aliquam suscipit. Curabitur elementum egestas lacinia. Nam rhoncus velit nisi. Nulla et augue tristique odio blandit convallis. Integer rutrum ornare malesuada. Sed vehicula rutrum consectetur.

In mattis massa in accumsan consequat. Aenean pretium sapien tortor, quis hendrerit eros fringilla et. Ut in augue libero. Vivamus sit amet lobortis augue, sit amet auctor elit. Aliquam massa arcu, euismod at pharetra aliquet, congue aliquet eros. Pellentesque ut malesuada sapien, eget ultrices tortor. Morbi posuere elementum ligula eu ornare.

Sed lobortis libero in nisi semper porttitor. Fusce vestibulum urna sem, sed mollis lorem finibus ultrices. Fusce in blandit lacus. Maecenas eu porta dui. Vivamus eu blandit odio, eu scelerisque neque. Fusce pellentesque semper ligula et convallis. Nunc fermentum nunc vitae nisi tristique, non imperdiet ligula viverra. Nulla facilisis erat dignissim est egestas, ut dapibus quam pretium.

Donec tempus, magna sit amet fringilla accumsan, ante diam vestibulum libero, a fermentum tortor purus ac urna. Vivamus commodo mollis nibh eget maximus. Fusce viverra massa ut orci blandit, a ornare nulla varius. Aenean vehicula facilisis interdum. In quam massa, vestibulum vel finibus ac, lobortis non nisl. Maecenas imperdiet arcu purus, a consequat justo tempus quis. Morbi tincidunt lacinia justo eget fermentum. Pellentesque non aliquam libero.

Sed elementum auctor efficitur. Cras pharetra, sem ultricies suscipit condimentum, ligula ligula egestas leo, vitae feugiat urna neque ac urna. Aenean sodales dolor arcu, non auctor libero posuere non. Curabitur auctor laoreet risus non cursus. Donec mi mi, vulputate quis felis a, pulvinar convallis tortor. Vivamus id porttitor lorem, a congue metus. Integer varius nisl id velit elementum, a placerat lacus condimentum. Sed quis mi velit. Vestibulum blandit mattis lectus vitae aliquet. Morbi tincidunt vehicula lacinia.

Donec eleifend elit nec libero ultrices fermentum. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nulla mollis diam quis nibh faucibus blandit. Nunc fringilla ullamcorper ultricies. Aliquam ornare sed urna imperdiet hendrerit. Duis sit amet nisi elementum, egestas quam a, lobortis libero. Pellentesque vestibulum pulvinar semper. Sed ac tincidunt felis. Nullam efficitur nibh a mattis hendrerit. Interdum et malesuada fames ac ante ipsum primis in faucibus. Morbi interdum interdum quam at imperdiet. Quisque a convallis nibh, eu varius ligula.

Pellentesque gravida lorem sed tempor accumsan. In finibus mi non semper egestas. Aliquam cursus nibh vel purus pharetra pulvinar. Vestibulum at erat accumsan, pretium sapien vitae, imperdiet elit. Sed mollis turpis ut risus suscipit, vel mollis mauris lobortis. Suspendisse luctus at mauris a commodo. Ut tempus blandit orci. Donec ac ante ante.

Cras vulputate risus at euismod ultricies. Fusce porta tincidunt feugiat. Nam condimentum ornare interdum. Aliquam id magna sit amet nisi bibendum convallis. Sed convallis, enim et ullamcorper posuere, diam quam semper nisl, at vestibulum tortor felis sed diam. Praesent interdum fringilla velit ut feugiat. Suspendisse velit nisl, placerat eu justo vel, volutpat porttitor tellus. Duis faucibus sapien nec posuere molestie. Morbi ut sapien arcu. Pellentesque ac libero velit. Vestibulum eget interdum arcu. Aenean eget lacus.`,
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
