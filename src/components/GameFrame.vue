<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { attachSandbox, detachSandbox, resizeStage, sandboxUrl } from '@/sandbox/hostBridge'

// Just the sandboxed iframe and its attach/detach/resize lifecycle — no
// toolbar. PhaserCanvas.vue (the editor's canvas panel) and PlayView.vue
// (the standalone player) each want a different toolbar around the same
// running game, so that part lives in them; this is the part that has to
// stay identical between the two, since attachSandbox/detachSandbox are
// paired module-level calls in hostBridge.ts (see its own comments) and
// duplicating that pairing in two places is how the two would eventually
// drift out of sync with each other.
const sandboxFrame = ref<HTMLIFrameElement | null>(null)

const emit = defineEmits(['ready'])

onMounted(() => {
  if (sandboxFrame.value) attachSandbox(sandboxFrame.value)
  resizeStage()
  emit('ready')
})

onBeforeUnmount(() => {
  detachSandbox()
})
</script>

<template>
  <!--
    User code runs in here, not in this document. `sandbox="allow-scripts"` and
    nothing else: scripts may run, but the frame gets an opaque origin, so the
    same-origin policy blocks it from touching this page's DOM, its
    localStorage (Supabase session), or navigating us. Do not add
    allow-same-origin — combined with allow-scripts it lets the frame remove
    its own sandboxing, which would undo all of this.
  -->
  <iframe
    ref="sandboxFrame"
    class="canvas"
    title="Game canvas"
    sandbox="allow-scripts"
    :src="sandboxUrl()"
  ></iframe>
</template>

<style scoped>
.canvas {
  flex: 1;
  overflow: hidden;
  justify-content: center;
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background-color: #353b48;
}
</style>
