<script lang="ts">
export const meta = {
	title: 'sin()',
	icon: 'tabler:wave-sine',
	summary: 'The sine of a number.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>sin(angle: number, unit?: string): number</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Returns the sine of a number.</p>
	</DocSection>

	<DocParams>
		<DocParam name="angle" type="number">The angle.</DocParam>
		<DocParam name="unit" type="string" optional>The measurement unit ('radians'/'degrees'). Defaults to degrees.</DocParam>
	</DocParams>

	<DocReturns type="number">The sine of the angle.</DocReturns>

	<DocRelated :paths="['api/functions/math/cos', 'api/functions/math/tan']" />
</template>
