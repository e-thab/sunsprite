<script lang="ts">
export const meta = {
	title: 'atan2()',
	icon: 'tabler:arrow-up-right-circle',
	summary: 'The angle between the X axis and a point.',
}

export default {}
</script>

<template>
	<DocSignature>atan2(y: number, x: number, unit?: string): number</DocSignature>

	<DocSection id="content-1">
		<p>Returns the angle between the X axis and the line going through both the origin and the given point.</p>
	</DocSection>

	<DocParams>
		<DocParam name="y" type="number">The y position of the given point.</DocParam>
		<DocParam name="x" type="number">The x position of the given point.</DocParam>
		<DocParam name="unit" type="string" optional>The measurement unit ('radians'/'degrees'). Defaults to degrees.</DocParam>
	</DocParams>

	<DocReturns type="number">The angle between the X axis and the point.</DocReturns>
</template>
