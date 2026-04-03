<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { app, setup } from '@/assets/api'

const canvas = ref<HTMLCanvasElement | null>(null)

onMounted(async () => {
  await setup()
  canvas.value?.appendChild(app.canvas)
})
</script>

<template>
  <div style="display: flex; flex-direction: column;">
    <div class="game-bar">
      <button class="test-button">Play/Pause</button>
      <!-- <button class="test-button">Test 2</button> -->
      <button class="test-button">Fullscreen</button>
      <span style="font-size: 12px;">mouseX / mouseY</span>
      <span style="font-size: 12px;">FPS</span>
      <!-- <span style="flex: 1;">test</span> -->
    </div>
    <div id="game-container" ref="canvas" class="canvas"></div>
  </div>
</template>

<style scoped>
.canvas {
  width: 100%;
  height: 100%;
  flex: 1 1 auto;
  background-color: magenta;
}

.game-bar {
	display: flex;
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