<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as Pixi from 'pixi.js'

const app: Pixi.Application = new Pixi.Application()
const canvas = ref<HTMLCanvasElement | null>(null)

onMounted(async () => {
  await app.init({
    background: '#00bd7e',
    resizeTo: document.querySelector('#game-container') as HTMLElement, // Dynamically update this on resize
    // width: 720,
    // height: 720,
    antialias: true,
    autoDensity: true
  })

  // stage.value = app.stage
  canvas.value?.appendChild(app.canvas)

  const texture = await Pixi.Assets.load('https://pixijs.com/assets/bunny.png')
  const bunny = new Pixi.Sprite(texture)
  app.stage.addChild(bunny)

  bunny.x = app.screen.width / 2
  bunny.y = app.screen.height / 2
  window.addEventListener('resize', async () => {
    await new Promise(resolve => setTimeout(resolve, 100))
    bunny.x = app.screen.width / 2
    bunny.y = app.screen.height / 2
  })

  bunny.pivot.x = bunny.width / 2;
  bunny.pivot.y = bunny.height / 2;

  app.ticker.add((time) => {
    // Continuously rotate the container!
    // * use delta to create frame-independent transform *
    bunny.rotation -= 0.01 * time.deltaTime;
  })
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