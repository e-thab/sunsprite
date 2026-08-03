<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { RouterView } from 'vue-router'
import 'splitpanes/dist/splitpanes.css';
import NavBar from './components/NavBar.vue';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';

const authStore = useAuthStore()
const themeStore = useThemeStore()

// Nuxt UI's components read the `dark`/`light` class off <html> for all
// their color tokens (including teleported ones, like modals, that render
// outside this component's own DOM). Something in the mount pipeline clears
// that class shortly after initial load, so pin it back with an observer
// rather than a one-shot assignment. Reads the *current* theme rather than
// hardcoding `dark` so this stays correct once a light theme exists.
let classObserver: MutationObserver | undefined

function ensureThemeClass() {
  const html = document.documentElement
  const wantDark = !themeStore.current.isLight
  if (html.classList.contains('dark') !== wantDark) {
    html.classList.toggle('dark', wantDark)
    html.classList.toggle('light', !wantDark)
  }
}

onMounted(() => {
  authStore.init()
  themeStore.init()

  ensureThemeClass()
  classObserver = new MutationObserver(ensureThemeClass)
  classObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => classObserver?.disconnect())
</script>

<template>
  <UApp>
    <div class="wrapper">
      <NavBar class="navbar-header"/>
      <RouterView class="content"/>
      <!-- <NavBar class="navbar-footer"/> -->
    </div>
  </UApp>
</template>

<style scoped>
.wrapper {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.content {
  flex: 1 1 100%;
  overflow-y: hidden;
}
.navbar-header {
  color: var(--theme-text);
  background-color: var(--theme-bg-accented);
  flex: 1;
}
</style>
