<script lang="ts">
export const meta = {
	title: 'Sprite',
	icon: 'tabler:photo',
	summary: 'An image-based game object.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>new Sprite(options?: SpriteProps)</pre></DocSnippet>
	
	<DocSection id="content-1">
		<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque quis finibus felis. Duis vestibulum aliquam suscipit. Curabitur elementum egestas lacinia. Nam rhoncus velit nisi. Nulla et augue tristique odio blandit convallis. Integer rutrum ornare malesuada. Sed vehicula rutrum consectetur.</p>

		<p>In mattis massa in accumsan consequat. Aenean pretium sapien tortor, quis hendrerit eros fringilla et. Ut in augue libero. Vivamus sit amet lobortis augue, sit amet auctor elit. Aliquam massa arcu, euismod at pharetra aliquet, congue aliquet eros. Pellentesque ut malesuada sapien, eget ultrices tortor. Morbi posuere elementum ligula eu ornare.</p>
	
		<p>Sed lobortis libero in nisi semper porttitor. Fusce vestibulum urna sem, sed mollis lorem finibus ultrices. Fusce in blandit lacus. Maecenas eu porta dui. Vivamus eu blandit odio, eu scelerisque neque. Fusce pellentesque semper ligula et convallis. Nunc fermentum nunc vitae nisi tristique, non imperdiet ligula viverra. Nulla facilisis erat dignissim est egestas, ut dapibus quam pretium.</p>
	
		<p>Donec tempus, magna sit amet fringilla accumsan, ante diam vestibulum libero, a fermentum tortor purus ac urna. Vivamus commodo mollis nibh eget maximus. Fusce viverra massa ut orci blandit, a ornare nulla varius. Aenean vehicula facilisis interdum. In quam massa, vestibulum vel finibus ac, lobortis non nisl. Maecenas imperdiet arcu purus, a consequat justo tempus quis. Morbi tincidunt lacinia justo eget fermentum. Pellentesque non aliquam libero.</p>
	
		<p>Sed elementum auctor efficitur. Cras pharetra, sem ultricies suscipit condimentum, ligula ligula egestas leo, vitae feugiat urna neque ac urna. Aenean sodales dolor arcu, non auctor libero posuere non. Curabitur auctor laoreet risus non cursus. Donec mi mi, vulputate quis felis a, pulvinar convallis tortor. Vivamus id porttitor lorem, a congue metus. Integer varius nisl id velit elementum, a placerat lacus condimentum. Sed quis mi velit. Vestibulum blandit mattis lectus vitae aliquet. Morbi tincidunt vehicula lacinia.</p>
	
		<p>Donec eleifend elit nec libero ultrices fermentum. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Nulla mollis diam quis nibh faucibus blandit. Nunc fringilla ullamcorper ultricies. Aliquam ornare sed urna imperdiet hendrerit. Duis sit amet nisi elementum, egestas quam a, lobortis libero. Pellentesque vestibulum pulvinar semper. Sed ac tincidunt felis. Nullam efficitur nibh a mattis hendrerit. Interdum et malesuada fames ac ante ipsum primis in faucibus. Morbi interdum interdum quam at imperdiet. Quisque a convallis nibh, eu varius ligula.</p>
	
		<p>Pellentesque gravida lorem sed tempor accumsan. In finibus mi non semper egestas. Aliquam cursus nibh vel purus pharetra pulvinar. Vestibulum at erat accumsan, pretium sapien vitae, imperdiet elit. Sed mollis turpis ut risus suscipit, vel mollis mauris lobortis. Suspendisse luctus at mauris a commodo. Ut tempus blandit orci. Donec ac ante ante.</p>
	
		<p>Cras vulputate risus at euismod ultricies. Fusce porta tincidunt feugiat. Nam condimentum ornare interdum. Aliquam id magna sit amet nisi bibendum convallis. Sed convallis, enim et ullamcorper posuere, diam quam semper nisl, at vestibulum tortor felis sed diam. Praesent interdum fringilla velit ut feugiat. Suspendisse velit nisl, placerat eu justo vel, volutpat porttitor tellus. Duis faucibus sapien nec posuere molestie. Morbi ut sapien arcu. Pellentesque ac libero velit. Vestibulum eget interdum arcu. Aenean eget lacus.</p>
	</DocSection>

	<DocParams>
		<DocParam name="options" type="SpriteProps" optional>Initial properties: any GameObject property (x, y, width, height, scale, rotation, alpha, layer, visible, draggable, cursor, mouse event handlers) plus src.</DocParam>
	</DocParams>

	<DocMixins :paths="['api/traits/game-object']" />

	<DocProperties>
		<DocProperty name="src" type="string">A URL path to the sprite's image.</DocProperty>
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
	</DocProperties>

	<DocMethods>
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
	</DocMethods>

	<DocSnippet title="Example">
<pre>const bunny = new Sprite({
    src: 'https://pixijs.com/assets/bunny.png',
    x: 200,
})

forever(delta =&gt; {
    bunny.rotation += 2
})</pre>
	</DocSnippet>
</template>
