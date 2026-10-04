<script lang="ts">
export const meta = {
	title: 'Background',
	icon: 'tabler:wallpaper',
	summary: 'The color and image behind everything else in the game.',
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>A live reference to the game's background — a flat color, optionally with an image drawn over it. The background sits behind every other object regardless of their layer, so nothing you create can end up underneath it.</p>

		<p>A background with no image is just its color. Setting <code>image</code> adds one; <code>style</code> decides how that image is sized against the screen, and <code>canZoom</code> and <code>followCamera</code> decide how it reacts to the <DocLink to="api/globals/camera" /> moving.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="color" type="string" default="'#444444'">Color to fill the background with, as a hex string.</DocProperty>
		<DocProperty name="image" type="string | undefined" default="undefined">The background image's source — a file path, a URL, or the key of an image already loaded in the project. Setting it to undefined or null clears the image, the same as clearImage().</DocProperty>
		<DocProperty name="style" type="BackgroundStyle" default="'fill'">How the image is sized and placed against the screen. See Styles below.</DocProperty>
		<DocProperty name="canZoom" type="boolean" default="false">Whether the image honors camera zoom. When true it grows as you zoom in and shrinks as you zoom out; when false it stays the same size on screen no matter the zoom.</DocProperty>
		<DocProperty name="followCamera" type="boolean" default="true">Whether the image follows the camera. When true it stays put on screen as the camera moves; when false it's fixed in the world and scrolls away with everything else.</DocProperty>
		<DocProperty name="Styles" type="object" readonly>Every available style, for use with style — see the table below.</DocProperty>
	</DocProperties>

	<DocMethods>
		<DocMethod signature="set(props: BackgroundProps): void">Set any number of background properties at once. Anything left out of the object is unchanged.</DocMethod>
		<DocMethod signature="clearImage(): void">Remove the background image, leaving just the color.</DocMethod>
	</DocMethods>

	<DocProperties id="styles" title="Styles">
		<DocProperty name="Styles.Fill" type="'fill'">Size the image to cover the whole screen, keeping its aspect ratio. Overflow is cropped. This is the default.</DocProperty>
		<DocProperty name="Styles.Fit" type="'fit'">Size the image to fit entirely within the screen, keeping its aspect ratio. Leaves the background color showing on two sides unless the ratios match.</DocProperty>
		<DocProperty name="Styles.Stretch" type="'stretch'">Stretch the image to the screen's exact aspect ratio, distorting it if they differ.</DocProperty>
		<DocProperty name="Styles.Center" type="'center'">Place the image in the center at its original size, unaffected by screen size.</DocProperty>
		<DocProperty name="Styles.Tile" type="'tile'">Repeat the image in a grid at its original size. Not yet implemented — currently renders the same as Center.</DocProperty>
	</DocProperties>

	<DocSnippet title="Example">
<pre>Background.color = '#8b3a5b'

Background.set({
    image: 'sky.png',
    style: Background.Styles.Fit,
    followCamera: false,
})</pre>
	</DocSnippet>

	<DocRelated :paths="['api/globals/camera', 'api/colors', 'api/classes/sprite']" />
</template>
