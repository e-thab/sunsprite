<script lang="ts">
export const meta = {
	title: 'Interactable',
	icon: 'tabler:hand-click',
	summary: "Registers mouse interaction — clicks, dragging, hovering, scrolling.",
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>Adds mouse interaction to an object: whether it can be dragged, the cursor shown while hovering it, and a handler for each mouse event. A handler is registered by calling its method with a function; onMouse() registers several at once.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="draggable" type="boolean">Whether this object can be dragged with the mouse.</DocProperty>
		<DocProperty name="cursor" type="Cursor">The cursor shown when the mouse is over this object.</DocProperty>
	</DocProperties>

	<DocMethods>
		<DocMethod signature="onMouse(actions: MouseInputAction): void">Register several mouse handlers at once, as an object whose keys are mouse event names and whose values are the functions to run.</DocMethod>
		<DocMethod signature="onClick(action?: PointerAction): void">Captures any pointer down event, either left or right mouse button.</DocMethod>
		<DocMethod signature="onRelease(action?: PointerAction): void">Captures any pointer release event, either left or right mouse button.</DocMethod>
		<DocMethod signature="onDoubleClick(action?: PointerAction): void">Captures only left button double clicks (two left clicks within 500ms).</DocMethod>
		<DocMethod signature="onLeftClick(action?: PointerAction): void">Captures only left button press.</DocMethod>
		<DocMethod signature="onLeftRelease(action?: PointerAction): void">Captures only left button release.</DocMethod>
		<DocMethod signature="onRightClick(action?: PointerAction): void">Captures only right button press.</DocMethod>
		<DocMethod signature="onRightRelease(action?: PointerAction): void">Captures only right button release.</DocMethod>
		<DocMethod signature="onMiddleClick(action?: PointerAction): void">Captures only middle button press.</DocMethod>
		<DocMethod signature="onMiddleRelease(action?: PointerAction): void">Captures only middle button release.</DocMethod>
		<DocMethod signature="onMouseEnter(action?: PointerAction): void">Captures the pointer entering the object.</DocMethod>
		<DocMethod signature="onMouseExit(action?: PointerAction): void">Captures the pointer exiting the object.</DocMethod>
		<DocMethod signature="onMouseMove(action?: PointerAction): void">Captures the pointer moving while overlapping the object.</DocMethod>
		<DocMethod signature="onDrag(action?: PointerAction): void">Captures the pointer dragging the object.</DocMethod>
		<DocMethod signature="onDragStart(action?: PointerAction): void">Captures the beginning of the drag event.</DocMethod>
		<DocMethod signature="onDragEnd(action?: PointerAction): void">Captures the end of the drag event.</DocMethod>
		<DocMethod signature="onScroll(action?: ScrollAction): void">Captures scroll events while hovering over this object.</DocMethod>
		<DocMethod signature="resetCursor(): void">Set this object's hover cursor back to the default pointer.</DocMethod>
	</DocMethods>
</template>
