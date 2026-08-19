<script lang="ts">
export const meta = {
	title: 'Random.range()',
	icon: 'tabler:brackets-contain',
	summary: 'A random integer in a given range.',
}

export default {}
</script>

<template>
	<DocSignature>Random.range(min: number, max: number): number</DocSignature>

	<DocSection id="content-1">
		<p>Returns a random integer in a given range, min and max inclusive. If min &gt; max, they’re automatically swapped for you.</p>
	</DocSection>

	<DocParams>
		<DocParam name="min" type="number">The low end of the range.</DocParam>
		<DocParam name="max" type="number">The high end of the range.</DocParam>
	</DocParams>

	<DocReturns type="number">A random integer between min and max, inclusive.</DocReturns>

	<DocExample>
<pre>const sides = Random.range(1, 6)</pre>
	</DocExample>

	<DocRelated :paths="['api/functions/random/float']" />
</template>
