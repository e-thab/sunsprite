<script lang="ts">
export const meta = {
	title: 'Alignable',
	icon: 'tabler:layout-align-left',
	summary: "Reads and sets an object's edges and corners.",
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>Adds edge and corner handles to an object: each of its four edges as a single coordinate, and each of its corner and edge-center points as a Vector2. All of them are settable as well as readable, so moving an object by its right edge or its top left corner takes one assignment. Alignable also replaces the goTo() Positionable declares, adding an anchor argument that picks which of those points lands on the given position.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="left" type="number">X coordinate at the left edge of this object.</DocProperty>
		<DocProperty name="right" type="number">X coordinate at the right edge of this object.</DocProperty>
		<DocProperty name="top" type="number">Y coordinate at the top edge of this object.</DocProperty>
		<DocProperty name="bottom" type="number">Y coordinate at the bottom edge of this object.</DocProperty>
		<DocProperty name="topLeft" type="Vector2">Position at the top left corner of this object.</DocProperty>
		<DocProperty name="topCenter" type="Vector2">Position at the top edge in the horizontal center of this object.</DocProperty>
		<DocProperty name="topRight" type="Vector2">Position at the top right corner of this object.</DocProperty>
		<DocProperty name="bottomLeft" type="Vector2">Position at the bottom left corner of this object.</DocProperty>
		<DocProperty name="bottomCenter" type="Vector2">Position at the bottom edge in the horizontal center of this object.</DocProperty>
		<DocProperty name="bottomRight" type="Vector2">Position at the bottom right corner of this object.</DocProperty>
		<DocProperty name="centerLeft" type="Vector2">Position at the vertical center of the left edge of this object.</DocProperty>
		<DocProperty name="centerRight" type="Vector2">Position at the vertical center of the right edge of this object.</DocProperty>
	</DocProperties>

	<DocMethods>
		<DocMethod signature="goTo(x: number, y: number): void">Set world position from separate x and y values.</DocMethod>
		<DocMethod signature="goTo(other: Vector2Like, anchor?: AnchorPoint): void">Set world position from a Vector2-like object. The anchor picks which of this object's own points is placed there — with 'topleft', its top left corner lands on the given position.</DocMethod>
	</DocMethods>
</template>
