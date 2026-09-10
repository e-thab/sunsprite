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
		<p>The objects you can create and place in a game. Most compose the full GameObject trait set (position, size, rotation, mouse interaction, visibility, age); Line, VLine, and HLine compose a smaller, direct subset instead — see each class’s "Composed From" section.</p>
	</DocSection>
</template>
