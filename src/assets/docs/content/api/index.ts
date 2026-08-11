import type { DocCategoryNode } from '../../docsTypes'
import { traits } from './traits'
import { classes } from './classes'
import { functions } from './functions'
import { globals } from './globals'
import { colors } from './colors'

export const api: DocCategoryNode = {
	kind: 'category',
	slug: 'api',
	title: 'Sunsprite API',
	icon: 'sunsprite:sun',
	summary: 'Everything scriptable: classes, functions, and shared traits.',
	intro: 'The full scripting API available in every project — the classes you can draw with, the functions that drive them, the shared traits they’re composed from, and the global references and constants available everywhere.',
	children: [classes, traits, functions, globals, colors],
}
