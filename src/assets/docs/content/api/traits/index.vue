<script lang="ts">
export const meta = {
	title: 'Shared Traits',
	icon: 'tabler:puzzle',
	summary: 'The reusable building blocks composed into every drawable class.',
	order: [
		'game-object',
		'positionable',
		'alignable',
		'sizable',
		'rotatable',
		'viewable',
		'interactable',
		'timeable',
		'fillable',
		'outlinable',
	],
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>Every drawable class (Sprite, Rectangle, Circle, Line, VLine, HLine, Label) is built by composing a subset of these shared traits, rather than each redeclaring the same properties. A class page lists every member it ends up with, inherited ones included, each marked with the trait that declares it — these pages are where a trait's members are defined once, and where that marker links to.</p>

		<p>Two of them are shape-only: Fillable and Outlinable are composed by Shape, which is what Rectangle and Circle are built from — GameObject's traits plus a fill and an outline.</p>
	</DocSection>
</template>
