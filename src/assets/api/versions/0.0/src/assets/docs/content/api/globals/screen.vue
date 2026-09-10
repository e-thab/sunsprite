<script lang="ts">
export const meta = {
	title: 'Screen',
	icon: 'tabler:device-desktop',
	summary: 'The game screen reference.',
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>A live reference to the game screen’s current size and edges.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="width" type="number">Current width of the game screen.</DocProperty>
		<DocProperty name="height" type="number">Current height of the game screen.</DocProperty>
		<DocProperty name="top" type="number">Y coordinate of the top edge of the screen.</DocProperty>
		<DocProperty name="bottom" type="number">Y coordinate of the bottom edge of the screen.</DocProperty>
		<DocProperty name="left" type="number">X coordinate of the left edge of the screen.</DocProperty>
		<DocProperty name="right" type="number">X coordinate of the right edge of the screen.</DocProperty>
		<DocProperty name="center" type="Point">Point at the center of the screen.</DocProperty>
	</DocProperties>
</template>
