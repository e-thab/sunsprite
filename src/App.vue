<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue';
import { RouterView } from 'vue-router'
import 'splitpanes/dist/splitpanes.css';
import NavBar from './components/NavBar.vue';
import { useAuthStore } from './stores/authStore';

const authStore = useAuthStore()

// Nuxt UI's components read the `dark` class off <html> for all their color
// tokens (including teleported ones, like modals, that render outside this
// component's own DOM). Something in the mount pipeline clears that class
// shortly after initial load, so pin it back with an observer rather than a
// one-shot assignment.
let classObserver: MutationObserver | undefined

function ensureDarkClass() {
  if (!document.documentElement.classList.contains('dark')) {
    document.documentElement.classList.add('dark')
  }
}

onMounted(() => {
  authStore.init()

  ensureDarkClass()
  classObserver = new MutationObserver(ensureDarkClass)
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
  color: var(--nord-text-bright);
  background-color: var(--nord-background-light);
  flex: 1;
}
</style>
