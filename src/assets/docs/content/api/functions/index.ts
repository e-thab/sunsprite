import type { DocCategoryNode } from '../../../docsTypes'
import { gameLoop } from './gameLoop'
import { randomFns } from './random'
import { input } from './input'
import { output } from './output'
import { math } from './math'

export const functions: DocCategoryNode = {
	kind: 'category',
	slug: 'functions',
	title: 'Functions',
	icon: 'tabler:function',
	summary: 'The global functions available to every script.',
	intro: 'Free functions available everywhere in a script, grouped by what they do — scheduling code over time, reading input, writing to the output panel, random values, and math helpers.',
	children: [gameLoop, randomFns, input, output, math],
}
