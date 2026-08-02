<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, handleError } from 'vue'

import { useFileStore } from '@/stores/fileStore'
import { useThemeStore } from '@/stores/themeStore'
import { runUserCode } from '@/assets/api/core'
import { getExampleCode } from '@/assets/api/examples'
import { themes, buildMonacoThemeData, monacoThemeName } from '@/assets/theme/themes'
import { resolveSpecifierToName, listImportSpecifiers } from '@/assets/api/scriptResolution'
import { ModuleDetectionKind } from 'typescript'

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
  // Suggestion/hover/parameter-hint widgets position as `fixed` (viewport-
  // relative) instead of being clipped to the editor's own container. Lets
  // #code-pane use its normal overflow:hidden — needed because Monaco's
  // internal .overflow-guard div never actually shrinks below a few px even
  // when the pane is dragged fully closed, and overflow:visible let that
  // sliver bleed out over the splitter, blocking it.
  fixedOverflowWidgets: true,
}

// Define a Monaco theme for every app palette, sourced from the same
// data that drives the app's CSS variables (src/assets/theme/themes.ts).
for (const palette of themes) {
	monaco.editor.defineTheme(monacoThemeName(palette.id), buildMonacoThemeData(palette))
}

const authStore = useAuthStore()
const themeStore = useThemeStore()
const editorInstance = ref<monaco.editor.IStandaloneCodeEditor>()

function handleMount(editor: monaco.editor.IStandaloneCodeEditor) {
	editorInstance.value = editor
	monaco.editor.setTheme(monacoThemeName(themeStore.currentId))

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

	// Attach whichever script is (already) active — set synchronously in
	// this component's onMounted, or corrected by EditorView before Monaco
	// finished initializing — regardless of which happened first. Imported
	// scripts' models must exist *before* the active model is attached: the
	// TS worker's first diagnostics pass runs as soon as setModel happens,
	// and nothing re-triggers it later just because an unrelated model got
	// registered — so attaching first left imports permanently flagged as
	// unresolved until the user edited the content (forcing a recheck).
	const activeModel = ensureModel(fileStore.activeFileName)
	if (activeModel) {
		const importedNames = ensureImportedModels(activeModel.getValue())
		editor.setModel(activeModel)
		refreshDiagnostics(activeModel, importedNames)
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
import { useAuthStore } from '@/stores/authStore'
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
	strictNullChecks: true,
	// Without this, a script with no top-level import/export is treated as a
	// "global script" rather than a module, so its declarations silently leak
	// into every other open script's scope in the language service (no
	// "cannot find name" diagnostic, phantom autocomplete) even though
	// moduleRunner.ts genuinely isolates each script at runtime. Forcing
	// module semantics keeps the editor's view of cross-script visibility
	// consistent with actual execution: real imports required between
	// project scripts. The ambient Sunsprite API (apiLib/apiModel below) is
	// deliberately exempt via `declare global`, so it stays available
	// without an import.
	moduleDetection: ModuleDetectionKind.Force
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

const fileStore = useFileStore()

const saveStatusText = ref('')
const saveStatusColor = computed(() => fileStore.activeFileIsSaved ? 'neutral' : 'warning')

const activeMonacoTheme = computed(() => monacoThemeName(themeStore.currentId))
watch(activeMonacoTheme, (name) => monaco.editor.setTheme(name))

// One persistent Monaco model per script (keyed by resolved name, e.g.
// "helper.js"), at a stable file:///name.js URI — this is what lets
// Monaco's own TS/JS language service resolve imports between project
// scripts (real "cannot find module" errors, real hover types,
// autocomplete on real exports) instead of only ever seeing one file.
type ModelEntry = { model: monaco.editor.ITextModel, scriptId?: string }
const modelEntries = new Map<string, ModelEntry>()

// Same content source moduleRunner.ts reads at runtime, so the editor and
// the actual game execution always agree on what a script resolves to.
// In project mode a script that genuinely doesn't exist resolves to
// undefined (no phantom model, so Monaco correctly flags a real typo);
// guest mode always has example-code fallback content.
function resolveContent(name: string): string | undefined {
	const local = fileStore.getLocalCode(name)
	if (local !== undefined) return local
	if (!fileStore.projectId) return getExampleCode(name)
	return undefined
}

function ensureModel(name: string): monaco.editor.ITextModel | undefined {
	const existing = modelEntries.get(name)
	if (existing) return existing.model

	const content = resolveContent(name)
	if (content === undefined) return undefined

	const model = monaco.editor.createModel(content, 'javascript', monaco.Uri.parse('file:///' + name))
	const scriptId = fileStore.projectId ? fileStore.scripts.find((s) => s.name === name)?.id : undefined
	modelEntries.set(name, { model, scriptId })
	return model
}

// Walks a script's top-level imports and makes sure a model exists for each
// target — recursing into newly-created ones — so a whole import chain
// gets real models even for files the user hasn't opened yet. Returns the
// resolved names so callers can address the exact set of models involved.
function ensureImportedModels(source: string, visited: Set<string> = new Set()): Set<string> {
	for (const specifier of listImportSpecifiers(source)) {
		const name = resolveSpecifierToName(specifier)
		if (visited.has(name)) continue
		visited.add(name)

		const alreadyExisted = modelEntries.has(name)
		const model = ensureModel(name)
		if (model && !alreadyExisted) ensureImportedModels(model.getValue(), visited)
	}
	return visited
}

// NOTE: this only pre-warms the model (content + import graph); actually
// attaching it happens in handleMount, via the :key="fileStore.activeFileName"
// remount below — see the long comment on that binding for why.
function switchToScript(name: string) {
	const model = ensureModel(name)
	if (model) ensureImportedModels(model.getValue())
}

// Model creation is synchronous, but the TS worker's diagnostics scheduling
// still races it: monaco.editor.createModel() fires onDidCreateModel
// synchronously, which — for the very first model created — synchronously
// creates the worker and eagerly snapshots `editor.getModels()` for its
// initial sync, all before this function's own later-created import-target
// models exist. That first validation pass is permanently wrong (nothing
// re-checks later just because an unrelated model appeared), which is why
// only editing the content — the one thing that legitimately re-triggers
// validation — ever cleared it. A fixed setTimeout "fix" here just
// re-races the same problem on a delay; the deterministic fix is to await
// the worker's own getJavaScriptWorker(...uris) call, which resolves only
// once those exact URIs are actually synced, then force a fresh
// content-change event so validation reruns against a worker that's
// genuinely caught up.
async function refreshDiagnostics(model: monaco.editor.ITextModel, relatedNames: Iterable<string>) {
	const relatedUris = [...relatedNames]
		.map((name) => modelEntries.get(name)?.model.uri)
		.filter((uri): uri is monaco.Uri => uri !== undefined)
	const getWorker = await monaco.typescript.getJavaScriptWorker()
	await getWorker(model.uri, ...relatedUris)
	if (!model.isDisposed()) model.setValue(model.getValue())
}

// Project scripts renamed/deleted via FileTree.vue: Monaco models can't be
// renamed in place, so a rename carries the live (possibly unsaved)
// content over to a fresh model at the new URI; a deletion just disposes
// the orphaned one. One place owns this instead of threading it through
// every fileStore.renameScript/deleteScript call site.
watch(() => fileStore.scripts.map((s) => ({ id: s.id, name: s.name })), () => {
	if (!fileStore.projectId) return

	for (const [name, entry] of [...modelEntries]) {
		if (!entry.scriptId) continue

		const current = fileStore.scripts.find((s) => s.id === entry.scriptId)
		if (!current) {
			entry.model.dispose()
			modelEntries.delete(name)
			continue
		}
		if (current.name !== name) {
			const wasActive = editorInstance.value?.getModel() === entry.model
			const renamed = monaco.editor.createModel(entry.model.getValue(), 'javascript', monaco.Uri.parse('file:///' + current.name))
			entry.model.dispose()
			modelEntries.delete(name)
			modelEntries.set(current.name, { model: renamed, scriptId: entry.scriptId })
			if (wasActive) editorInstance.value?.setModel(renamed)
		}
	}
}, { deep: true })

// Switching projects (or leaving one for the guest sandbox): project-backed
// models from the *previous* project are stale and must not bleed into
// the next one — guest-mode models (no scriptId) are left alone.
watch(() => fileStore.projectId, () => {
	for (const [name, entry] of [...modelEntries]) {
		if (!entry.scriptId) continue
		entry.model.dispose()
		modelEntries.delete(name)
	}
})

onBeforeUnmount(() => {
	fileStore.registerSaveAllHandler(null)
	for (const entry of modelEntries.values()) entry.model.dispose()
	modelEntries.clear()
})

function getCode(): string {
	return modelEntries.get(fileStore.activeFileName)?.model.getValue() ?? ''
}

function setCode(newCode: string) {
	modelEntries.get(fileStore.activeFileName)?.model.setValue(newCode)
}

function resetCode() {
	if (!confirm(`Reset ${fileStore.activeFileName} to default?`)) return
	setCode(getExampleCode(fileStore.activeFileName))
	updateSaveMsg()
}

function saveCurrentCode() {
	if (!fileStore.isDirty(fileStore.activeFileName)) return
	fileStore.saveCode(fileStore.activeFileName, getCode())
	updateSaveMsg(getCode())
}

// Saves every script with an in-memory model that differs from its
// last-saved content — not just the active one — so the NavBar's "Save
// All" button covers edits made before switching away from a file.
async function saveAll() {
	for (const [name, entry] of modelEntries) {
		if (!fileStore.isDirty(name)) continue
		fileStore.saveCode(name, entry.model.getValue())
	}
	updateSaveMsg()
}

function runActiveUserCode() {
	runUserCode(getCode(), themeStore.current)
}

function onEditorChange(value: string) {
	updateSaveMsg(value)
	ensureImportedModels(value)
}

function updateSaveMsg(checkCode?: string) {
	const activeFile = fileStore.activeFileName
	const currentCode = checkCode ?? getCode()
	const savedCode = fileStore.getLocalCode(activeFile)

	if (currentCode === savedCode) fileStore.markClean(activeFile)
	else fileStore.markDirty(activeFile)

	if (fileStore.activeFileIsSaved) {
		saveStatusText.value = fileStore.savedThisSession(activeFile)
			? `Saved ${fileStore.getTimeSaved(activeFile)}`
			: 'Unchanged'
	} else {
		saveStatusText.value = 'Save'
	}
}

const emit = defineEmits(['ready'])
defineExpose({ runActiveUserCode, setCode, getCode, updateSaveMsg, switchToScript })

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
	ensureModel('main.js')
	fileStore.registerSaveAllHandler(saveAll)
	emit('ready')
})

// TODO: 
//	- Visual indicator of save state (is saved/edited) / progress / completion
//	- Visual indicator that the game already running is not using the edited code (coloring the game reset button?)

// TO FIX:
//	- Editor bar gets very cramped at small widths, text overlaps, button shrinks instead of disappearing
import type { DropdownMenuItem } from '@nuxt/ui'
const exampleVersionItems: DropdownMenuItem[][] = [
  [
    { label: 'v2.1.0', icon: 'uil:angle-double-up' },
    { label: 'v2.0.8', icon: 'uil:angle-double-up' },
  ],
  [
    { label: 'v1.9.2', icon: 'uil:angle-up' },
    { label: 'v1.5.0', icon: 'tabler:check', color: 'primary' },
    { label: 'v1.2.3', icon: 'uil:angle-down' },
    { label: 'v1.0.6', icon: 'uil:angle-down' },
  ],
  [
    { label: 'v0.1.0', icon: 'uil:angle-double-down' },
    { label: 'v0.1.1', icon: 'uil:angle-double-down' },
    { label: 'v0.0.12', icon: 'uil:angle-double-down' },
    { label: 'v0.0.7', icon: 'uil:angle-double-down' },
    { label: 'v0.0.3', icon: 'uil:angle-double-down' },
  ]
]
</script>

<template>
	<div class="panel-wrapper">
		<div id="editor-bar">
			<div class="save-group">
				<UTooltip text="Save">
					<UButton icon="tabler:device-floppy-filled" variant="ghost" :color="saveStatusColor" size="xs" @click="saveCurrentCode">{{ saveStatusText }}</UButton>
				</UTooltip>
			</div>

			<div id="file-name">{{ fileStore.activeFileName }}</div>

			<div class="reset-group">
				<!-- TODO: Right now I'm only checking if the user is signed in to decide how to display reset,
					ideally it will only exist in the sandbox view. Come back to this. -->
				<!-- <UTooltip v-if="!fileStore.projectId" text="Reset code to default">
					<UButton icon="tabler:arrow-back-up" label="Reset" variant="ghost" color="neutral" size="xs" @click="resetCode" />
				</UTooltip> -->

				<!-- TODO: Version selector -->
				<UFieldGroup>
					<UBadge color="primary" variant="subtle" size="md">v1.0.0</UBadge>
					<UDropdownMenu :items="exampleVersionItems">
					<UButton color="primary" variant="subtle" icon="tabler:chevron-down" size="xs"/>
					</UDropdownMenu>
				</UFieldGroup>
			</div>
		</div>
		<div id="code-container" class="editor">
			<!-- :key forces a full remount on file switch rather than calling
			     editorInstance.setModel() on the live instance. Calling setModel
			     a second time — from any later event (click, setTimeout, whatever),
			     not the initial synchronous mount — reliably hung the entire tab
			     in this Monaco version/environment, root cause not identified
			     despite ruling out model identity, FileTree-specific triggering,
			     the extra-lib size, layout thrashing, and worker-creation
			     failures. Full remount reuses the *initial* mount path, which is
			     proven reliable, at the cost of recreating the editor (and its
			     workers) on every file switch. -->
			<CodeEditor
				:key="fileStore.activeFileName"
				language="javascript"
				:theme="activeMonacoTheme"
				:options="editorOptions"
				@editorDidMount="handleMount"
				@change="onEditorChange"
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
	/* display: flex; */
	/* align-items: end; */
	/* justify-items: center; */
	/* padding: 0 10px; */
	user-select: none;
	/* max-height: 24px; */
}

#file-name {
	color: var(--theme-text-bright);
	justify-self: center;
}

.save-group {
	display: inline-flex;
	/* align-items: center; */
	/* gap: 0.5em; */
	justify-self: start;
}


.reset-group {
	justify-self: end;
	transform: translate(-1px, -1px)
}
</style>