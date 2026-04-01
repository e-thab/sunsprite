<script setup lang="ts">
import PixiCanvas from '@/components/PixiCanvas.vue'
import CodeEditor from '@/components/CodeEditor.vue'
</script>

<template>
  <div class="split-container">
    <div id="game-container" class="panel">
      <PixiCanvas ref="canvas" class="pixi-stage"/>
    </div>
    <CodeEditor ref="editor" class="panel"/>
  </div>
</template>

<style scoped>
.pixi-stage {
  width: 100%;
  height: 100%;
}

.split-container {
  display: flex;
}

.panel {
  flex: 1 1 100%;
  width: 100%;
  height: 100%;
  /* overflow-y: hidden; */
}
</style>