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
		<p>A live reference to the game screen's current size and edges, in real display pixels. These values change when the game panel is resized, and never when the <DocLink to="api/globals/camera" /> moves or zooms — for the edges of what the camera can currently see in world coordinates, use the camera's own size and edges instead.</p>

		<p>The origin sits at the center of the screen, so <code>left</code> and <code>bottom</code> are negative while <code>right</code> and <code>top</code> are positive.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="width" type="number" readonly>Current width of the game screen in pixels.</DocProperty>
		<DocProperty name="height" type="number" readonly>Current height of the game screen in pixels.</DocProperty>
		<DocProperty name="top" type="number" readonly>Y coordinate of the top edge of the screen.</DocProperty>
		<DocProperty name="bottom" type="number" readonly>Y coordinate of the bottom edge of the screen.</DocProperty>
		<DocProperty name="left" type="number" readonly>X coordinate of the left edge of the screen.</DocProperty>
		<DocProperty name="right" type="number" readonly>X coordinate of the right edge of the screen.</DocProperty>
	</DocProperties>

	<DocSnippet title="Example">
<pre>const crab = new Sprite({ src: 'crab.png' })

forever(() =&gt; {
    crab.x += 5
    if (crab.x &gt; Screen.right) crab.x = Screen.left
})</pre>
	</DocSnippet>

	<DocRelated :paths="['api/globals/camera', 'api/globals/mouse']" />
</template>
