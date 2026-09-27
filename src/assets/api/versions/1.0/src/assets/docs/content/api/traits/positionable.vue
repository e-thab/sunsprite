<script lang="ts">
export const meta = {
	title: 'Positionable',
	icon: 'tabler:scan-position',
	summary: "Controls an object's position in the world and on the screen.",
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>Adds position to an object: world x/y coordinates, the same point as a Vector2, the matching screen-relative coordinates, and helpers to measure distance and move.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="x" type="number">Horizontal position in the world.</DocProperty>
		<DocProperty name="y" type="number">Vertical position in the world.</DocProperty>
		<DocProperty name="position" type="Vector2">Position in the world.</DocProperty>
		<DocProperty name="pos" type="Vector2">Position in the world. Alias of position.</DocProperty>
		<DocProperty name="screenX" type="number">This object's horizontal position relative to the camera.</DocProperty>
		<DocProperty name="screenY" type="number">This object's vertical position relative to the camera.</DocProperty>
		<DocProperty name="screenPosition" type="Vector2">This object's position relative to the camera.</DocProperty>
		<DocProperty name="screenPos" type="Vector2">This object's position relative to the camera. Alias of screenPosition.</DocProperty>
	</DocProperties>

	<DocMethods>
		<DocMethod signature="distanceTo(x: number, y: number): number">The distance from this object to a point given as separate x and y values.</DocMethod>
		<DocMethod signature="distanceTo(other: Vector2Like): number">The distance from this object to another position.</DocMethod>
		<DocMethod signature="goTo(x: number, y: number): void">Set world position from separate x and y values.</DocMethod>
		<DocMethod signature="goTo(position: Vector2Like): void">Set world position from a Vector2-like object.</DocMethod>
		<DocMethod signature="goToRandom(): void">Set position to a random point within the current visible screen area.</DocMethod>
	</DocMethods>
</template>
