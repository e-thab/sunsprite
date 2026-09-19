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

	<DocMixins :paths="['api/traits/rotatable', 'api/traits/viewable', 'api/traits/timeable']" />

	<DocProperties>
		<DocProperty name="pointA" type="Vector2">Position of end point A.</DocProperty>
		<DocProperty name="pointB" type="Vector2">Position of end point B.</DocProperty>
		<DocProperty name="color" type="string">The color of the line.</DocProperty>
		<DocProperty name="thickness" type="number">The thickness of the line. Default 2.</DocProperty>
		<DocProperty name="length" type="number" readonly>The distance between point A and point B.</DocProperty>
		<DocProperty name="rotation" type="number" from="api/traits/rotatable">Rotation angle in degrees.</DocProperty>
		<DocProperty name="radians" type="number" from="api/traits/rotatable">Rotation angle in radians.</DocProperty>
		<DocProperty name="alpha" type="number" from="api/traits/viewable">Transparency, decimal value that ranges from 0.0 (transparent) to 1.0 (opaque).</DocProperty>
		<DocProperty name="layer" type="number" from="api/traits/viewable">The render order. Objects with higher layer values will show in front of objects with lower values.</DocProperty>
		<DocProperty name="visible" type="boolean" from="api/traits/viewable">Whether this object is currently visible.</DocProperty>
		<DocProperty name="age" type="number" from="api/traits/timeable" readonly>How long this object has existed, in seconds (not including paused time).</DocProperty>
		<DocProperty name="ageMs" type="number" from="api/traits/timeable" readonly>How long this object has existed, in milliseconds (not including paused time).</DocProperty>
	</DocProperties>

	<DocMethods>
		<DocMethod signature="setPoints(pointA: Vector2Like, pointB: Vector2Like): void">Set both endpoints of the line at once.</DocMethod>
		<DocMethod signature="show(): void" from="api/traits/viewable">Show this object.</DocMethod>
		<DocMethod signature="hide(): void" from="api/traits/viewable">Hide this object.</DocMethod>
	</DocMethods>

	<DocSnippet title="Example">
<pre>const divider = new Line({
    pointA: { x: -100, y: 0 },
    pointB: { x: 100, y: 0 },
    color: '#ffffff',
    thickness: 4,
})</pre>
	</DocSnippet>
</template>
