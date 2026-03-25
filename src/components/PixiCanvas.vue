<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as myApi from '../assets/api.ts'
import * as Pixi from 'pixi.js'

const app: Pixi.Application = new Pixi.Application()
const canvas = ref<HTMLCanvasElement | null>(null)
let bunnySprite: Pixi.Sprite | null = null

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

  bunnySprite = bunny

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

function createGameAPI() {
  return {
    app,

    async addSprite(url: string, x = 0, y = 0) {
      const texture = await Pixi.Assets.load(url)
      const sprite = new Pixi.Sprite(texture)

      sprite.x = x
      sprite.y = y

      app.stage.addChild(sprite)

      return sprite
    },

    addText(text: string, x = 0, y = 0) {
      const label = new Pixi.Text({ text })

      label.x = x
      label.y = y

      app.stage.addChild(label)

      return label
    },

    forever(fn: Function) {
      app.ticker.add((time) => {
        fn()
      })
    },

    clear() {
      app.stage.removeChildren()
    }
  }
}

async function runUserCode(code: string, api: Record<string, any>) {
  try {
    const keys = Object.keys(api)
    const values = Object.values(api)

    const fn = new Function(
      ...keys,
      `
      return (async () => {
        ${code}
      })()
      `
    )
    api.clear()
    await fn(...values)

  } catch (err) {
    console.error('User code error:', err)
  }
}

defineExpose({
  app,
  createGameAPI,
  runUserCode
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