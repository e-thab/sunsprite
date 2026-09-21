<script lang="ts">
export const meta = {
	title: 'Rectangle',
	icon: 'tabler:square',
	summary: 'A filled rectangle shape.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>new Rectangle(options?: RectangleProps)</pre></DocSnippet>

	<DocSection id="content-1">
		<p>A filled rectangle shape. Built on Shape — every trait in GameObject, plus a fill and an outline — and adds rounded corners of its own.</p>
	</DocSection>

	<DocMixins :paths="['api/traits/game-object', 'api/traits/fillable', 'api/traits/outlinable']" />

	<DocProperties>
		<DocProperty name="cornerRadius" type="number">Radius of the rectangle's corners. Set to 0 to remove rounding and use default sharp corners.</DocProperty>
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
		<DocProperty name="color" type="string" from="api/traits/fillable">Fill color, as a hex string. Set to undefined or null to clear the fill.</DocProperty>
		<DocProperty name="outlineColor" type="string" from="api/traits/outlinable">Outline color, as a hex string. Set to undefined or null to clear the outline.</DocProperty>
		<DocProperty name="outlineWidth" type="number" from="api/traits/outlinable">Outline width/thickness, in pixels.</DocProperty>
		<DocProperty name="outlineAlpha" type="number" from="api/traits/outlinable">Outline's opacity. Range of 0-1 where 0 is transparent and 1 is opaque.</DocProperty>
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
		<DocMethod signature="clearFill(): void" from="api/traits/fillable">Remove the fill, making the shape transparent. Its outline stays visible if it had one.</DocMethod>
		<DocMethod signature="setOutline(color?: string, width?: number, alpha?: number): void" from="api/traits/outlinable">Set every outline property at once. Called with no arguments at all, it clears the outline.</DocMethod>
		<DocMethod signature="clearOutline(): void" from="api/traits/outlinable">Remove the outline. The fill stays visible if the shape had one.</DocMethod>
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
