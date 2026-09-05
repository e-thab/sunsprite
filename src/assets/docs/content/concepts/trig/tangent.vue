<script lang="ts">
export const meta = {
	title: 'Tangent',
	icon: 'tabler:line',
	summary: 'The tangent of a number.',
}

export default {}
</script>

<template>
	<!-- <DocSnippet><pre>tan(angle: number, unit?: string): number</pre></DocSnippet> -->

	<DocSection id="content-1">
		<p>The tangent of a number...</p>
	</DocSection>

	<!-- <DocParams>
		<DocParam name="angle" type="number">The angle.</DocParam>
		<DocParam name="unit" type="string" optional>The measurement unit ('radians'/'degrees'). Defaults to degrees.</DocParam>
	</DocParams> -->

	<!-- <DocReturns type="number">The tangent of the angle.</DocReturns> -->

	<DocRelated :paths="['api/functions/math/sin', 'api/functions/math/cos']" />
</template>
