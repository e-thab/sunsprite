<script lang="ts">
export const meta = {
	title: 'Positionable',
	icon: 'tabler:scan-position',
	summary: 'Controls an object\'s position in the world.',
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>Adds world position to an object: x/y coordinates, a combined point, and helpers to move to a specific or random spot.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="x" type="number">Horizontal position in the world.</DocProperty>
		<DocProperty name="y" type="number">Vertical position in the world.</DocProperty>
		<DocProperty name="pos" type="Vector2">Position in the world. Alias of position.</DocProperty>
		<DocProperty name="position" type="Vector2">Position in the world.</DocProperty>
	</DocProperties>

	<DocMethods>
		<DocMethod signature="goTo(x: number, y: number): void">Set world position from separate x and y values.</DocMethod>
		<DocMethod signature="goTo(position: Vector2Like): void">Set world position from a Vector2-like object.</DocMethod>
		<DocMethod signature="goToRandom(): void">Set position to a random point within the current visible screen area.</DocMethod>
	</DocMethods>
</template>
