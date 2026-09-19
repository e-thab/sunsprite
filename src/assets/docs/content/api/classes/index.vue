<script lang="ts">
export const meta = {
	title: 'Classes',
	icon: 'tabler:triangle-square-circle',
	summary: 'The drawable objects: sprites, shapes, lines, and text.',
	order: ['sprite', 'rectangle', 'circle', 'line', 'vline', 'hline', 'label', 'vector2'],
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>The objects you can create and place in a game. Most compose the full GameObject trait set (position, alignment, size, rotation, mouse interaction, visibility, age); Rectangle and Circle add a fill and an outline on top of it, while Line, VLine, and HLine compose a smaller, direct subset instead. Each class page lists every member it ends up with, inherited ones included, marked with the trait it comes from.</p>
	</DocSection>
</template>
