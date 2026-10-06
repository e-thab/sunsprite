<script lang="ts">
export const meta = {
	title: 'Camera',
	icon: 'tabler:camera',
	summary: 'The view onto the world: pan, zoom, shake, and follow.',
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>A live reference to the camera — the window your game is viewed through. Moving it scrolls the world past the screen; zooming it changes how much of the world fits on screen.</p>

		<p>Camera and <DocLink to="api/globals/screen" /> measure two different things, and the difference matters once you zoom. Screen reports the viewport in real display pixels, and never changes when the camera does. Camera reports the same viewport in <em>world</em> coordinates, so its size and edges move as you pan and zoom. At a zoom of 1 the two agree; zoomed in to 2, the camera covers half as much world as the screen has pixels.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="x" type="number" default="0">Horizontal position of the camera in the world.</DocProperty>
		<DocProperty name="y" type="number" default="0">Vertical position of the camera in the world.</DocProperty>
		<DocProperty name="position" type="Vector2">Position of the camera in the world.</DocProperty>
		<DocProperty name="pos" type="Vector2">Position of the camera in the world. Alias of position.</DocProperty>
		<DocProperty name="zoom" type="number" default="1">How far the camera is zoomed in. Values above 1 zoom in (the world looks bigger, less of it fits on screen); values below 1 zoom out.</DocProperty>
		<DocProperty name="width" type="number" readonly>Width of the visible area, in world units — the screen width divided by zoom.</DocProperty>
		<DocProperty name="height" type="number" readonly>Height of the visible area, in world units — the screen height divided by zoom.</DocProperty>
		<DocProperty name="top" type="number" readonly>Y coordinate of the top edge of the visible area.</DocProperty>
		<DocProperty name="bottom" type="number" readonly>Y coordinate of the bottom edge of the visible area.</DocProperty>
		<DocProperty name="left" type="number" readonly>X coordinate of the left edge of the visible area.</DocProperty>
		<DocProperty name="right" type="number" readonly>X coordinate of the right edge of the visible area.</DocProperty>
		<DocProperty name="following" type="object">The object the camera is currently following, or undefined when it isn't following anything. Set it with follow() rather than directly.</DocProperty>
	</DocProperties>

	<DocMethods>
		<DocMethod signature="zoomToward(pos: Vector2Like, factor: number): void">Multiply the current zoom by factor while keeping the given world position where it is on screen — a factor of 2 doubles the zoom, 0.5 halves it. This is the zoom you want for "zoom in on that spot" rather than "zoom in on the middle".</DocMethod>
		<DocMethod signature="zoomTowardMouse(factor: number): void">Same as zoomToward, anchored on the mouse's current world position.</DocMethod>
		<DocMethod signature="easeTo(pos: Vector2Like, duration?: number): void">Glide the camera to a world position instead of jumping there. Duration is in milliseconds, defaulting to 1000.</DocMethod>
		<DocMethod signature="follow(gameObject: object): void">Keep the camera centered on an object as it moves, easing rather than snapping. The object is remembered on following until stopFollow() is called.</DocMethod>
		<DocMethod signature="stopFollow(): void">Stop following, leaving the camera wherever it currently is.</DocMethod>
		<DocMethod signature="shake(duration?: number, intensity?: number, callback?: Function): void">Shake the camera. Duration is in seconds (default 1) and intensity scales how far it moves (default 1). The callback runs when the shake finishes.</DocMethod>
		<DocMethod signature="reset(): void">Move the camera back to the origin at a zoom of 1.</DocMethod>
	</DocMethods>

	<DocSnippet title="Example">
<pre>const crab = new Sprite({ src: 'crab.png' })
camera.follow(crab)

onKeyPress({
    Space: () =&gt; camera.shake(),
})

onMouse({
    Scroll: (x, y) =&gt; camera.zoomTowardMouse(y &gt; 0 ? 1.1 : 0.9),
})</pre>
	</DocSnippet>

	<DocRelated :paths="['api/globals/screen', 'api/globals/mouse', 'api/classes/vector2']" />
</template>
