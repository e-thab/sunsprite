<script setup lang="ts">
import { onMounted, ref } from 'vue';
import PixiCanvas from '@/components/PixiCanvas.vue'
import CodeEditor from '@/components/CodeEditor.vue'

const canvas = ref(null)
const editor = ref(null)
const api = ref(null)

onMounted(() => {
  // console.log(canvas.value)
  api.value = canvas.value.createGameAPI()
  // canvas.value.runUserCode(editor.value.code, api)
})

window.addEventListener('dblclick', async (e) => {
    // console.log(canvas.value)
    // console.log(editor.value)
    // console.log(api.value)
    await canvas.value?.runUserCode(editor.value.code, api.value)
})
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
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.panel {
  flex: 1;
  height: 100vh;
  overflow-y: hidden;
}
</style>