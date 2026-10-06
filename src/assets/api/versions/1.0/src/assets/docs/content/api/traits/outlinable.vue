<script lang="ts">
export const meta = {
	title: 'Outlinable',
	icon: 'tabler:border-style-2',
	summary: "Controls a shape's outline color, width, and opacity.",
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>Adds an outline to a shape. A shape starts with no outline; setting any one of the three properties draws one, filling the other two in with defaults (black, 5 pixels wide, fully opaque). Setting outlineColor to undefined or null clears the outline again, the same as calling clearOutline().</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="outlineColor" type="string">Outline color, as a hex string. Set to undefined or null to clear the outline.</DocProperty>
		<DocProperty name="outlineWidth" type="number">Outline width/thickness, in pixels.</DocProperty>
		<DocProperty name="outlineAlpha" type="number">Outline's opacity. Range of 0-1 where 0 is transparent and 1 is opaque.</DocProperty>
	</DocProperties>

	<DocMethods>
		<DocMethod signature="setOutline(color?: string, width?: number, alpha?: number): void">Set every outline property at once. Called with no arguments at all, it clears the outline.</DocMethod>
		<DocMethod signature="clearOutline(): void">Remove the outline. The fill stays visible if the shape had one.</DocMethod>
	</DocMethods>
</template>
