<script lang="ts">
export const meta = {
	title: 'Random.integer()',
	icon: 'tabler:brackets-contain',
	summary: 'A random integer in a given range.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>Random.integer(min: number, max: number): number</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Returns a random integer in a given range, min and max inclusive. If min &gt; max, they’re automatically swapped for you.</p>
	</DocSection>

	<DocParams>
		<DocParam name="min" type="number">The low end of the range.</DocParam>
		<DocParam name="max" type="number">The high end of the range.</DocParam>
	</DocParams>

	<DocReturns type="number">A random integer between min and max, inclusive.</DocReturns>

	<DocSnippet title="Example">
<pre>const sides = Random.integer(1, 6)</pre>
	</DocSnippet>

	<DocRelated :paths="['api/functions/random/float']" />
</template>
