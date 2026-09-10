<script lang="ts">
export const meta = {
	title: 'keyJustPressed()',
	icon: 'tabler:keyboard',
	summary: 'True for one frame when a key starts being held.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>keyJustPressed(key: string): boolean</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Returns true if the specified key is pressed, and this is the first frame that it’s being held. Only true once when a key starts being held.</p>
	</DocSection>

	<DocParams>
		<DocParam name="key" type="string">The key to check.</DocParam>
	</DocParams>

	<DocReturns type="boolean">Whether this is the first frame the key is held down.</DocReturns>

	<DocRelated :paths="['api/functions/input/key-pressed', 'api/functions/input/key-just-released']" />
</template>
