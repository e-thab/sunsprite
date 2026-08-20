<script lang="ts">
export const meta = {
	title: 'keyPressed()',
	icon: 'tabler:keyboard',
	summary: 'Whether a key is currently held down.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>keyPressed(key: string): boolean</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Returns true if the specified key is currently pressed. Will repeatedly be true while the key is held.</p>
	</DocSection>

	<DocParams>
		<DocParam name="key" type="string">The key to check.</DocParam>
	</DocParams>

	<DocReturns type="boolean">Whether the key is currently held down.</DocReturns>

	<DocRelated :paths="['api/functions/input/key-just-pressed', 'api/functions/input/on-key-hold']" />
</template>
