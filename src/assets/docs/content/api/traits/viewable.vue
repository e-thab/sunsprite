<script lang="ts">
export const meta = {
	title: 'Viewable',
	icon: 'tabler:eye',
	summary: "Controls an object's transparency, render order, and visibility.",
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>Adds display control to an object: transparency, render order, and whether it is drawn at all.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="alpha" type="number">Transparency, decimal value that ranges from 0.0 (transparent) to 1.0 (opaque).</DocProperty>
		<DocProperty name="layer" type="number">The render order. Objects with higher layer values will show in front of objects with lower values.</DocProperty>
		<DocProperty name="visible" type="boolean">Whether this object is currently visible.</DocProperty>
	</DocProperties>

	<DocMethods>
		<DocMethod signature="show(): void">Show this object.</DocMethod>
		<DocMethod signature="hide(): void">Hide this object.</DocMethod>
	</DocMethods>
</template>
