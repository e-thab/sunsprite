import type { DocEntryNode } from '../../docsTypes'

export const colors: DocEntryNode = {
	kind: 'entry',
	slug: 'colors',
	title: 'Colors',
	icon: 'tabler:palette',
	summary: 'Named color constants, e.g. Colors.CornflowerBlue.',
	body: {
		kind: 'api-member',
		memberKind: 'enum',
		signature: 'enum Colors',
		description: 'A large set of standard named web colors, each mapping to a hex color string — a convenient alternative to typing hex codes by hand. Includes the full standard CSS color-name set (AliceBlue, Black, Blue, Coral, CornflowerBlue, Crimson, DarkGreen, Gold, HotPink, Indigo, Magenta, Orange, Purple, Red, SeaGreen, SkyBlue, Tomato, Violet, White, Yellow, and hundreds more).',
		example: `rect.color = Colors.CornflowerBlue`,
		widgets: [
			{ widget: 'color-swatches', id: 'palette', title: 'Palette' },
		],
	},
}
