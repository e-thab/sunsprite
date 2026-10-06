<script lang="ts">
export const meta = {
	title: 'Classes',
	icon: 'tabler:triangle-square-circle',
	summary: 'The things you create with new: sprites, shapes, lines, text, sounds, and timers.',
	order: ['sprite', 'rectangle', 'circle', 'line', 'vline', 'hline', 'label', 'sound', 'timer', 'vector2'],
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>Everything you make with <code>new</code>. Most of these are objects you place in a game, and compose the full GameObject trait set (position, alignment, size, rotation, mouse interaction, visibility, age); Rectangle and Circle add a fill and an outline on top of it, while Line, VLine, and HLine compose a smaller, direct subset instead. Each class page lists every member it ends up with, inherited ones included, marked with the trait it comes from.</p>

		<p>Sound and Timer are classes too, but nothing about them is drawn — a Sound plays an audio file, and a Timer measures elapsed time. Neither composes any trait, so each page lists only its own members.</p>
	</DocSection>
</template>
