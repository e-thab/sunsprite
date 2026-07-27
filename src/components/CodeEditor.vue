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

	// Only create api model if it doesn't already exist (on first page load). This is only for dev purposes
	if (!monaco.editor.getModel(monaco.Uri.parse(modelUri))) {
		// Create the editor model. This is the virtual 'file' that all public api definitions exist in.
		monaco.editor.createModel(
			apiModel,
			'typescript',
			monaco.Uri.parse(modelUri)
		)
	}

	editor.updateOptions({
		codeLens: false,
		definitionLinkOpensInPeek: true,
		// fontFamily: 'Fira Code'
	})
}

function handleErr(editor: monaco.editor.IStandaloneCodeEditor) {
	// console.log(editor)
}

import { apiLib, apiModel } from '@/assets/api/apiLib'
const modelUri = 'file:///node_modules/@types/sunsprite/api.d.ts'
const libUri = 'file:///lib.ts'

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
	lib: ['es2020'],
	allowJs: true,
	checkJs: true,
	target: monaco.typescript.ScriptTarget.ES2020,
	strictNullChecks: true
})

monaco.typescript.javascriptDefaults.addExtraLib(apiModel, modelUri)
monaco.typescript.javascriptDefaults.addExtraLib(apiLib, libUri)
// monaco.typescript.javascriptDefaults.setExtraLibs([
//   {
//     content: apiLib,
//     filePath: apiUri, // A virtual URI for the definitions,
//   }
// ])

////////////////////////////////////////////

const code = ref('')
const fileStore = useFileStore()

const saveStatusText = ref('')
const saveStatusColor = computed(() => fileStore.activeFileIsSaved ? 'neutral' : 'warning')

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
	const activeFile = fileStore.activeFileName
	const currentCode = checkCode ?? code.value
	const savedCode = fileStore.getLocalCode(activeFile)

	fileStore.activeFileIsSaved = currentCode === savedCode
	if (fileStore.activeFileIsSaved) {
		saveStatusText.value = fileStore.savedThisSession(activeFile)
			? `Saved ${fileStore.getTimeSaved(activeFile)}`
			: 'Unchanged'
	} else {
		saveStatusText.value = 'Save'
	}
}

const emit = defineEmits(['ready'])
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
	emit('ready')
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
			<div class="save-group">
				<UTooltip text="Save">
					<UButton icon="tabler:device-floppy" variant="ghost" color="neutral" size="xs" @click="saveCurrentCode" />
				</UTooltip>
				<UBadge :color="saveStatusColor" variant="subtle" class="save-badge" @click="saveCurrentCode">{{ saveStatusText }}</UBadge>
			</div>
			<div id="file-name">{{ fileStore.activeFileName }}</div>
			<UTooltip text="Reset code to default" class="reset-group">
				<UButton icon="tabler:arrow-back-up" variant="ghost" color="neutral" size="xs" @click="resetCode" />
			</UTooltip>
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
	align-items: center;
	justify-items: center;
	padding: 0 10px;
	user-select: none;
}

#file-name {
	color: var(--nord-text-bright);
}

.save-group {
	display: inline-flex;
	align-items: center;
	gap: 0.5em;
	justify-self: start;
}

.save-badge {
	cursor: pointer;
}

.reset-group {
	justify-self: end;
}
</style>