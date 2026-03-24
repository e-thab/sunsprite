<script setup lang="ts">
import { ref } from 'vue';
import { CodeEditor } from 'monaco-editor-vue3';

const code = ref(`function hello() {
    console.log('Hello, Monaco Editor Vue3!');
}`);

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
  </div>
</template>

<style scoped>
.editor {
    overflow-y: auto;
}
</style>