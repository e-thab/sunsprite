<script lang="ts">
export const meta = {
	title: 'keysPressed',
	icon: 'tabler:keyboard',
	summary: 'An array of all keys currently pressed.',
}

export default {}
</script>

<template>
	<DocSignature>const keysPressed: string[]</DocSignature>

	<DocSection id="content-1">
		<p>An array of all keys currently pressed.</p>
	</DocSection>

	<DocRelated :paths="['api/functions/input/key-pressed']" />
</template>
