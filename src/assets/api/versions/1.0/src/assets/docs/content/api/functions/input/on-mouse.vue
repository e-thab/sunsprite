<script lang="ts">
export const meta = {
	title: 'onMouse()',
	icon: 'tabler:mouse',
	summary: 'Register functions for mouse/click events.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>onMouse(actions: MouseInputAction): void</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Register input actions to run once each time a mouse event is detected.</p>
	</DocSection>

	<DocParams>
		<DocParam name="actions" type="MouseInputAction">An object whose keys are strings representing mouse events, and whose values are the functions that activating that event should run.</DocParam>
	</DocParams>

	<DocRelated :paths="['api/traits/interactable']" />
</template>
