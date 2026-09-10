<script lang="ts">
export const meta = {
	title: 'Line',
	icon: 'tabler:line',
	summary: 'A straight line between two points.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>new Line(options?: LineProps)</pre></DocSnippet>

	<DocSection id="content-1">
		<p>A straight line from point A to point B. Unlike Sprite/Rectangle/Circle/Label, Line does not compose GameObject — it has no x/y/width/height/draggable of its own, since its position is defined entirely by its two endpoints.</p>
	</DocSection>

	<DocParams>
		<DocParam name="options" type="LineProps" optional>Initial properties: pointA, pointB, color, thickness, plus any Rotatable/Viewable property.</DocParam>
	</DocParams>

	<DocProperties>
		<DocProperty name="pointA" type="Vector2">Position of end point A.</DocProperty>
		<DocProperty name="pointB" type="Vector2">Position of end point B.</DocProperty>
		<DocProperty name="color" type="string">The color of the line.</DocProperty>
		<DocProperty name="thickness" type="number">The thickness of the line. Default 2.</DocProperty>
	</DocProperties>

	<DocMixins :paths="['api/traits/rotatable', 'api/traits/timeable', 'api/traits/viewable']" />

	<DocSnippet title="Example">
<pre>const divider = new Line({
    pointA: { x: -100, y: 0 },
    pointB: { x: 100, y: 0 },
    color: '#ffffff',
    thickness: 4,
})</pre>
	</DocSnippet>
</template>
