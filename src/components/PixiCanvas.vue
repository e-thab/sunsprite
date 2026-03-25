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
  <div ref="canvas" class="canvas"></div>
</template>

<style scoped>
.canvas {
  background-color: magenta;
}
</style>