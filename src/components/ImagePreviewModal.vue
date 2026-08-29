<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
	path: string | null
	label?: string
}>()

defineEmits<{ close: [] }>()

const MIN_SCALE = 0.1
const MAX_SCALE = 32
const WHEEL_ZOOM_STEP = 1.15
const BUTTON_ZOOM_STEP = 1.3

const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const isDragging = ref(false)
let dragStartX = 0
let dragStartY = 0
let dragOriginX = 0
let dragOriginY = 0

function resetView() {
	scale.value = 1
	translateX.value = 0
	translateY.value = 0
}

// A freshly opened image should never inherit the previous one's zoom/pan.
watch(() => props.path, resetView)

function zoomBy(factor: number) {
	scale.value = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale.value * factor))
}

// Keeps whatever point is under the cursor fixed on screen while the scale
// changes, rather than always zooming toward the image's center.
function onWheel(event: WheelEvent) {
	event.preventDefault()
	const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
	const cursorX = event.clientX - rect.left - rect.width / 2
	const cursorY = event.clientY - rect.top - rect.height / 2

	const targetScale = event.deltaY < 0 ? scale.value * WHEEL_ZOOM_STEP : scale.value / WHEEL_ZOOM_STEP
	const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, targetScale))
	const appliedFactor = newScale / scale.value

	translateX.value = cursorX - (cursorX - translateX.value) * appliedFactor
	translateY.value = cursorY - (cursorY - translateY.value) * appliedFactor
	scale.value = newScale
}

function onPointerDown(event: PointerEvent) {
	isDragging.value = true
	dragStartX = event.clientX
	dragStartY = event.clientY
	dragOriginX = translateX.value
	dragOriginY = translateY.value
	;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
	if (!isDragging.value) return
	translateX.value = dragOriginX + (event.clientX - dragStartX)
	translateY.value = dragOriginY + (event.clientY - dragStartY)
}

function onPointerUp() {
	isDragging.value = false
}
</script>

<template>
	<div class="panel-wrapper">
		<div class="panel-bar">
			<div></div>
			<div>{{ label ?? 'Image preview' }}</div>
			<UTooltip text="Close">
				<UButton icon="tabler:x" variant="ghost" color="neutral" size="xs" @click="$emit('close')" />
			</UTooltip>
		</div>

		<div
			class="image-viewer"
			:class="{ dragging: isDragging }"
			@wheel="onWheel"
			@pointerdown="onPointerDown"
			@pointermove="onPointerMove"
			@pointerup="onPointerUp"
			@pointerleave="onPointerUp"
			@dblclick="resetView"
		>
			<img
				v-if="path"
				:src="path"
				class="preview-image"
				:style="{ transform: `translate(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px)) scale(${scale})` }"
				draggable="false"
				alt=""
			/>
		</div>

		<div class="panel-bar viewer-controls">
			<UTooltip text="Zoom out">
				<UButton icon="tabler:zoom-out" variant="ghost" color="neutral" size="sm" @click="zoomBy(1 / BUTTON_ZOOM_STEP)" />
			</UTooltip>
			<span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
			<UTooltip text="Zoom in">
				<UButton icon="tabler:zoom-in" variant="ghost" color="neutral" size="sm" @click="zoomBy(BUTTON_ZOOM_STEP)" />
			</UTooltip>
			<UTooltip text="Reset">
				<UButton icon="tabler:zoom-reset" variant="ghost" color="neutral" size="sm" @click="resetView" />
			</UTooltip>
		</div>
	</div>
</template>

<style scoped>
/* Matches CollapsiblePane's own .collapsible-pane-frame treatment — this
   modal floats over the editor rather than living inside a splitter panel,
   so it never gets that frame from an ancestor and has to draw it itself. */
.panel-wrapper {
	border: 1px solid var(--theme-border);
	border-radius: var(--panel-border-radius);
	overflow: hidden;
}

.image-viewer {
	position: relative;
	flex: 1 1 auto;
	min-height: 0;
	overflow: hidden;
	background-color: var(--theme-bg);
	background-image:
		linear-gradient(45deg, var(--theme-bg-muted) 25%, transparent 25%),
		linear-gradient(-45deg, var(--theme-bg-muted) 25%, transparent 25%),
		linear-gradient(45deg, transparent 75%, var(--theme-bg-muted) 75%),
		linear-gradient(-45deg, transparent 75%, var(--theme-bg-muted) 75%);
	background-size: 20px 20px;
	background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
	cursor: grab;
	touch-action: none;
}

.image-viewer.dragging {
	cursor: grabbing;
}

.preview-image {
	position: absolute;
	top: 50%;
	left: 50%;
	max-width: none;
	image-rendering: pixelated;
	user-select: none;
}

/* Reuses .panel-bar for its surface and borders, but not its size: these are
   size="sm" buttons with real padding around them, not a 32px strip of xs
   ones. Both properties are needed to say that — .panel-bar now pins its
   height with min-height: 0 as well (see main.css), so releasing only
   `height` would still leave this floored at nothing and clip the buttons. */
.viewer-controls {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 0.5em;
	flex-shrink: 0;
	height: auto;
	min-height: auto;
	padding: 0.5em;
	background-color: var(--theme-bg-muted);
	border-top: 1px solid var(--theme-border)
}

.zoom-level {
	min-width: 3.5em;
	text-align: center;
	font-size: 0.85em;
	color: var(--theme-text-toned);
}
</style>
