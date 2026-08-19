<script lang="ts">
import Random from '@/assets/api/Random'

export const meta = {
	title: 'Random',
	icon: `tabler:dice-${Random.range(1, 6)}`,
	summary: 'Helpers for random numbers, colors, positions, and choices.',
	order: [
		'range',
		'float',
		'coin-flip',
		'roll',
		'letter',
		'char',
		'color',
		'choice',
		'radians',
		'degrees',
		'position',
		'pos',
		'x',
		'y',
	],
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>A collection of functions useful for generating random values, all available on the global Random object.</p>
	</DocSection>
</template>
