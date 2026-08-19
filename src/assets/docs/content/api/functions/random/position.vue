<script lang="ts">
export const meta = {
	title: 'Random.position()',
	icon: 'tabler:map-pin',
	summary: 'A random position within the screen.',
}

export default {}
</script>

<template>
	<DocSignature>Random.position(): Point</DocSignature>

	<DocSection id="content-1">
		<p>Returns a random position within the screen.</p>
	</DocSection>

	<DocReturns type="Point">A random point within the visible screen area.</DocReturns>

	<DocRelated :paths="['api/functions/random/pos']" />
</template>
