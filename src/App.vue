<script setup lang="ts">
// import { RouterLink, RouterView } from 'vue-router'
import 'splitpanes/dist/splitpanes.css';
import EditorView from './views/EditorView.vue';
import NavBar from './components/NavBar.vue';
</script>

<template>
  <div class="wrapper">
    <NavBar class="navbar-header"/>
    <EditorView class="content"/>
    <!-- <NavBar class="navbar-footer"/> -->
  </div>
</template>

<style scoped>
.wrapper {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
.content {
  background-color: '#222';
  flex: 1 1 100%;
  /* width: 100%;
  height: 100%; */
  overflow-y: hidden;
}
.navbar-header {
  background-color: darkslategray;
  flex: 1;
}
</style>
