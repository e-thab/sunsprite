<script lang="ts">
export const meta = {
	title: 'Random.color()',
	icon: 'tabler:color-swatch',
	summary: 'A random hex RGB color string.',
}

export default {}
</script>

<template>
	<DocSignature>Random.color(): string</DocSignature>

	<DocSection id="content-1">
		<p>Returns a random hex RGB color string.</p>
	</DocSection>

	<DocReturns type="string">A hex color string, e.g. "#3a9fd6".</DocReturns>

	<DocExample>
<pre>rect.color = Random.color()</pre>
	</DocExample>

	<DocRelated :paths="['api/functions/random/choice']" />
</template>
