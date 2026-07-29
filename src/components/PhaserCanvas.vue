<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
// import { /*mouseRef, fpsRef,*/ /*pause, play, pausedRef, print*/ } from '@/assets/api/core'
import { game, setup, mouseRef, resizeStage, pause, play, pausedRef } from '@/assets/api/core'
import { useFullscreenStore } from '@/stores/fullscreen'
import Output from '@/assets/api/output'
// import { AUTO, Game, Scene, type Types } from 'phaser'

// const canvas = ref<HTMLCanvasElement | null>(null)
const fps = ref()
const fpsColor = ref()
const fsStore = useFullscreenStore()

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

const emit = defineEmits(['ready', 'runGame', 'fullscreen'])

const playPauseIcon = computed(() => pausedRef.value ? 'tabler:player-play-filled' : 'tabler:player-pause-filled')
const playPauseTooltip = computed(() => pausedRef.value ? 'Play' : 'Pause')
function togglePlayPause() {
  if (pausedRef.value) play()
  else pause()
}

const fullscreenIcon = computed(() => fsStore.fullscreen ? 'tabler:minimize' : 'tabler:maximize')
const fullscreenTooltip = computed(() => fsStore.fullscreen ? 'Minimize' : 'Maximize')

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
      <UTooltip :text="playPauseTooltip">
        <UButton :icon="playPauseIcon" variant="ghost" color="neutral" size="xs" @click="togglePlayPause" />
      </UTooltip>

      <!-- Restart / Run code -->
      <UTooltip text="Restart">
        <UButton icon="tabler:refresh" variant="ghost" color="neutral" size="xs" @click="$emit('runGame')" />
      </UTooltip>

      <!-- Sound -->
      <!-- Icon should change based on volume -->
      <UTooltip text="Volume">
        <UButton icon="tabler:volume" variant="ghost" color="neutral" size="xs" @click="Output.print('sound')" />
      </UTooltip>

      <!-- Fullscreen toggle -->
      <UTooltip :text="fullscreenTooltip">
        <UButton :icon="fullscreenIcon" variant="ghost" color="neutral" size="xs" @click="$emit('fullscreen')" />
      </UTooltip>

      <!-- Settings -->
      <UTooltip text="Settings">
        <UButton icon="tabler:settings-filled" variant="ghost" color="neutral" size="xs" @click="Output.print('settings')" />
      </UTooltip>
      
      <!-- mouseX/Y -->
      <UBadge color="neutral" variant="soft" class="coords-badge">
        <span>mouse X: {{ mouseRef.mouseX }}</span>
        <span>mouse Y: {{ mouseRef.mouseY }}</span>
      </UBadge>

      <!-- FPS indicator -->
      <UBadge color="neutral" variant="soft">FPS: <span class="fps-number">{{ fps }}</span></UBadge>
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