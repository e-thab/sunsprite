<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { app, setup, mouseRef, fpsRef, pause, play, pausedRef, print } from '@/assets/api/core'

const canvas = ref<HTMLCanvasElement | null>(null)
const fps = ref()
const fpsColor = ref()
const fullscreen = ref(false)

const largerIcon = '/src/assets/images/game-icons/larger.png'
const smallerIcon = '/src/assets/images/game-icons/smaller.png'
const fullscreenIcon = ref(largerIcon)

function updateFpsInterval() {
  fps.value = fpsRef.value
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

function toggleFullscreen() {
  emit('fullscreen')
  fullscreen.value = !fullscreen.value

  if (fullscreen.value) {
    fullscreenIcon.value = smallerIcon
  } else {
    fullscreenIcon.value = largerIcon
  }
  console.log(fullscreenIcon.value)
}

const emit = defineEmits(['runGame', 'fullscreen'])

onMounted(async () => {
  await setup()
  canvas.value?.appendChild(app.canvas)
  window.setInterval(updateFpsInterval, 250)
})
</script>

<template>
  <div class="game-wrapper">
    <div class="game-bar">
      <!-- Play -->
      <img v-show="pausedRef" @click="play" class="img-button" src="@/assets/images/game-icons/right.png" />

      <!-- Pause -->
      <img v-show="!pausedRef" @click="pause" class="img-button" src="@/assets/images/game-icons/pause.png" />

      <!-- Restart / Run code -->
      <img @click="$emit('runGame')" class="img-button" src="@/assets/images/game-icons/return.png" />
      
      <!-- Screenshot -->
      <img @click="print('screenshot')" class="img-button" src="@/assets/images/game-icons/export.png" />
      
      <!-- mouseX/Y -->
      <div class="coords">
        <span style="font-size: 12px;">mouseX: {{ mouseRef.mouseX }}</span>
        <span style="font-size: 12px;">mouseY: {{ mouseRef.mouseY }}</span>
      </div>
      
      <!-- FPS indicator -->
      <span style="font-size: 12px; width: 4em;">FPS: <span class="fps-number">{{ fps }}</span></span>
      
      <!-- Settings -->
      <img @click="print('settings')" class="img-button" src="@/assets/images/game-icons/gear.png" />
      
      <!-- Fullscreen -->
      <img @click="toggleFullscreen" class="img-button" :src="fullscreenIcon" />
    </div>
    <div id="game-container" ref="canvas" class="canvas"></div>
  </div>
</template>

<style scoped>
* {
  color: #d8dee9;
  font-family:'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
}

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
  height: 0;
  flex: 1 1 auto;
  background-color: magenta;
}

.game-wrapper {
  display: flex;
  flex-direction: column;
  background-color: #252a33;
}

.game-bar {
	display: flex;
  justify-content: space-between;
  align-items: center;
  /* display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  justify-items: center; */
	max-height: 24px;
  padding-left: 0.1em;
  padding-right: 0.2em;
}

.img-button {
  display: block;
  height: 24px;
  transition: 0.2s;
  filter: opacity(80%);
}

.img-button:hover {
  filter: opacity(100%);
}
</style>