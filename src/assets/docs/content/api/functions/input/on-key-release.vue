<script lang="ts">
export const meta = {
	title: 'onKeyRelease()',
	icon: 'tabler:keyboard',
	summary: 'Register functions to run when keys are released.',
}

export default {}
</script>

<template>
	<DocSignature>onKeyRelease(actions: KeyAction): void</DocSignature>

	<DocSection id="content-1">
		<p>Register input actions to run once each time a key is released.</p>
	</DocSection>

	<DocParams>
		<DocParam name="actions" type="KeyAction">An object whose keys are strings representing keyboard keys, and whose values are the functions that releasing that key should run.</DocParam>
	</DocParams>

	<DocRelated :paths="['api/functions/input/on-key-press']" />
</template>
