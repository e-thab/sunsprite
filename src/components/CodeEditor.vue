<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { CodeEditor } from 'monaco-editor-vue3';
import { runUserCode, startCode } from '@/assets/api';

const code = ref(startCode)

const editorOptions = {
    fontSize: 14,
    minimap: { enabled: false },
    automaticLayout: true
}
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