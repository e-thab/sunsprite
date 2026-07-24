<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFullscreenStore } from '@/stores/fullscreen'
import Output from '@/assets/api/output'
import type { ParentToSandboxMessage, SandboxToParentMessage } from '@/assets/api/sandboxProtocol'

const frame = ref<HTMLIFrameElement | null>(null)
// 0 means "no iframe mounted yet"; runCode() bumps this to force a fresh iframe per run
const frameKey = ref(0)
const pendingCode = ref<string | null>(null)

const mouse = ref({ mouseX: 0, mouseY: 0 })
const paused = ref(false)

const fps = ref()
const fpsColor = ref()
const fsStore = useFullscreenStore()

function updateFpsColor() {
  if (fps.value >= 55) {
    fpsColor.value = 'SpringGreen'
  } else if (fps.value >= 30) {
    fpsColor.value = 'PaleGreen'
  } else if (fps.value >= 20) {
    fpsColor.value = 'Khaki'
  } else if (fps.value >= 10) {
    fpsColor.value = 'Gold'
  } else {
    fpsColor.value = 'Tomato'
  }
}

function postToFrame(message: ParentToSandboxMessage) {
  frame.value?.contentWindow?.postMessage(message, '*')
}

/** Runs {code} in a freshly created sandbox iframe, discarding any previous run's state/loops. */
function runCode(code: string) {
  pendingCode.value = code
  frameKey.value++
}

function play() {
  postToFrame({ type: 'sunsprite:play' })
}

function pause() {
  postToFrame({ type: 'sunsprite:pause' })
}

defineExpose({ runCode })

const emit = defineEmits(['ready', 'runGame', 'fullscreen'])

onMounted(async () => {
  window.addEventListener('message', (event: MessageEvent<SandboxToParentMessage>) => {
    // Only trust messages from the currently-live sandbox iframe
    if (!frame.value || event.source !== frame.value.contentWindow) return

    const message = event.data
    switch (message.type) {
      case 'sunsprite:ready':
        if (pendingCode.value !== null) {
          postToFrame({ type: 'sunsprite:run', code: pendingCode.value })
          pendingCode.value = null
        }
        break
      case 'sunsprite:mouse':
        mouse.value.mouseX = Math.round(message.x)
        mouse.value.mouseY = Math.round(message.y)
        break
      case 'sunsprite:paused':
        paused.value = message.paused
        break
      case 'sunsprite:fps':
        fps.value = message.fps
        updateFpsColor()
        break
      case 'sunsprite:output':
        if (message.kind === 'printStartMsg') Output.printStartMsg()
        else if (message.kind === 'clear') Output.clear()
        else if (message.msg !== undefined) Output[message.kind](message.msg)
        break
    }
  })

  // The real keyboard listeners live in the parent (not the sandboxed iframe) so we can check
  // whether the Monaco editor has focus before forwarding key events into the game.
  window.addEventListener('keydown', event => {
    if (document.activeElement?.ariaRoleDescription === 'editor') return
    postToFrame({ type: 'sunsprite:keydown', code: event.code })
  })
  window.addEventListener('keyup', event => {
    if (document.activeElement?.ariaRoleDescription === 'editor') return
    postToFrame({ type: 'sunsprite:keyup', code: event.code })
  })
  window.addEventListener('contextmenu', () => {
    postToFrame({ type: 'sunsprite:contextmenu' })
  })
  window.addEventListener('blur', () => {
    postToFrame({ type: 'sunsprite:blur' })
  })

  emit('ready')
})
</script>

<template>
  <div class="panel-wrapper">
    <div class="panel-bar">
      <!-- Play -->
      <img v-show="paused" @click="play" class="img-button" title="Play" src="@/assets/images/game-icons/right.png" />

      <!-- Pause -->
      <img v-show="!paused" @click="pause" class="img-button" title="Pause" src="@/assets/images/game-icons/pause.png" />

      <!-- Restart / Run code -->
      <img @click="$emit('runGame')" class="img-button" title="Restart" src="@/assets/images/game-icons/return.png" />

      <!-- Screenshot -->
      <!-- <img @click="print('screenshot')" class="img-button" title="Screenshot" src="@/assets/images/game-icons/export.png" /> -->

      <!-- mouseX/Y -->
      <div class="coords">
        <span style="font-size: 12px;">mouse X: {{ mouse.mouseX }}</span>
        <span style="font-size: 12px;">mouse Y: {{ mouse.mouseY }}</span>
      </div>

      <!-- FPS indicator -->
      <span style="font-size: 12px; width: 4em;">FPS: <span class="fps-number">{{ fps }}</span></span>

      <!-- Sound -->
      <!-- Icon should change based on volume -->
      <img @click="Output.print('sound')" class="img-button" title="Volume" src="@/assets/images/game-icons/audioOn.png" />

      <!-- Settings -->
      <img @click="Output.print('settings')" class="img-button" title="Settings" src="@/assets/images/game-icons/gear.png" />

      <!-- Fullscreen (maximize) -->
      <img v-show="!fsStore.fullscreen" @click="$emit('fullscreen')" class="img-button" title="Fullscreen" src="@/assets/images/game-icons/larger.png" />

      <!-- Fullscreen (minimize) -->
      <img v-show="fsStore.fullscreen" @click="$emit('fullscreen')" class="img-button" title="Shrink" src="@/assets/images/game-icons/smaller.png" />
    </div>
    <div id="game-container" class="canvas">
      <!-- sandbox="allow-scripts" (no allow-same-origin) gives this frame an opaque origin, so
           user code inside it can't reach this app's DOM, cookies, or storage. A fresh iframe
           (:key bump) is mounted on every run so a previous run's loops/timers are fully discarded. -->
      <iframe
        v-if="frameKey > 0"
        :key="frameKey"
        ref="frame"
        class="game-frame"
        sandbox="allow-scripts"
        src="/sandbox.html"
      ></iframe>
    </div>
  </div>
</template>

<style scoped>
.fps-number {
  color: v-bind(fpsColor)
}

.coords {
  justify-items: center;
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 180px;
}

.canvas {
  flex: 1;
  overflow: hidden;
  justify-content: center;
  background-color: #353b48; /* Magenta for debugging; update this from core whenever bg color is set */
  /* background-color: magenta;  */
}

.game-frame {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
</style>
