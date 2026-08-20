<script lang="ts">
export const meta = {
	title: 'onKeyHold()',
	icon: 'tabler:keyboard',
	summary: 'Register functions to run repeatedly while keys are held.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>onKeyHold(actions: KeyAction): void</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Register input actions to run repeatedly while a key is held.</p>
	</DocSection>

	<DocParams>
		<DocParam name="actions" type="KeyAction">An object whose keys are strings representing keyboard keys, and whose values are the functions that holding that key should run.</DocParam>
	</DocParams>

	<DocRelated :paths="['api/functions/input/key-pressed']" />
</template>
