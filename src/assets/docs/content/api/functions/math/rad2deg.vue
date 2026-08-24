<script lang="ts">
export const meta = {
	title: 'rad2deg()',
	icon: 'tabler:angle',
	summary: 'Converts an angle from radians to degrees.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>rad2deg(rad: number): number</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Returns an angle converted from radians to degrees.</p>
	</DocSection>

	<DocParams>
		<DocParam name="rad" type="number">The angle in radians.</DocParam>
	</DocParams>

	<DocReturns type="number">The angle in degrees.</DocReturns>

	<DocRelated :paths="['api/functions/math/deg2rad']" />
</template>
