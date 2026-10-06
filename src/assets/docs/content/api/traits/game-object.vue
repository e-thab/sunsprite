<script lang="ts">
export const meta = {
	title: 'GameObject',
	icon: 'tabler:cube',
	summary: 'The composed base shape behind Sprite, Rectangle, Circle, and Label.',
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>GameObject is not a trait a user constructs directly — it is the composition of every trait below, and is what Sprite, Rectangle, Circle, and Label are all built from. Rectangle and Circle go through Shape, which adds Fillable and Outlinable on top of this set. Line, VLine, and HLine compose a smaller, direct subset of these traits instead of GameObject as a whole — see each class’s own "Composed From" section.</p>
	</DocSection>

	<DocMixins :paths="['api/traits/positionable', 'api/traits/alignable', 'api/traits/sizable', 'api/traits/rotatable', 'api/traits/viewable', 'api/traits/interactable', 'api/traits/timeable']" />

	<DocProperties>
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

</template>
