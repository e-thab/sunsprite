<script lang="ts">
export const meta = {
	title: 'VLine',
	icon: 'tabler:arrows-vertical',
	summary: 'An infinitely long vertical line.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>new VLine(options?: VLineProps)</pre></DocSnippet>

	<DocSection id="content-1">
		<p>A straight, infinitely long vertical line spanning the full height of the screen at a given x. Like HLine, it composes only Viewable.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="x" type="number">The horizontal position of the line.</DocProperty>
		<DocProperty name="color" type="string">The color of the line.</DocProperty>
		<DocProperty name="thickness" type="number">The thickness of the line.</DocProperty>
	</DocProperties>

	<DocMixins :paths="['api/traits/viewable']" />
</template>
