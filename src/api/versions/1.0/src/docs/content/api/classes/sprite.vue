<script lang="ts">
export const meta = {
	title: 'Sprite',
	icon: 'tabler:photo',
	summary: 'An image-based game object.',
}

export default {}
</script>

<template>
	<DocUnderConstruction />

	<DocSnippet><pre>new Sprite(options?: SpriteProps)</pre></DocSnippet>
	
	<DocSection id="content-1">
		<p>A sprite is a game object that displays an image. The image can be set from a few different sources:</p>
		<dl>
			<dt>Adding an image from project files</dt>
			<dd>
				<p>
					You can use any image you've uploaded to your project as a sprite's image source by using its filename and extension as the sprite's src property.
					If no file is found with that name, the editor will show an error message.
				</p>
				<DocSnippet style="margin: 0.4em 0"><pre>new Sprite({ src: 'cool_pic.png' }) // Uploaded from the computer </pre></DocSnippet>
			</dd>

			<dt>Adding an image from the asset library</dt>
			<dd>
				<p>You can use images from the asset library by opening the library panel, finding the image you want, and pressing the 'Add to project' button on the right side.</p>
				<p>
					The file with will be added to your project file tree with a Library badge and can be renamed to whatever you want.
					Library assets don't use project storage space because they're hosted on Sunsprite's server using our storage.
				</p>
				<DocSnippet style="margin: 0.4em 0"><pre>new Sprite({ src: 'noise01.png' }) // From images/planets/parts </pre></DocSnippet>
			</dd>

			<dt>Adding an image from a URL</dt>
			<dd>
				<p>...</p>
				<p>...</p>
			</dd>
		</dl>
	</DocSection>

	<DocParams>
		<DocParam name="options" type="SpriteProps" optional>Initial properties: any GameObject property (x, y, width, height, scale, rotation, alpha, layer, visible, draggable, cursor, mouse event handlers) plus src.</DocParam>
	</DocParams>

	<DocMixins :paths="['api/traits/game-object']" />

	<DocProperties>
		<DocProperty name="src" type="string">The sprite's image: the name of an image file in your project, like <code>'player.png'</code>, or a URL. Names are case-sensitive.<br>If you don't set this, a placeholder wireframe square is shown.</DocProperty>
		<DocProperty name="tint" type="string">Color to tint the sprite with, as a hex string. Setting it tints the whole sprite one color; reading it gives the most recent tint color set.</DocProperty>
		<DocProperty name="tintMode" type="TintMode">How the tint color is combined with the sprite's image. Not case-sensitive.</DocProperty>
		<DocProperty name="tintTopLeft" type="string">Tint color at the top left corner. Corner colors blend into each other across the sprite.</DocProperty>
		<DocProperty name="tintTopRight" type="string">Tint color at the top right corner.</DocProperty>
		<DocProperty name="tintBottomLeft" type="string">Tint color at the bottom left corner.</DocProperty>
		<DocProperty name="tintBottomRight" type="string">Tint color at the bottom right corner.</DocProperty>
		<DocProperty name="isTinted" type="boolean" readonly>Whether this sprite is currently tinted with a color.</DocProperty>
		<DocProperty name="x" type="number" from="api/traits/positionable">Horizontal position in the world.</DocProperty>
		<DocProperty name="y" type="number" from="api/traits/positionable">Vertical position in the world.</DocProperty>
		<DocProperty name="position" type="Vector2" from="api/traits/positionable">Position in the world.</DocProperty>
		<DocProperty name="pos" type="Vector2" from="api/traits/positionable">Position in the world. Alias of position.</DocProperty>
		<DocProperty name="screenX" type="number" from="api/traits/positionable">This object's horizontal position relative to the camera.</DocProperty>
		<DocProperty name="screenY" type="number" from="api/traits/positionable">This object's vertical position relative to the camera.</DocProperty>
		<DocProperty name="screenPosition" type="Vector2" from="api/traits/positionable">This object's position relative to the camera.</DocProperty>
		<DocProperty name="screenPos" type="Vector2" from="api/traits/positionable">This object's position relative to the camera. Alias of screenPosition.</DocProperty>
		<DocProperty name="left" type="number" from="api/traits/alignable">X coordinate at the left edge of this object.</DocProperty>
		<DocProperty name="right" type="number" from="api/traits/alignable">X coordinate at the right edge of this object.</DocProperty>
		<DocProperty name="top" type="number" from="api/traits/alignable">Y coordinate at the top edge of this object.</DocProperty>
		<DocProperty name="bottom" type="number" from="api/traits/alignable">Y coordinate at the bottom edge of this object.</DocProperty>
		<DocProperty name="topLeft" type="Vector2" from="api/traits/alignable">Position at the top left corner of this object.</DocProperty>
		<DocProperty name="topCenter" type="Vector2" from="api/traits/alignable">Position at the top edge in the horizontal center of this object.</DocProperty>
		<DocProperty name="topRight" type="Vector2" from="api/traits/alignable">Position at the top right corner of this object.</DocProperty>
		<DocProperty name="bottomLeft" type="Vector2" from="api/traits/alignable">Position at the bottom left corner of this object.</DocProperty>
		<DocProperty name="bottomCenter" type="Vector2" from="api/traits/alignable">Position at the bottom edge in the horizontal center of this object.</DocProperty>
		<DocProperty name="bottomRight" type="Vector2" from="api/traits/alignable">Position at the bottom right corner of this object.</DocProperty>
		<DocProperty name="centerLeft" type="Vector2" from="api/traits/alignable">Position at the vertical center of the left edge of this object.</DocProperty>
		<DocProperty name="centerRight" type="Vector2" from="api/traits/alignable">Position at the vertical center of the right edge of this object.</DocProperty>
		<DocProperty name="width" type="number" from="api/traits/sizable">Horizontal size in pixels.</DocProperty>
		<DocProperty name="height" type="number" from="api/traits/sizable">Vertical size in pixels.</DocProperty>
		<DocProperty name="scale" type="number" from="api/traits/sizable">Factor to multiply size by. Setting scale to 2 will double its size; 0.5 will halve it.</DocProperty>
		<DocProperty name="rotation" type="number" from="api/traits/rotatable">Rotation angle in degrees.</DocProperty>
		<DocProperty name="radians" type="number" from="api/traits/rotatable">Rotation angle in radians.</DocProperty>
		<DocProperty name="alpha" type="number" from="api/traits/viewable">Transparency, decimal value that ranges from 0.0 (transparent) to 1.0 (opaque).</DocProperty>
		<DocProperty name="layer" type="number" from="api/traits/viewable">The render order. Objects with higher layer values will show in front of objects with lower values.</DocProperty>
		<DocProperty name="visible" type="boolean" from="api/traits/viewable">Whether this object is currently visible.</DocProperty>
		<DocProperty name="draggable" type="boolean" from="api/traits/interactable">Whether this object can be dragged with the mouse.</DocProperty>
		<DocProperty name="cursor" type="Cursor" from="api/traits/interactable">The cursor shown when the mouse is over this object.</DocProperty>
		<DocProperty name="age" type="number" from="api/traits/timeable" readonly>How long this object has existed, in seconds (not including paused time).</DocProperty>
		<DocProperty name="ageMs" type="number" from="api/traits/timeable" readonly>How long this object has existed, in milliseconds (not including paused time).</DocProperty>
		<DocProperty name="isDestroyed" type="boolean" from="api/traits/destructible">Whether this object has been destroyed.</DocProperty>
	</DocProperties>

	<DocMethods>
		<DocMethod signature="setTint(color: string): void">Tint the whole sprite one color.</DocMethod>
		<DocMethod signature="setTint(topLeft: string, topRight?: string, bottomLeft?: string, bottomRight?: string): void">Tint each corner a different color, blending between them across the sprite. Any corner left out uses the top left color.</DocMethod>
		<DocMethod signature="clearTint(): void">Remove the tint, resetting every tint color to white and tintMode to 'multiply'.</DocMethod>
		<DocMethod signature="hideTint(): void">Stop drawing the tint without forgetting it. Use showTint() to bring it back.</DocMethod>
		<DocMethod signature="showTint(): void">Draw the tint again after hideTint().</DocMethod>
		<DocMethod signature="distanceTo(x: number, y: number): number" from="api/traits/positionable">The distance from this object to a point given as separate x and y values.</DocMethod>
		<DocMethod signature="distanceTo(other: Vector2Like): number" from="api/traits/positionable">The distance from this object to another position.</DocMethod>
		<DocMethod signature="goToRandom(): void" from="api/traits/positionable">Set position to a random point within the current visible screen area.</DocMethod>
		<DocMethod signature="goTo(x: number, y: number): void" from="api/traits/alignable">Set world position from separate x and y values.</DocMethod>
		<DocMethod signature="goTo(other: Vector2Like, anchor?: AnchorPoint): void" from="api/traits/alignable">Set world position from a Vector2-like object. The anchor picks which of this object's own points is placed there — with 'topleft' (or 'topLeft'; either casing is accepted), its top left corner lands on the given position.</DocMethod>
		<DocMethod signature="show(): void" from="api/traits/viewable">Show this object.</DocMethod>
		<DocMethod signature="hide(): void" from="api/traits/viewable">Hide this object.</DocMethod>
		<DocMethod signature="onMouse(actions: MouseInputAction): void" from="api/traits/interactable">Register several mouse handlers at once, as an object whose keys are mouse event names and whose values are the functions to run.</DocMethod>
		<DocMethod signature="onClick(action?: PointerAction): void" from="api/traits/interactable">Captures any pointer down event, either left or right mouse button.</DocMethod>
		<DocMethod signature="onRelease(action?: PointerAction): void" from="api/traits/interactable">Captures any pointer release event, either left or right mouse button.</DocMethod>
		<DocMethod signature="onDoubleClick(action?: PointerAction): void" from="api/traits/interactable">Captures only left button double clicks (two left clicks within 500ms).</DocMethod>
		<DocMethod signature="onLeftClick(action?: PointerAction): void" from="api/traits/interactable">Captures only left button press.</DocMethod>
		<DocMethod signature="onLeftRelease(action?: PointerAction): void" from="api/traits/interactable">Captures only left button release.</DocMethod>
		<DocMethod signature="onRightClick(action?: PointerAction): void" from="api/traits/interactable">Captures only right button press.</DocMethod>
		<DocMethod signature="onRightRelease(action?: PointerAction): void" from="api/traits/interactable">Captures only right button release.</DocMethod>
		<DocMethod signature="onMiddleClick(action?: PointerAction): void" from="api/traits/interactable">Captures only middle button press.</DocMethod>
		<DocMethod signature="onMiddleRelease(action?: PointerAction): void" from="api/traits/interactable">Captures only middle button release.</DocMethod>
		<DocMethod signature="onMouseEnter(action?: PointerAction): void" from="api/traits/interactable">Captures the pointer entering the object.</DocMethod>
		<DocMethod signature="onMouseExit(action?: PointerAction): void" from="api/traits/interactable">Captures the pointer exiting the object.</DocMethod>
		<DocMethod signature="onMouseMove(action?: PointerAction): void" from="api/traits/interactable">Captures the pointer moving while overlapping the object.</DocMethod>
		<DocMethod signature="onDrag(action?: PointerAction): void" from="api/traits/interactable">Captures the pointer dragging the object.</DocMethod>
		<DocMethod signature="onDragStart(action?: PointerAction): void" from="api/traits/interactable">Captures the beginning of the drag event.</DocMethod>
		<DocMethod signature="onDragEnd(action?: PointerAction): void" from="api/traits/interactable">Captures the end of the drag event.</DocMethod>
		<DocMethod signature="onScroll(action?: ScrollAction): void" from="api/traits/interactable">Captures scroll events while hovering over this object.</DocMethod>
		<DocMethod signature="resetCursor(): void" from="api/traits/interactable">Set this object's hover cursor back to the default pointer.</DocMethod>
		<DocMethod signature="destroy(): void" from="api/traits/destructible">Remove this object from the game. Does not clear any variables it is assigned to or remove it from any arrays it belongs to.</DocMethod>
	</DocMethods>

	<DocProperties id="tint-modes" title="Tint Modes">
		<DocProperty name="'multiply'" type="TintModeName">The tint color is multiplied with the image's color, darkening it. This is the default.</DocProperty>
		<DocProperty name="'add'" type="TintModeName">The tint color is added to the image's color, brightening it.</DocProperty>
		<DocProperty name="'fill'" type="TintModeName">The image is filled with the solid tint color, keeping only its shape.</DocProperty>
		<DocProperty name="'screen'" type="TintModeName">Brightens the image's dark areas.</DocProperty>
		<DocProperty name="'overlay'" type="TintModeName">Brightens the image's light areas and darkens its dark areas.</DocProperty>
		<DocProperty name="'hard_light'" type="TintModeName">Like 'overlay', but with the tint and image colors swapped.</DocProperty>
	</DocProperties>

	<DocSnippet title="Example">
<pre>const bunny = new Sprite({
    src: 'https://pixijs.com/assets/bunny.png',
    x: 200,
})

forever(delta =&gt; {
    bunny.rotation += 2
})</pre>
	</DocSnippet>

	<DocSnippet title="Tinting">
<pre>const ghost = new Sprite({ src: 'ghost.png' })

// Flash red when clicked
ghost.onClick(() =&gt; {
    ghost.tint = Colors.Red
    after(0.2, () =&gt; ghost.clearTint())
})

// A gradient from top to bottom
ghost.setTint('#ffffff', '#ffffff', '#3399ff', '#3399ff')</pre>
	</DocSnippet>
</template>

<style scoped>
dd + dt {
	margin-top: 0.6em;
}
dl dt {
	font-weight: 600;
	font-size: 1.25em;
}
dd p + p {
	margin-top: 0.6em;
	/* text-indent: 1em; */
}
dd {
	margin-left: 1em;
}
dd p {
	line-height: 2em;
}
/* dl {
	margin-left: 1em;
} */
</style>
