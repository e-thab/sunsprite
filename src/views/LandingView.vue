<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { ButtonProps } from '@nuxt/ui'
import { useAuthStore } from '@/stores/authStore'

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
</script>

<template>
  <div class="landing-view">
    <UPageHero
      description="A super simple, browser-based game engine for JavaScript beginners, built on top of the Phaser engine. Sign up and create a project or jump into the sandbox to get started!"
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
.landing-view {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--theme-bg-elevated);
}

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
