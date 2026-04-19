<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { app, setup, mouseRef, fpsRef, pause, play, pausedRef, print } from '@/assets/api/core'
import { useFullscreenStore } from '@/stores/fullscreen'

const canvas = ref<HTMLCanvasElement | null>(null)
const fps = ref()
const fpsColor = ref()
const fsStore = useFullscreenStore()

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

const emit = defineEmits(['ready', 'runGame', 'fullscreen'])

onMounted(async () => {
  await setup()
  canvas.value?.appendChild(app.canvas)
  window.setInterval(updateFpsInterval, 250)
  emit('ready')
})
</script>

<template>
  <div class="panel-wrapper">
    <div class="panel-bar">
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
      
      <!-- Sound -->
      <!-- Icon should change based on volume -->
      <img @click="print('sound')" class="img-button" src="@/assets/images/game-icons/audioOn.png" />
      
      <!-- Settings -->
      <img @click="print('settings')" class="img-button" src="@/assets/images/game-icons/gear.png" />

      <!-- Fullscreen -->
      <img @click="$emit('fullscreen')" class="img-button" :src="fsStore.icon" />
    </div>
    <div id="game-container" ref="canvas" class="canvas"></div>
  </div>
</template>

<style>
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

.panel-wrapper {
  display: flex;
  flex-direction: column;
  background-color: var(--nord-background-dark);
}

.panel-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--nord-text-bright);
  font-family:'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
  /* display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  justify-items: center; */
	max-height: 24px;
  min-height: 24px;
  padding-left: 0.1em;
  padding-right: 0.2em;
}

.img-button {
  display: block;
  height: 24px;
  transition: 0.15s;
  filter: brightness(0.8)
}
.img-button:hover {
  /* background: radial-gradient(rgba(255, 255, 255, 0.07), transparent); */
  filter: brightness(1);
  cursor: pointer;
}
</style>