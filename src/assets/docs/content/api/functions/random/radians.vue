<script lang="ts">
export const meta = {
	title: 'Random.radians()',
	icon: 'tabler:angle',
	summary: 'A random rotation in radians.',
}

export default {}
</script>

<template>
	<DocSignature>Random.radians(): number</DocSignature>

	<DocSection id="content-1">
		<p>Returns a random rotation in radians as a float/decimal value. Range: [0, 2*pi).</p>
	</DocSection>

	<DocReturns type="number">A decimal value from 0 up to (but not including) 2*pi.</DocReturns>
</template>
