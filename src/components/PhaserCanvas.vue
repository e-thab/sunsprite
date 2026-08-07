<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { attachSandbox, detachSandbox, fpsRef, mouseRef, pausedRef, pause, play, resizeStage, sandboxUrl } from '@/sandbox/hostBridge'
import { useFullscreenStore } from '@/stores/fullscreen'
import { useFileStore } from '@/stores/fileStore'
import type { DropdownMenuItem } from '@nuxt/ui'
import Output from '@/assets/api/output'
// import { AUTO, Game, Scene, type Types } from 'phaser'

// The game runs in this iframe, not in the app. See src/sandbox/hostBridge.ts.
const sandboxFrame = ref<HTMLIFrameElement | null>(null)
const codeChangedSinceLastRun = ref(false)
const fpsColor = ref()
const fullscreenStore = useFullscreenStore()
const fileStore = useFileStore()

function onRestartClick() {
  codeChangedSinceLastRun.value = false
  emit('runGame')
}

// Meant to track & indicate when the code running does not match the project's code. For now that just
// means adding a chip any time the code is changed after running and removing it when restarting. Eventually,
// it should also remove that chip when the project's code is returned to its before-change state.
watch(() => fileStore.hasUnsavedChanges, (value, oldValue) => {
  codeChangedSinceLastRun.value = true
})

// The sandbox reports its frame rate on its own cadence, so this just recolors
// the badge whenever a new reading lands instead of polling the game itself.
watch(fpsRef, (fps) => {
  if (fps >= 55) {
    fpsColor.value = 'SpringGreen'
  } else if (fps >= 30) {
    fpsColor.value = 'PaleGreen'
  } else if (fps >= 20) {
    fpsColor.value = 'Khaki'
  } else if (fps >= 10) {
    fpsColor.value = 'Gold'
  } else {
    fpsColor.value = 'Tomato'
  }
}, { immediate: true })

const playPauseIcon = computed(() => pausedRef.value ? 'tabler:player-play-filled' : 'tabler:player-pause-filled')
const playPauseLabel = computed(() => pausedRef.value ? 'Play' : 'Pause')
function togglePlayPause() {
  if (pausedRef.value) {
    play()
  } else {
    pause()
  }
}

const fullscreenIcon = computed(() => fullscreenStore.fullscreen ? 'tabler:minimize' : 'tabler:maximize')
const fullscreenTooltip = computed(() => fullscreenStore.fullscreen ? 'Minimize' : 'Maximize')

const emit = defineEmits(['ready', 'runGame', 'fullscreen'])

onMounted(async () => {
    if (sandboxFrame.value) attachSandbox(sandboxFrame.value)

    resizeStage()
    // new Promise(resolve => setTimeout(resolve, 250)).then(() => {
    //   resizeStage()
    // })

    // Right-click is suppressed inside the sandbox document itself now — the
    // canvas lives there, and this document can't reach into it to listen.

    emit('ready')
})

onBeforeUnmount(() => {
    detachSandbox()
})

// TODO: use tabler:refresh-alert icon when the code running doesn't match saved project
</script>

<template>
  <div class="panel-wrapper">
    <div class="panel-bar">
      <!-- Play / Pause -->
      <!-- <UTooltip :text="playPauseLabel"> -->
        <UButton :icon="playPauseIcon" variant="solid" color="primary" :label="playPauseLabel" size="xs" @click="togglePlayPause" />
      <!-- </UTooltip> -->

      <!-- Restart / Run code -->
      <UChip inset color="warning" :show="codeChangedSinceLastRun">
        <!-- <UTooltip text="Restart"> -->
          <UButton icon="tabler:refresh" variant="ghost" color="neutral" label="Restart" size="xs" @click="onRestartClick" />
        <!-- </UTooltip> -->
      </UChip>

      <!-- Sound -->
      <!-- Icon should change based on volume -->
      <!-- <UTooltip text="Volume"> -->
        <UButton icon="tabler:volume" variant="ghost" color="neutral" label="Volume" size="xs" @click="Output.print('sound')" />
      <!-- </UTooltip> -->

      <!-- Fullscreen toggle -->
      <!-- <UTooltip :text="fullscreenTooltip"> -->
        <UButton :icon="fullscreenIcon" variant="ghost" color="neutral" label="Fullscreen" size="xs" @click="$emit('fullscreen')" />
      <!-- </UTooltip> -->

      <!-- Settings -->
      <!-- <UTooltip text="Settings"> -->
        <UButton icon="tabler:settings-filled" variant="ghost" color="neutral" label="Settings" size="xs" @click="Output.print('settings')" />
      <!-- </UTooltip> -->
      
      <!-- mouseX/Y -->
      <!-- <UBadge color="neutral" variant="soft" class="coords-badge">
        <span>mouse X: {{ mouseRef.mouseX }}</span>
        <span>mouse Y: {{ mouseRef.mouseY }}</span>
      </UBadge> -->

      <!-- FPS indicator -->
      <UBadge color="primary" variant="outline">FPS: <span class="fps-number">{{ fpsRef }}</span></UBadge>
    </div>

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
  </div>
</template>

<style scoped>
.fps-number {
  color: v-bind(fpsColor)
}

.coords-badge {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5em;
  width: 180px;
}

.canvas {
  flex: 1;
  overflow: hidden;
  justify-content: center;
  display: block;
  width: 100%;
  border: 0;
  background-color: #353b48; /* Magenta for debugging; update this from core whenever bg color is set */
  /* background-color: magenta;  */
}
</style>