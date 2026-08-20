<script lang="ts">
export const meta = {
	title: 'Random.float()',
	icon: 'tabler:decimal',
	summary: 'A random decimal value in a given range.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>Random.float(min: number, max: number): number</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Returns a random float in a given range, min inclusive / max exclusive. If min &gt; max, they’re automatically swapped for you.</p>
	</DocSection>

	<DocParams>
		<DocParam name="min" type="number">The low end of the range.</DocParam>
		<DocParam name="max" type="number">The high end of the range.</DocParam>
	</DocParams>

	<DocReturns type="number">A random decimal value, min inclusive / max exclusive.</DocReturns>

	<DocSnippet title="Example">
<pre>bunny.scale = Random.float(0.5, 1.5)</pre>
	</DocSnippet>

	<DocRelated :paths="['api/functions/random/range']" />
</template>
