<script lang="ts">
export const meta = {
	title: 'Sizable',
	icon: 'tabler:resize',
	summary: "Controls an object's width, height, and scale.",
}

export default {}
</script>

<template>
	<DocUnderConstruction />

	<DocSection id="content-1">
		<p>Adds size to an object: explicit width and height in pixels, plus a uniform scale multiplier.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="width" type="number">Horizontal size in pixels.</DocProperty>
		<DocProperty name="height" type="number">Vertical size in pixels.</DocProperty>
		<DocProperty name="scale" type="number">Factor to multiply size by. Setting scale to 2 will double its size; 0.5 will halve it.</DocProperty>
		<DocProperty name="pinned" type="boolean">Whether this object stays the same size on the screen as the camera zooms. Resizing a pinned object keeps it pinned at its new size.</DocProperty>
	</DocProperties>

	<DocMethods>
		<DocMethod signature="pin(): void">Keep this object the same size on the screen, whatever its size is right now, as the camera zooms.</DocMethod>
		<DocMethod signature="unpin(): void">Stop keeping this object the same size on the screen. It keeps its current size in the world.</DocMethod>
	</DocMethods>
</template>
