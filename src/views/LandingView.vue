<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { ButtonProps } from '@nuxt/ui'
import { useAuthStore } from '@/stores/authStore'
import { AUTO, Game, GameObjects, Scale, Scene, type Types as PhaserTypes } from 'phaser'

const router = useRouter()
const authStore = useAuthStore()

const links = computed<ButtonProps[]>(() => [
  {
    label: 'Open Sandbox',
    icon: 'tabler:sandbox',
    onClick: () => router.push('/sandbox'),
  },
  {
    label: 'Read the Docs',
    icon: 'tabler:book-filled',
    color: 'neutral',
    variant: 'subtle',
    onClick: () => router.push('/docs'),
  },
  authStore.isAuthenticated
    ? {
        label: 'My Projects',
        icon: 'tabler:folder-filled',
        color: 'neutral',
        variant: 'subtle',
        onClick: () => router.push('/projects'),
      }
    : {
        label: 'Sign In',
        icon: 'tabler:login',
        color: 'neutral',
        variant: 'subtle',
        onClick: () => authStore.openSignIn(),
      },
])

onMounted(() => {
  scene.value = new LandingScene()

  let config: PhaserTypes.Core.GameConfig = {
    type: AUTO,
    scale: {
      // mode: Phaser.Scale.RESIZE
      // mode: Scale.NONE
      autoCenter: Scale.Center.CENTER_BOTH,
      mode: Scale.EXPAND
    },
    parent: 'game',
    autoFocus: false,
    transparent: true,
    scene: scene.value
  }

  game.value = new Game(config)
})
const scene = ref<LandingScene>()
const game = ref<Game>()

class LandingScene extends Scene {
  sprite?: GameObjects.Sprite

  constructor() {
		super('main')
    // this.sprite = this.add.sprite(0, 0, '__MISSING')
	}

  preload() {
    // this.load.image('guy', 'assets/guy.png')
    this.load.image('gator', 'https://sunsprite.dev/sun.svg')
  }

  create() {
    this.sprite = this.add
      .sprite(0, 0, 'gator')
      .setScale(0.25, 0.25)
    ;
  }

  update() {
    const mousePos = this.input.activePointer.position
    this.sprite?.setPosition(mousePos.x, mousePos.y)
  }
}
</script>

<template>
  <div class="landing-view">
    <!-- <div id="game" class="foreground-canvas"></div> -->

    <UPageHero
      description="A super simple, browser-based game engine for JavaScript beginners, built on top of the Phaser engine. Sign up and create a project or jump into the sandbox to get started!"
      class="hero"
      :links="links"
    >
      <template #title>
        <span class="hero-title">
          <UIcon name="sunsprite:sun" class="hero-icon" />
          Sunsprite
        </span>
      </template>
    </UPageHero>
  </div>
</template>

<style scoped>
.foreground-canvas {
  position: absolute;
  z-index: 100;
}

.landing-view {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--theme-bg-accented);
}

/* .hero {
  inp
} */

.hero-title {
  display: inline-flex;
  align-items: center;
  gap: 0.2em;
}

.hero-icon {
  font-size: 0.85em;
  color: var(--theme-primary);
}
</style>
