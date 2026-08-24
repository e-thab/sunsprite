<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

const props = defineProps<{
  label: string
  icon: string
}>()

// Below this, in either dimension, a pane is too small to show real content
// (a scrollable tree, an editor, a canvas) usefully — the label overlay
// takes over instead of the pane trying to render its normal content into a
// sliver. Not tied to any specific splitter's minSize: a pane can end up
// this small from its *own* handle being dragged to its floor, or just as
// easily from an ancestor pane shrinking around it (an outer column
// narrowing squeezes every nested pane inside it down to the same width,
// with none of their own handles ever moving) — a live pixel measurement of
// this component's own rendered box catches both the same way a percentage
// check tied to one specific splitter wouldn't.
const COLLAPSE_THRESHOLD_PX = 60

// Breathing room on either side of the label so it doesn't render flush
// against the overlay's edges right at the fit boundary.
const LABEL_PADDING_PX = 16

// How big an axis has to be, relative to the viewport in that dimension,
// before a click-to-expand treats it as already usable rather than
// something to grow. Checked independently per axis (not tied to `mode`,
// which only tracks whichever axis collapsed *first*) so a pane that's
// narrow but tall only grows narrower-axis, one that's short but wide only
// grows the short axis, and one that's small in both grows both.
const DECENT_VIEWPORT_FRACTION = 0.1

const rootRef = useTemplateRef('root')
const measureRef = useTemplateRef('measure')
const width = ref(0)
const height = ref(0)
// The label's own natural (unrotated, unwrapped) rendered width — measured
// from a hidden twin of the visible span, sharing its exact font rules, so
// this always reflects what the *current* label text actually needs
// instead of a guess. Re-measures itself automatically whenever the label
// text changes, since that changes the hidden span's own rendered size and
// this is watching that span directly, not the label string.
const labelWidth = ref(0)

// Which presentation this pane is in. A pane collapses width-first (if it's
// narrow, the label rotates to run along its height, regardless of how
// short that height also is) — matching which axis the pane actually lost
// first, e.g. docs-content-pane sitting at min *width* and then having its
// height cut down further should stay rotated, not flip back to horizontal
// right as it also runs out of room. Either way, once a presentation is
// picked, it only actually shows the text if the label's own measured
// length fits the space available *along that run* — a short label like
// "Code" might never need the icon at all, while a long doc page title
// falls back to it well before the pane hits any fixed pixel floor.
const mode = computed<'normal' | 'width' | 'height' | 'icon'>(() => {
  if (width.value < COLLAPSE_THRESHOLD_PX) {
    return labelWidth.value + LABEL_PADDING_PX <= height.value ? 'width' : 'icon'
  }
  if (height.value < COLLAPSE_THRESHOLD_PX) {
    return labelWidth.value + LABEL_PADDING_PX <= width.value ? 'height' : 'icon'
  }
  return 'normal'
})

// A splitter panel handle (panelsRef[i].resize/.collapse/etc) is only
// reachable from whichever component owns the USplitter instance — several
// layers up from here, and a different component entirely for a pane whose
// width and height come from two different splitters (see
// usePixelMinSize's own comment on that split). Reaching that far without
// threading a prop/emit chain through every intermediate wrapper (FileTree,
// AssetLibrary, CodeEditor, PhaserCanvas, OutputPane, DocsPanel) is exactly
// what DOM event bubbling is for: this dispatches from the pane's own panel
// element, and whichever ancestor actually owns the relevant splitter — an
// outer one, a nested one, both, depending on the pane — listens for it and
// acts, with no knowledge here of who that ends up being.
function expand() {
  const panel = rootRef.value?.closest<HTMLElement>('[data-slot="panel"]')
  if (!panel?.id) return
  panel.dispatchEvent(new CustomEvent('pane-expand-request', {
    bubbles: true,
    detail: {
      paneId: panel.id,
      expandWidth: width.value < window.innerWidth * DECENT_VIEWPORT_FRACTION,
      expandHeight: height.value < window.innerHeight * DECENT_VIEWPORT_FRACTION,
    },
  }))
}

let rootObserver: ResizeObserver | null = null
let measureObserver: ResizeObserver | null = null

onMounted(() => {
  const el = rootRef.value
  if (el) {
    rootObserver = new ResizeObserver(([entry]) => {
      if (!entry) return
      width.value = entry.contentRect.width
      height.value = entry.contentRect.height
    })
    rootObserver.observe(el)
  }

  const measureEl = measureRef.value
  if (measureEl) {
    measureObserver = new ResizeObserver(([entry]) => {
      if (!entry) return
      labelWidth.value = entry.contentRect.width
    })
    measureObserver.observe(measureEl)
  }
})

onBeforeUnmount(() => {
  rootObserver?.disconnect()
  measureObserver?.disconnect()
})
</script>

<template>
  <div ref="root" class="collapsible-pane">
    <div v-show="mode === 'normal'" class="collapsible-pane-content">
      <slot />
    </div>
    <button
      v-if="mode !== 'normal'"
      type="button"
      class="collapsible-pane-overlay"
      :class="`is-collapsed-${mode}`"
      :title="`${props.label} — click to expand`"
      @click="expand"
    >
      <UIcon v-if="mode === 'icon'" :name="props.icon" class="collapsible-pane-icon" />
      <span v-else class="collapsible-pane-label">{{ props.label }}</span>
    </button>
    <!-- Never shown — exists purely so labelWidth reflects this exact text
         in this exact font, unrotated and unwrapped. -->
    <span ref="measure" class="collapsible-pane-label collapsible-pane-measure" aria-hidden="true">{{ props.label }}</span>
  </div>
</template>

<style scoped>
.collapsible-pane {
  position: relative;
  width: 100%;
  height: 100%;
}

.collapsible-pane-content {
  width: 100%;
  height: 100%;
}

.collapsible-pane-overlay {
  /* Reset <button>'s own chrome — used instead of a div so click-to-expand
     gets keyboard activation and focus handling for free, without hand-
     rolling role/tabindex/keydown. */
  appearance: none;
  background: none;
  border: none;
  margin: 0;
  padding: 0;
  font: inherit;
  cursor: pointer;

  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--theme-bg-muted);
  transition: background-color 0.15s ease-in-out;
}

.collapsible-pane-overlay:hover,
.collapsible-pane-overlay:focus-visible {
  background-color: var(--theme-bg-elevated);
}

.collapsible-pane-overlay:focus-visible {
  outline: 2px solid var(--theme-primary);
  outline-offset: -2px;
}

.collapsible-pane-label {
  color: var(--theme-text);
  /* font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif; */
  white-space: nowrap;
  user-select: none;
}

.collapsible-pane-measure {
  position: absolute;
  left: 0;
  top: 0;
  visibility: hidden;
  pointer-events: none;
}

/* Matches UButton's own size="xs" icon sizing (Nuxt UI's button theme maps
   xs to a size-4 leading/trailing icon, i.e. 1rem) — the same scale already
   used on every other icon-bearing control throughout the editor's panes. */
.collapsible-pane-icon {
  width: 1rem;
  height: 1rem;
  font-size: 1rem;
  color: var(--theme-text-muted);
}

/* Narrow-and-tall: rotated to run with the pane's long axis, bottom-to-top
   (tilt your head left to read it) — the common convention for a collapsed
   sidebar label. */
.is-collapsed-width .collapsible-pane-label {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

/* Short-and-wide: stays upright, just centered in a thin strip. */
.is-collapsed-height .collapsible-pane-label {
  writing-mode: horizontal-tb;
}
</style>
