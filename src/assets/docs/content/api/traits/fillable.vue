<script lang="ts">
export const meta = {
	title: 'Fillable',
	icon: 'tabler:paint',
	summary: "Controls a shape's fill color.",
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>Adds a fill to a shape. Setting color to undefined or null clears the fill, the same as calling clearFill() — an outline, if the shape has one, stays visible either way.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="color" type="string">Fill color, as a hex string. Set to undefined or null to clear the fill.</DocProperty>
	</DocProperties>

	<DocMethods>
		<DocMethod signature="clearFill(): void">Remove the fill, making the shape transparent. Its outline stays visible if it had one.</DocMethod>
	</DocMethods>
</template>
