<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { app, setup, mouseRef, fpsRef, pause, play, paused } from '@/assets/api'

const canvas = ref<HTMLCanvasElement | null>(null)

onMounted(async () => {
  await setup()
  canvas.value?.appendChild(app.canvas)
})
</script>

<template>
  <div style="display: flex; flex-direction: column;">
    <div class="game-bar">
      <!-- Pause/play buttons -->
      <button v-if="paused" @click="play" class="test-button">
        Play
      </button>
      <button v-else @click="pause" class="test-button">
        Pause
      </button>

      <!-- <button class="test-button">Test 2</button> -->
      <button class="test-button">Fullscreen</button>
      <button class="test-button">Screenshot</button>
      <div class="coords">
        <span style="font-size: 12px;">mouseX: {{ mouseRef.mouseX }}</span>
        <span style="font-size: 12px;">mouseY: {{ mouseRef.mouseY }}</span>
      </div>
      <span style="font-size: 12px;">FPS: {{ fpsRef }}</span>
      <!-- <span style="flex: 1;">test</span> -->
    </div>
    <div id="game-container" ref="canvas" class="canvas"></div>
  </div>
</template>

<style scoped>
.coords {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 180px;
}

.canvas {
  width: 100%;
  height: 100%;
  flex: 1 1 auto;
  background-color: magenta;
}

.game-bar {
	display: flex;
  flex-direction: row;
  justify-content: space-evenly;
	background-color: #252a33;
	height: 24px;
}

.test-button {
	height: 100%;
	/* width: 8%;
  min-width: 40px; */
  /* width: 60px; */
}
</style>