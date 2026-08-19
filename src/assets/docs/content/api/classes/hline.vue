<script lang="ts">
export const meta = {
	title: 'HLine',
	icon: 'tabler:arrows-horizontal',
	summary: 'An infinitely long horizontal line.',
}

export default {}
</script>

<template>
	<DocSignature>new HLine(options?: HLineProps)</DocSignature>

	<DocSection id="content-1">
		<p>A straight, infinitely long horizontal line spanning the full width of the screen at a given y. The minimal case in this API — it composes only Viewable, nothing else.</p>
	</DocSection>

	<DocParams>
		<DocParam name="options" type="HLineProps" optional>Initial properties: y, color, thickness, plus any Viewable property.</DocParam>
	</DocParams>

	<DocProperties>
		<DocProperty name="y" type="number">The vertical position of the line.</DocProperty>
		<DocProperty name="color" type="string">The color of the line.</DocProperty>
		<DocProperty name="thickness" type="number">The thickness of the line.</DocProperty>
	</DocProperties>

	<DocMixins :paths="['api/traits/viewable']" />

	<DocExample>
<pre>const groundLine = new HLine({
    y: -150,
    color: '#33aa55',
})</pre>
	</DocExample>
</template>
