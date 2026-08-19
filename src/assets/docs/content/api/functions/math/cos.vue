<script lang="ts">
export const meta = {
	title: 'cos()',
	icon: 'tabler:wave-sine',
	summary: 'The cosine of a number.',
}

export default {}
</script>

<template>
	<DocSignature>cos(angle: number, unit?: string): number</DocSignature>

	<DocSection id="content-1">
		<p>Returns the cosine of a number.</p>
	</DocSection>

	<DocParams>
		<DocParam name="angle" type="number">The angle.</DocParam>
		<DocParam name="unit" type="string" optional>The measurement unit ('radians'/'degrees'). Defaults to degrees.</DocParam>
	</DocParams>

	<DocReturns type="number">The cosine of the angle.</DocReturns>

	<DocRelated :paths="['api/functions/math/sin', 'api/functions/math/tan']" />
</template>
