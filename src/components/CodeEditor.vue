<script setup lang="ts">
import { computed, onMounted, ref, handleError } from 'vue'

import { useFileStore } from '@/stores/fileStore'
import { runUserCode } from '@/assets/api/core'
import { getExampleCode } from '@/assets/api/examples'

// CodeMirror
// import { Codemirror } from 'vue-codemirror'
// import { javascript } from '@codemirror/lang-javascript'
// import { completions } from '@/assets/code-completion/codemirror-completions'
// import { wordHover } from '@/assets/code-completion/codemirror-completions'

// import { nord } from '@fsegurai/codemirror-theme-nord'
// import { oneDark } from '@codemirror/theme-one-dark'
// const js = javascript()

// Monaco
// TODO:
//	- Theme
//	- Add commentary next to prop/method suggestions?
//	- Completions for formatting forever/repeat/etc., not just suggestions
//	- Look into disabling wordBasedSuggestions when accessing object properties (just check
//	  if previous char is a dot?)
//	- Move completion setup/logic into its own file
//	- Hover tips, explanation of classes/libs
import { CodeEditor, useCodeEditor, type EditorOptions } from 'monaco-editor-vue3'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

const editorOptions: EditorOptions = {
  fontSize: 14,
  minimap: { enabled: false },
  automaticLayout: true,
}

// Theme TODO
monaco.editor.defineTheme('nord', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
	colors: {
		'editor.background': '#2e3440',
		'editor.lineHighlightBackground': '#ffffff08',
		'editorLineNumber.foreground': '#d8dee944',
		'editorLineNumber.activeForeground': '#d8dee9',
		'editorWidget.background': '#252a33',
		'dropdown.background': '#252a33',
		'scrollbar.shadow': '#00000044',
		
		// 'editor.lineHighlightBorder': '#ffffff08',
		// 'editor.foreground': '#ff00ff',
		// 'editor.inactiveSelectionBackground': '#ff00ff',
	}
});

function handleMount(editor: monaco.editor.IStandaloneCodeEditor) {
	monaco.editor.setTheme('nord')
	
	// TODO: Look into setting up CodeLens, maybe for running specific sections of the code..?

	// Add the API lib as a model, this allows peeking definitions, but still needs work.
	// Useful for seeing type definitions but functions have no body.
	// Also, 'go to definiton' still doesn't work bc there's no visible area for the API lib model.
	monaco.editor.createModel(
		apiLib,
		'typescript',
		monaco.Uri.parse(apiUri)
	)

	editor.updateOptions({
		codeLens: false,
		definitionLinkOpensInPeek: true
	})
}

function handleErr(editor: monaco.editor.IStandaloneCodeEditor) {
	// console.log(editor)
}

// Example API
import { apiLib } from '@/assets/api/api'
const apiUri = 'file:///node_modules/@types/sunsprite/api.d.ts'

// monaco.typescript.typescriptDefaults.setExtraLibs([
//   {
//     content: apiLib,
//     filePath: apiUri // A virtual URI for the definitions
//   }
// ])

// Testing imports for intellisense libs
// import Sprite from '@/assets/api/Sprite'
// monaco.typescript.javascriptDefaults.addExtraLib(
// 	`declare module '@test/sprite' { ${Sprite} }`,
// 	'file:///api-whatev'
// )

// Set validation options
monaco.typescript.javascriptDefaults.setDiagnosticsOptions({
	noSemanticValidation: false,
	noSyntaxValidation: false,
})

// Disable DOM-based JS default completion suggestions
const compilerOptions = monaco.typescript.javascriptDefaults.getCompilerOptions()
monaco.typescript.javascriptDefaults.setCompilerOptions({
	...compilerOptions,
	// noLib: true,
	lib: ['es2022'],
	allowJs: true,
	checkJs: true,
	target: monaco.typescript.ScriptTarget.ES2020,
	strictNullChecks: true
})

monaco.typescript.javascriptDefaults.addExtraLib(apiLib, apiUri)
// monaco.typescript.javascriptDefaults.setExtraLibs([
//   {
//     content: apiLib,
//     filePath: apiUri, // A virtual URI for the definitions,
//   }
// ])

////////////////////////////////////////////

const code = ref('')
const fileStore = useFileStore()

// const isSaved = ref(true)
const saveColor = computed(() => {
	const rootStyles = window.getComputedStyle(document.documentElement)
	const nordTextBright = rootStyles.getPropertyValue('--nord-text-bright').trim()
	const nordTextDim = rootStyles.getPropertyValue('--nord-text-dim').trim()

	return fileStore.activeFileIsSaved ? nordTextDim : nordTextBright
})
const saveCursor = computed(() => {
	return fileStore.activeFileIsSaved ? 'default' : 'pointer'
})

const saveBtnFilter = computed(() => {
	return fileStore.activeFileIsSaved ? 'brightness(0.3) sepia(1) saturate(0.8) hue-rotate(180deg)' : 'brightness(0.8) sepia(0) saturate(0.8) hue-rotate(180deg)'
})
const saveBtnHoverFilter = computed(() => {
	return fileStore.activeFileIsSaved ? 'brightness(0.3) sepia(1) saturate(0.8) hue-rotate(180deg)' : 'brightness(1) sepia(0) saturate(0.8) hue-rotate(180deg)'
})

const saveMsgFilter = computed(() => {
	return fileStore.activeFileIsSaved ? '' : 'brightness(0.8)'
})
const saveMsgHoverFilter = computed(() => {
	return fileStore.activeFileIsSaved ? '' : 'brightness(1)'
})

// const extensions = [
// 	js,
//     js.language.data.of({
// 		autocomplete: completions
//     }),
// 	wordHover,
//     // oneDark,
// 	nord,
// ]

function getCode(): string {
	return code.value
}

function setCode(newCode: string) {
	code.value = newCode
}

function resetCode() {
	if (!confirm(`Reset ${fileStore.activeFileName} to default?`)) return
	code.value = getExampleCode(fileStore.activeFileName)
	updateSaveMsg()
}

function saveCurrentCode() {
	if (fileStore.activeFileIsSaved) return
	fileStore.saveCode(fileStore.activeFileName, code.value)
	updateSaveMsg(code.value)
}

function runActiveUserCode() {
	runUserCode(code.value)
}

function updateSaveMsg(checkCode?: string) {
	const saveElement = document.getElementById('save-msg')
	if (!saveElement) return

	const activeFile = fileStore.activeFileName
	const currentCode = checkCode ?? code.value
	const savedCode = fileStore.getLocalCode(activeFile)

	fileStore.activeFileIsSaved = currentCode === savedCode
	if (fileStore.activeFileIsSaved) {
		if (fileStore.savedThisSession(activeFile)) {
			saveElement.innerText = `Saved ${fileStore.getTimeSaved(activeFile)}`
		} else {
			saveElement.innerText = 'Unchanged'
		}
	} else {
		saveElement.innerText = 'Save'
	}
}

defineExpose({ runActiveUserCode, setCode, getCode, updateSaveMsg })

onMounted(() => {
	self.MonacoEnvironment = {
		getWorker(_, label) {
			if (label === 'json') {
				return new jsonWorker()
			}
			if (label === 'css' || label === 'scss' || label === 'less') {
				return new cssWorker()
			}
			if (label === 'html' || label === 'handlebars' || label === 'razor') {
				return new htmlWorker()
			}
			if (label === 'typescript' || label === 'javascript') {
				return new tsWorker()
			}
			return new editorWorker()
		}
	}

	fileStore.activate('main.js')
	code.value = fileStore.getLocalCode('main.js') ?? getExampleCode()
	runActiveUserCode()
	updateSaveMsg()
})

// TODO: 
//	- Visual indicator of save state (is saved/edited) / progress / completion
//	- Visual indicator that the game already running is not using the edited code (coloring the game reset button?)

// TO FIX:
//	- Editor bar gets very cramped at small widths, text overlaps, button shrinks instead of disappearing
</script>

<template>
	<div class="panel-wrapper">
		<div id="editor-bar">
			<div style="display: inline-flex; justify-self: start; padding-left: 10px;">
				<img id="save-btn" class="img-button" @click="saveCurrentCode" title="Save" src="/src/assets/images/game-icons/save.png" />
				<div id="save-msg" @click="saveCurrentCode"></div>
			</div>
			<div id="file-name">{{ fileStore.activeFileName }}</div>
			<img class="img-button"  style="justify-self: end; padding-right: 10px;" @click="resetCode" title="Reset code to default" src="/src/assets/images/game-icons/previous.png" />
			<!-- <button @click="runActiveUserCode" class="run-button">Run</button> -->
		</div>
		<div id="code-container" class="editor">
			<!-- <codemirror
				v-model="code"
				placeholder="/* ... */"
				:indent-with-tab="true"
				:tab-size="4"
				:extensions="extensions"
				:autofocus="true"
				:style="{
					maxHeight: '100%'
				}",
				@change="updateSaveMsg"
			/> -->
			<CodeEditor
				v-model:value="code"
				language="javascript"
				theme="nord"
				:options="editorOptions"
				@editorDidMount="handleMount"
				@change="updateSaveMsg"
				@error="handleErr"
			/>
		</div>
	</div>
</template>

<style scoped>
.editor {
	flex: 1 1 auto;
	overflow: visible;
}

#editor-bar {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	justify-items: center;
	/* border-bottom: 20px; */
}

#file-name {
	color: var(--nord-text-bright);
}

.run-button {
	height: 100%;
	width: 50px;
}

#save-msg {
	/* flex: 1 1 auto; */
	padding-left: 10px;
	color: v-bind(saveColor);
	filter: v-bind(saveMsgFilter);
	transition: color 0.25s ease-in;
	cursor: v-bind(saveCursor);
}
#save-msg:hover {
	filter: v-bind(saveMsgHoverFilter);
}

#save-btn {
	filter: v-bind(saveBtnFilter);
	transition: all 0.25s ease-in;
	cursor: v-bind(saveCursor);
	/* filter: saturate(1); */
	/* filter: hue-rotate(180deg); */
	/* filter: brightness(0.4) */
}
#save-btn:hover {
	filter: v-bind(saveBtnHoverFilter)
}

/* .save-info {

} */
</style>