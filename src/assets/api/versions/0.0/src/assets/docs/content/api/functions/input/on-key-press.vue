<script lang="ts">
export const meta = {
	title: 'onKeyPress()',
	icon: 'tabler:keyboard',
	summary: 'Register functions to run when keys are first pressed.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>onKeyPress(actions: KeyAction): void</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Register input actions to run once each time a key is pressed.</p>
	</DocSection>

	<DocParams>
		<DocParam name="actions" type="KeyAction">An object whose keys are strings representing keyboard keys, and whose values are the functions that pressing that key should run.</DocParam>
	</DocParams>

	<DocRelated :paths="['api/functions/input/on-key-release', 'api/functions/input/on-key-hold']" />
</template>
