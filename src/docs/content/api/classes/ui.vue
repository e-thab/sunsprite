<script lang="ts">
export const meta = {
	title: 'UI',
	icon: 'tabler:layout-dashboard',
	summary: 'Sprites, labels, shapes and lines that stay on the screen, unaffected by the camera.',
}

export default {}
</script>

<template>
	<DocUnderConstruction />

	<DocSnippet><pre>new UI.Sprite(options?: SpriteProps)
new UI.Label(options?: LabelProps)
new UI.Rectangle(options?: RectangleProps)
new UI.Circle(options?: CircleProps)
new UI.Line(options?: LineProps)</pre></DocSnippet>

	<DocSection id="content-1">
		<p>The UI version of each drawn class: a scoreboard, a health bar, a menu button. Each takes the same options and has the same members as its world class (<DocLink to="api/classes/sprite" />, <DocLink to="api/classes/label" />, <DocLink to="api/classes/rectangle" />, <DocLink to="api/classes/circle" />, <DocLink to="api/classes/line" />), with one difference: its position and size are in screen pixels, measured from the center of the screen, just like <DocLink to="api/globals/screen" />'s values.</p>

		<p>Moving or zooming the <DocLink to="api/globals/camera" /> never affects a UI object. A new one starts in the center of the screen at its normal size, and a <code>size: 24</code> label is 24 pixels tall however far the camera is zoomed. UI objects always show in front of world objects; <code>layer</code> orders them among each other.</p>
	</DocSection>

	<DocSection id="content-2">
		<p>Since a UI object is always on the screen, <code>pinned</code> is always true, and <code>pin()</code> and <code>unpin()</code> do nothing. Pinning is for a world object that only needs to stick to the screen for a while.</p>

		<p>Positions passed to a UI object are screen positions. When you pass it a world object instead, it uses where that object appears on the screen: <code>arrow.lookAt(planet)</code> points a UI arrow at a world planet, and <code>tag.goTo(enemy, 'bottomCenter')</code> puts a UI tag over an enemy. <code>distanceTo</code> and <code>orbit</code> work the same way, and so does the <DocLink to="api/globals/mouse" />.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="worldSpace" type="AlignableWorldSpace" readonly>This object's position, edges and corners in world coordinates: the spot in the world it's over, given where the camera is and how far it's zoomed. Setting them moves the object on the screen to match. The opposite of a world object's <code>screenSpace</code>.</DocProperty>
		<DocProperty name="screenSpace" type="AlignableScreenSpace" readonly>The same as this object's own position, edges and corners, since they're already relative to the screen. It's there so code that works with any object can use it on a UI object too.</DocProperty>
	</DocProperties>

	<DocSnippet title="Example">
<pre>const score = new UI.Label({ text: 'Score: 0', size: 24, alignH: 'left' })
score.goTo([Screen.left + 20, Screen.top - 20], 'topLeft')

const crosshair = new UI.Circle({ radius: 6 })

forever(() =&gt; {
    crosshair.goTo(Mouse)
    // The world position under the crosshair
    const target = crosshair.worldSpace.position
})</pre>
	</DocSnippet>

	<DocRelated :paths="['api/globals/screen', 'api/globals/camera', 'api/traits/alignable']" />
</template>
