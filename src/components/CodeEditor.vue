<script setup lang="ts">
import { ref } from 'vue';
import { CodeEditor } from 'monaco-editor-vue3';

const code = ref(`
function hello() {
    console.log('Hello, Monaco Editor Vue3!');
}
hello();

const sprite = await addSprite('https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/330px-PNG_transparency_demonstration_1.png')

forever(() => {
    sprite.x += 1
})
`);

const editorOptions = {
    fontSize: 14,
    minimap: { enabled: false },
    automaticLayout: true
};

defineExpose({
    code
})
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