<script lang="ts">
export const meta = {
	title: 'HLine',
	icon: 'tabler:arrows-horizontal',
	summary: 'An infinitely long horizontal line.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>new HLine(options?: HLineProps)</pre></DocSnippet>

	<DocSection id="content-1">
		<p>A straight, infinitely long horizontal line spanning the full width of the screen at a given y. The minimal case in this API — it composes only Viewable and Timeable, nothing else.</p>
	</DocSection>

	<DocParams>
		<DocParam name="options" type="HLineProps" optional>Initial properties: y, color, thickness, plus any Viewable property.</DocParam>
	</DocParams>

	<DocMixins :paths="['api/traits/viewable', 'api/traits/timeable']" />

	<DocProperties>
		<DocProperty name="y" type="number">The vertical position of the line.</DocProperty>
		<DocProperty name="color" type="string">The color of the line.</DocProperty>
		<DocProperty name="thickness" type="number">The thickness of the line.</DocProperty>
		<DocProperty name="alpha" type="number" from="api/traits/viewable">Transparency, decimal value that ranges from 0.0 (transparent) to 1.0 (opaque).</DocProperty>
		<DocProperty name="layer" type="number" from="api/traits/viewable">The render order. Objects with higher layer values will show in front of objects with lower values.</DocProperty>
		<DocProperty name="visible" type="boolean" from="api/traits/viewable">Whether this object is currently visible.</DocProperty>
		<DocProperty name="age" type="number" from="api/traits/timeable" readonly>How long this object has existed, in seconds (not including paused time).</DocProperty>
		<DocProperty name="ageMs" type="number" from="api/traits/timeable" readonly>How long this object has existed, in milliseconds (not including paused time).</DocProperty>
	</DocProperties>

	<DocMethods>
		<DocMethod signature="show(): void" from="api/traits/viewable">Show this object.</DocMethod>
		<DocMethod signature="hide(): void" from="api/traits/viewable">Hide this object.</DocMethod>
	</DocMethods>

	<DocSnippet title="Example">
<pre>const groundLine = new HLine({
    y: -150,
    color: '#33aa55',
})</pre>
	</DocSnippet>
</template>
