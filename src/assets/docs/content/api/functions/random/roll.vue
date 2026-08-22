<script lang="ts">
import Random from '@/assets/api/Random'

export const meta = {
	title: 'Random.roll()',
	icon: `tabler:dice-${Random.integer(1, 6)}`,
	summary: 'The result of rolling a die with a given number of sides.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>Random.roll(sides: number): number</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Returns the result of rolling a die with a given number of sides.</p>
	</DocSection>

	<DocParams>
		<DocParam name="sides" type="number">The number of sides on the die.</DocParam>
	</DocParams>

	<DocReturns type="number">An integer between 1 and sides, inclusive.</DocReturns>
</template>
