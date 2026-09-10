<script lang="ts">
export const meta = {
	title: 'keyJustReleased()',
	icon: 'tabler:keyboard',
	summary: 'True for one frame right after a key is released.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>keyJustReleased(key: string): boolean</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Returns true if the specified key is no longer pressed, and this is the first frame after release. Only true once when a key stops being held.</p>
	</DocSection>

	<DocParams>
		<DocParam name="key" type="string">The key to check.</DocParam>
	</DocParams>

	<DocReturns type="boolean">Whether this is the first frame after the key was released.</DocReturns>

	<DocRelated :paths="['api/functions/input/key-just-pressed']" />
</template>
