<script lang="ts">
export const meta = {
	title: 'deg2rad()',
	icon: 'tabler:angle',
	summary: 'Converts an angle from degrees to radians.',
}

export default {}
</script>

<template>
	<DocSignature>deg2rad(deg: number): number</DocSignature>

	<DocSection id="content-1">
		<p>Returns an angle converted from degrees to radians.</p>
	</DocSection>

	<DocParams>
		<DocParam name="deg" type="number">The angle in degrees.</DocParam>
	</DocParams>

	<DocReturns type="number">The angle in radians.</DocReturns>

	<DocRelated :paths="['api/functions/math/rad2deg']" />
</template>
