<script setup lang="ts">
import { ref, onMounted } from 'vue'
// import { /*mouseRef, fpsRef,*/ /*pause, play, pausedRef, print*/ } from '@/assets/api/core'
import { game, setup, mouseRef, resizeStage, pause, play, pausedRef, print } from '@/assets/api/core'
import { useFullscreenStore } from '@/stores/fullscreen'
// import { AUTO, Game, Scene, type Types } from 'phaser'

const canvas = ref<HTMLCanvasElement | null>(null)
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

onMounted(async () => {
    setup()

    resizeStage()
    // new Promise(resolve => setTimeout(resolve, 250)).then(() => {
    //   resizeStage()
    // })

    window.setInterval(updateFpsInterval, 250)
    emit('ready')
})
</script>

<template>
  <div class="panel-wrapper">
    <div class="panel-bar">
      <!-- Play -->
      <img v-show="pausedRef" @click="play" class="img-button" title="Play" src="@/assets/images/game-icons/right.png" />

      <!-- Pause -->
      <img v-show="!pausedRef" @click="pause" class="img-button" title="Pause" src="@/assets/images/game-icons/pause.png" />

      <!-- Restart / Run code -->
      <img @click="$emit('runGame')" class="img-button" title="Restart" src="@/assets/images/game-icons/return.png" />
      
      <!-- Screenshot -->
      <!-- <img @click="print('screenshot')" class="img-button" title="Screenshot" src="@/assets/images/game-icons/export.png" /> -->
      
      <!-- mouseX/Y -->
      <div class="coords">
        <span style="font-size: 12px;">mouse X: {{ mouseRef.mouseX }}</span>
        <span style="font-size: 12px;">mouse Y: {{ mouseRef.mouseY }}</span>
      </div>
      
      <!-- FPS indicator -->
      <span style="font-size: 12px; width: 4em;">FPS: <span class="fps-number">{{ fps }}</span></span>
      
      <!-- Sound -->
      <!-- Icon should change based on volume -->
      <img @click="print('sound')" class="img-button" title="Volume" src="@/assets/images/game-icons/audioOn.png" />
      
      <!-- Settings -->
      <img @click="print('settings')" class="img-button" title="Settings" src="@/assets/images/game-icons/gear.png" />

      <!-- Fullscreen (maximize) -->
      <img v-show="!fsStore.fullscreen" @click="$emit('fullscreen')" class="img-button" title="Fullscreen" src="@/assets/images/game-icons/larger.png" />

      <!-- Fullscreen (minimize) -->
      <img v-show="fsStore.fullscreen" @click="$emit('fullscreen')" class="img-button" title="Shrink" src="@/assets/images/game-icons/smaller.png" />
    </div>
    <div id="game-container" class="canvas"></div>
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
</style>