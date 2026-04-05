<script setup lang="ts">
import { handleError, onMounted, ref, shallowRef } from 'vue';
import { CodeEditor, useCodeEditor, type EditorOptions } from 'monaco-editor-vue3';
import * as monaco from 'monaco-editor';
import { runUserCode, startCode } from '@/assets/api';
import { completions } from '@/assets/code-completion/codemirror-completions';
import { Codemirror } from 'vue-codemirror';
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { nord } from '@fsegurai/codemirror-theme-nord'
import { wordHover } from '@/assets/code-completion/codemirror-completions'

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

const code = ref(startCode)
const js = javascript()

const extensions = [
    js,
    js.language.data.of({
      autocomplete: completions
    }),
	wordHover,
    // oneDark,
	nord,
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

//   monaco.editor.create(document.getElementById('#code-container'), {
//     value: "function hello() {\n\talert('Hello world!');\n}",
//     language: 'javascript'
//   })
//   javascriptLanguage.data.of({
//     autocompletion: completions
//   })
})
</script>

<template>
	<div style="display: flex; flex-direction: column;">
		<div class="editor-bar">
			<button @click="runUserCode(code)" class="run-button">Run</button>
			<!-- <span style="flex: 1;">test</span> -->
		</div>
		<div id="code-container" class="editor">
			<!-- <CodeEditor
			v-model:value="code"
			language="javascript"
			theme="vs-dark"
			:options="editorOptions"
			/> -->
			<!-- @mount="handleMount"
			@error="handleErr" -->
			
			<codemirror
			v-model="code"
			placeholder="..."
			:autofocus="true"
			:indent-with-tab="true"
			:tab-size="4"
			:extensions="extensions"
			:style="{
				maxHeight: '100%',
			}"
			/>
			<!-- :style="{ overflowY: 'scroll' }" -->
			<!-- :style="{ overflow-y: 'auto' }" -->
			<!-- @ready="handleReady" -->
			<!-- @change="console.log('change', $event)"
			@focus="console.log('focus', $event)"
			@blur="console.log('blur', $event)" -->
		</div>
	</div>
</template>

<style scoped>

.editor {
	flex: 1 1 auto;
	background-color: #252a33;
	/* width: 100%; */
	/* height: 100%; */
	/* overflow-y: auto;
	overflow-x: auto; */
	overflow: auto;
	/* overflow:visible; */
}
.editor-bar {
	display: flex;
	justify-content: space-evenly;
	background-color: #252a33;
	height: 24px;
}
.run-button {
    /* position: absolute;
    left: 47%;
    right: 50%;
    top: 0;
    bottom: 97%; */
	/* width: 8%;
	min-width: 40px; */
	/* flex: 1; */
	height: 100%;
	width: 50px;
}
</style>