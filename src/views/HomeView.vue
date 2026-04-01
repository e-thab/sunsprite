<script setup lang="ts">
import PixiCanvas from '@/components/PixiCanvas.vue'
import CodeEditor from '@/components/CodeEditor.vue'
</script>

<template>
  <div class="split-container">
    <div id="game-container" class="panel">
      <PixiCanvas ref="canvas"/>
    </div>
    <CodeEditor ref="editor" class="panel"/>
  </div>
</template>

<style scoped>
.split-container {
  /* display: grid;
  grid-template-columns: 1fr 1fr; */
  display: flex;
  /* flex: 1; */
  /* width: 100vw; */
  /* height: 92vh; */
  /* overflow: hidden; */
}

.panel {
  flex: 1;
  /* height: 92vh; */
  /* overflow-y: hidden; */
}
</style>