<script lang="ts">
export const meta = {
	title: 'Input',
	icon: 'tabler:keyboard',
	summary: 'Keyboard and mouse input, checked or reacted to.',
	order: [
		'key-pressed',
		'key-just-pressed',
		'key-just-released',
		'on-key-press',
		'on-key-release',
		'on-key-hold',
		'on-mouse',
	],
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>Functions for reading keyboard state directly, or registering handlers that react to key and mouse events as they happen.</p>
	</DocSection>
</template>
