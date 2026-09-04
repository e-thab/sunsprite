<script lang="ts">
export const meta = {
	title: 'Random.pos()',
	icon: 'tabler:map-pin',
	summary: 'A random position within the screen. (alias for position)',
}

export default {}
</script>

<template>
	<DocSnippet><pre>Random.pos(): Vector2</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Returns a random position within the screen. Alias for Random.position().</p>
	</DocSection>

	<DocReturns type="Vector2">A random point within the visible screen area.</DocReturns>

	<DocRelated :paths="['api/functions/random/position']" />
</template>
