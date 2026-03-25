<script setup lang="ts">
import { ref } from 'vue';
import { CodeEditor } from 'monaco-editor-vue3';
import { runUserCode } from '@/assets/api';

const code = ref(`const bunny = new Sprite({
    src: 'https://pixijs.com/assets/bunny.png',
    x: 200
})
const gator = new Sprite({
    src: 'https://woofjs.com/docs/images/river-gator.png'
})

forever(() => {
    bunny.rotation += 0.1
    bunny.rotateAround(gator, 2).degrees()
})
`);

const editorOptions = {
    fontSize: 14,
    minimap: { enabled: false },
    automaticLayout: true
};
</script>

<template>
  <div class="editor">
    <CodeEditor
      v-model:value="code"
      language="javascript"
      theme="vs-dark"
      :options="editorOptions"
    />
    <button @click="runUserCode(code)" class="run-button">Run</button>
  </div>
</template>

<style scoped>
.editor {
    overflow-y: auto;
}
.run-button {
    position: absolute;
    left: 47%;
    right: 50%;
    top: 0;
    bottom: 97%;
}
</style>