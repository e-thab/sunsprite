<script lang="ts">
export const meta = {
	title: 'Shared Traits',
	icon: 'tabler:puzzle',
	summary: 'The reusable building blocks composed into every drawable class.',
	order: [
		'game-object',
		'positionable',
		'sizable',
		'rotatable',
		'viewable',
		'interactable',
		'timeable',
	],
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>Every drawable class (Sprite, Rectangle, Circle, Line, VLine, HLine, Label) is built by composing a subset of these shared traits, rather than each redeclaring the same properties. A class page lists exactly which traits it composes under "Composed From" — click through to see that trait’s own members instead of finding them duplicated on every class.</p>
	</DocSection>
</template>
