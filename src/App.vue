<script setup lang="ts">
// import { RouterLink, RouterView } from 'vue-router'
import 'splitpanes/dist/splitpanes.css';
import EditorView from './views/EditorView.vue';
import NavBar from './components/NavBar.vue';
</script>

<template>
  <UApp>
    <div class="wrapper">
      <NavBar class="navbar-header"/>
      <EditorView class="content"/>
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
