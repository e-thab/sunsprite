<script setup lang="ts">
import { handleError, onMounted, ref, shallowRef } from 'vue';
// import { CodeEditor, useCodeEditor, type EditorOptions } from 'monaco-editor-vue3';
import { myCompletions, runUserCode, startCode } from '@/assets/api';
import { Codemirror } from 'vue-codemirror';
import { javascript, javascriptLanguage } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import { autocompletion } from '@codemirror/autocomplete';

const code = ref(startCode)
const js = javascript()

const extensions = [
    js,
    js.language.data.of({
      autocomplete: myCompletions
    }),
    oneDark
]

// Codemirror EditorView instance ref
// const view = shallowRef(null)
// const handleReady = (payload) => {
//     view.value = payload.view
// }

// const editorOptions: EditorOptions = {
//   fontSize: 14,
//   minimap: { enabled: false },
//   automaticLayout: true
// }

// function handleMount(editor: any) {
  
// }

// function handleErr(editor: any) {
//   console.log(editor)
// }

onMounted(() => {
//   self.MonacoEnvironment = {
//     getWorker(_, label) {
//       if (label === 'json') {
//         return new jsonWorker()
//       }
//       if (label === 'css' || label === 'scss' || label === 'less') {
//         return new cssWorker()
//       }
//       if (label === 'html' || label === 'handlebars' || label === 'razor') {
//         return new htmlWorker()
//       }
//       if (label === 'typescript' || label === 'javascript') {
//         return new tsWorker()
//       }
//       return new editorWorker()
//     }
//   }

  // monaco.editor.create(document.getElementById('container'), {
  //   value: "function hello() {\n\talert('Hello world!');\n}",
  //   language: 'javascript'
  // })
  // javascriptLanguage.data.of({
  //   autocompletion: myCompletions
  // })
})
</script>

<template>
  <div class="editor">
    <!-- <CodeEditor
      v-model:value="code"
      language="javascript"
      theme="vs-dark"
      :options="editorOptions"
      @mount="handleMount"
      @error="handleErr"
    /> -->
    <codemirror
		v-model="code"
		placeholder="Code goes here..."
		:style="{ overflow: 'auto' }"
		:autofocus="true"
		:indent-with-tab="true"
		:tab-size="4"
		:extensions="extensions"
		/>
		<!-- @ready="handleReady" -->
		<!-- @change="console.log('change', $event)"
		@focus="console.log('focus', $event)"
		@blur="console.log('blur', $event)" -->
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