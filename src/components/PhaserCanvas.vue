<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { game, setup, mouseRef, resizeStage, pause, play, pausedRef } from '@/assets/api/core'
import { useFullscreenStore } from '@/stores/fullscreen'
import { useFileStore } from '@/stores/fileStore'
import type { DropdownMenuItem } from '@nuxt/ui'
import Output from '@/assets/api/output'
// import { AUTO, Game, Scene, type Types } from 'phaser'

// const canvas = ref<HTMLCanvasElement | null>(null)
const codeChangedSinceLastRun = ref(false)
const fps = ref()
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

function updateFpsInterval() {
  fps.value = Math.round(game.loop.actualFps)

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
    setup()

    resizeStage()
    // new Promise(resolve => setTimeout(resolve, 250)).then(() => {
    //   resizeStage()
    // })

    // Prevent right click opening context menu
    const gameContainer = document.getElementById('game-container')
    gameContainer?.addEventListener('contextmenu', event => {
      event.preventDefault()
    })

    window.setInterval(updateFpsInterval, 250)
    emit('ready')
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
      <UBadge color="primary" variant="outline">FPS: <span class="fps-number">{{ fps }}</span></UBadge>
    </div>
    <div id="game-container" class="canvas"></div>
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
  background-color: #353b48; /* Magenta for debugging; update this from core whenever bg color is set */
  /* background-color: magenta;  */
}
</style>