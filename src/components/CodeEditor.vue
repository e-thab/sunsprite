<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch, handleError } from 'vue'

import { useFileStore } from '@/stores/fileStore'
import { useThemeStore } from '@/stores/themeStore'
import { runUserCode } from '@/sandbox/hostBridge'
import { getExampleCode } from '@/assets/api/examples'
import { themes, buildMonacoThemeData, monacoThemeName } from '@/assets/theme/themes'
import { resolveSpecifierToName, listImportSpecifiers } from '@/assets/api/scriptResolution'
import { TEXT_MONACO_LANGUAGE } from '@/assets/utils/fileTypes'
import '@/assets/code-completion/monaco-colors'
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
  fixedOverflowWidgets: true
}

// Define a Monaco theme for every app palette, sourced from the same
// data that drives the app's CSS variables (src/assets/theme/themes.ts).
for (const palette of themes) {
	monaco.editor.defineTheme(monacoThemeName(palette.id), buildMonacoThemeData(palette))
}

const authStore = useAuthStore()
const themeStore = useThemeStore()
// shallowRef, not ref: a plain ref() deep-reactive-wraps whatever object is
// assigned to it, and Monaco's editor instance leans hard on private/WeakMap-
// keyed internal state that's keyed by the *real* object's identity. Calling
// a method through Vue's reactive Proxy invokes it with `this` bound to the
// proxy instead of the real editor, which silently breaks anything relying
// on that internal state — observed as e.g. editorInstance.value.getModel()
// returning something that isn't === the model actually attached via
// setModel(), and revealLineInCenter() becoming a silent no-op.
const editorInstance = shallowRef<monaco.editor.IStandaloneCodeEditor>()

function handleMount(editor: monaco.editor.IStandaloneCodeEditor) {
	editorInstance.value = editor
	monaco.editor.setTheme(monacoThemeName(themeStore.currentId))

	// Registering this as a Monaco command (rather than a plain window
	// keydown listener) is what stops the browser's own "Save Page As"
	// dialog from appearing — Monaco's keybinding service calls
	// preventDefault() on the triggering keydown once a command claims it.
	// Rebound on every remount since commands live on the editor instance,
	// not the model (see the :key remount below).
	editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
		saveCurrentCode()
	})

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
		// A text file's model is plaintext — no import graph to pre-warm and no
		// JS/TS worker attached to it at all, so none of the diagnostics dance
		// below applies; just show it.
		if (fileStore.isTextFile(fileStore.activeFileName)) {
			editor.setModel(activeModel)
		} else {
			const importedNames = ensureImportedModels(activeModel.getValue())
			// Hide validation squiggles for the duration of refreshDiagnostics
			// below, rather than touching marker data directly (e.g. clearing
			// markers to suppress them) — monaco.editor.setModelMarkers() fires
			// onDidChangeMarkers itself, which re-enters any listener watching
			// for the real correction and clobbers it with the empty state just
			// written. renderValidationDecorations is a per-editor rendering
			// option, entirely separate from marker data, so there's nothing for
			// our own writes to re-trigger.
			editor.updateOptions({ renderValidationDecorations: 'off' })
			editor.setModel(activeModel)
			refreshDiagnostics(editor, activeModel, importedNames)
		}

		if (pendingReveal && pendingReveal.script === fileStore.activeFileName) {
			editor.revealLineInCenter(pendingReveal.line)
			pendingReveal = null
		}
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

// Add a command to the palette that allows inspecting tokens, for theme debugging
monaco.editor.addEditorAction({
  id: 'inspect-tokens',
  label: 'Inspect Token At Cursor',
  run: function(ed) {
    const position = ed.getPosition();
    const model = ed.getModel();
    
	if (!model || !position) return
    // Force line tokenization evaluation
    const lineTokens = monaco.editor.tokenize(model.getLineContent(position.lineNumber), 'javascript')[0];
    
    console.log("Tokens found on current line:", lineTokens);
  }
});

////////////////////////////////////////////

const fileStore = useFileStore()

const saveStatusText = ref('')
const saveStatusColor = computed(() => fileStore.activeFileIsSaved ? 'neutral' : 'warning')

const activeMonacoTheme = computed(() => monacoThemeName(themeStore.currentId))
watch(activeMonacoTheme, (name) => monaco.editor.setTheme(name))

// One persistent Monaco model per script or text file (keyed by resolved
// name, e.g. "helper.js"), at a stable file:///name URI — this is what lets
// Monaco's own TS/JS language service resolve imports between project
// scripts (real "cannot find module" errors, real hover types,
// autocomplete on real exports) instead of only ever seeing one file. Text
// files never participate in that graph (see ensureImportedModels/
// onEditorChange/switchToScript below, all guarded on isTextFile) — their
// model just holds plaintext content with no worker attached.
type ModelEntry = { model: monaco.editor.ITextModel, recordId?: string, isText?: boolean }
const modelEntries = new Map<string, ModelEntry>()

// Highlight for the line a runtime error was thrown on (see revealErrorLine).
// Decorations live on the model, not the editor instance, so this survives
// the inner <CodeEditor>'s remount on file switch (:key="activeFileName"
// below) — only one is ever live at a time, matching "the current error".
let currentErrorDecoration: { model: monaco.editor.ITextModel, ids: string[], line: number } | null = null

// Watches the decorated model for edits that land on the decorated line
// itself, so fixing the offending line clears the highlight (editor and
// FileTree both) without waiting for the next run — see applyErrorDecoration.
let errorDecorationWatcher: monaco.IDisposable | null = null

// Set when revealErrorLine targets a script that isn't the one currently
// attached to the (possibly not-yet-remounted) editor; handleMount consumes
// it once that script's model actually gets attached.
let pendingReveal: { script: string, line: number } | null = null

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

	const isText = fileStore.isTextFile(name)
	const model = monaco.editor.createModel(content, isText ? TEXT_MONACO_LANGUAGE : 'javascript', monaco.Uri.parse('file:///' + name))
	const record = fileStore.projectId
		? (fileStore.scripts.find((s) => s.name === name) ?? fileStore.textFiles.find((f) => f.name === name))
		: undefined
	modelEntries.set(name, { model, recordId: record?.id, isText })
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
	if (model && !fileStore.isTextFile(name)) ensureImportedModels(model.getValue())
}

function applyErrorDecoration(model: monaco.editor.ITextModel, line: number) {
	errorDecorationWatcher?.dispose()
	errorDecorationWatcher = null
	if (currentErrorDecoration) {
		currentErrorDecoration.model.deltaDecorations(currentErrorDecoration.ids, [])
	}
	const clampedLine = Math.min(Math.max(1, line), model.getLineCount())
	const ids = model.deltaDecorations([], [{
		range: new monaco.Range(clampedLine, 1, clampedLine, 1),
		options: {
			isWholeLine: true,
			className: 'error-line-highlight',
			marginClassName: 'error-line-margin',
		},
	}])
	currentErrorDecoration = { model, ids, line: clampedLine }

	const decorationId = ids[0]
	if (!decorationId) return

	errorDecorationWatcher = model.onDidChangeContent((event) => {
		// setValue()-driven resets (refreshDiagnostics's forced re-check below)
		// flag as a "flush", not a real edit — reapplyErrorDecoration handles
		// restoring the decoration those cause on its own, right after.
		if (event.isFlush) return
		if (!currentErrorDecoration || currentErrorDecoration.model !== model) return

		// The decoration's own tracked range, not the line it was created at —
		// edits elsewhere in the file (adding lines above it, say) shift where
		// it actually sits, and this stays correct through all of that.
		const liveRange = model.getDecorationRange(decorationId)
		if (!liveRange) return

		const touchedDecoratedLine = event.changes.some((change) =>
			change.range.startLineNumber <= liveRange.startLineNumber && change.range.endLineNumber >= liveRange.startLineNumber
		)
		if (touchedDecoratedLine) clearErrorDecoration()
	})
}

// refreshDiagnostics (below) forces a fresh model.setValue() to re-trigger
// the TS worker, which — being a full content replace rather than an edit —
// silently drops any decorations that were sitting on the model, including
// the error highlight. Called right after that setValue so the highlight
// reappears immediately instead of vanishing for whatever's left of
// refreshDiagnostics's settle window.
function reapplyErrorDecoration(model: monaco.editor.ITextModel) {
	if (currentErrorDecoration && currentErrorDecoration.model === model) {
		applyErrorDecoration(model, currentErrorDecoration.line)
	}
}

// Full reset of every bit of "there's a current runtime error" state — the
// Monaco decoration, its edit watcher, a still-pending reveal, and FileTree's
// matching highlight (see fileStore.erroredScriptName) — all of which only
// ever point at one error at a time, so nothing here needs to be selective.
function clearErrorDecoration() {
	errorDecorationWatcher?.dispose()
	errorDecorationWatcher = null
	if (currentErrorDecoration) {
		currentErrorDecoration.model.deltaDecorations(currentErrorDecoration.ids, [])
		currentErrorDecoration = null
	}
	pendingReveal = null
	fileStore.clearErroredScript()
}

/**
 * Highlights the line a runtime error was thrown on, in whichever script it
 * happened in — called from EditorView when the user clicks a runtime
 * error's "at script:line" link in the output panel (see output.ts's
 * onJumpToError). The target script may not be the one currently open, so
 * this only scrolls it into view immediately when it already is; otherwise
 * handleMount finishes the job once switchToScript's remount attaches it.
 */
function revealErrorLine(script: string, line: number) {
	const model = ensureModel(script)
	if (!model) return

	applyErrorDecoration(model, line)

	if (editorInstance.value && editorInstance.value.getModel() === model) {
		editorInstance.value.revealLineInCenter(line)
		pendingReveal = null
	} else {
		pendingReveal = { script, line }
	}
}

// Resolves once no marker-change event has landed for `uri` for `quietMs`,
// or after `timeoutMs` regardless (so a pathological case that never
// settles can't leave a model suppressed forever). Needed because the
// validation pass triggered by refreshDiagnostics's forced setValue isn't
// guaranteed to be the last stale one: under a slow-to-start TS worker
// (observed: ~4s in dev, almost certainly Vite cold-building the ts.worker
// chunk), a straggler pass scheduled before the sync landed can still fire
// *after* it and briefly repaint the stale "Cannot find module" marker.
function waitForMarkersToSettle(uri: monaco.Uri, quietMs = 500, timeoutMs = 5000): Promise<void> {
	return new Promise((resolve) => {
		let quietTimer: ReturnType<typeof setTimeout>
		const overallTimeout = setTimeout(finish, timeoutMs)
		const disposable = monaco.editor.onDidChangeMarkers((changedUris) => {
			if (!changedUris.some((u) => u.toString() === uri.toString())) return
			clearTimeout(quietTimer)
			quietTimer = setTimeout(finish, quietMs)
		})
		quietTimer = setTimeout(finish, quietMs)

		function finish() {
			clearTimeout(quietTimer)
			clearTimeout(overallTimeout)
			disposable.dispose()
			resolve()
		}
	})
}

// On the very coldest load in a browser session, getJavaScriptWorker() (or
// the accessor it returns) can outright throw "JavaScript not registered!"
// — the JS language mode itself hasn't finished registering with Monaco
// yet, not a permanent failure. A few short retries are enough to ride
// that out once registration completes moments later.
async function syncWithRetry(uri: monaco.Uri, relatedUris: monaco.Uri[], attempts = 5, delayMs = 300): Promise<void> {
	for (let attempt = 1; attempt <= attempts; attempt++) {
		try {
			const getWorker = await monaco.typescript.getJavaScriptWorker()
			await getWorker(uri, ...relatedUris)
			return
		} catch (err) {
			if (attempt === attempts) throw err
			await new Promise((resolve) => setTimeout(resolve, delayMs))
		}
	}
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
// genuinely caught up. Even so, the caller (handleMount) already turned
// renderValidationDecorations off before attaching this model, so none of
// the intermediate (wrong) passes this triggers ever reach the screen —
// this function's only remaining job is to turn it back on once things
// have actually settled.
async function refreshDiagnostics(editor: monaco.editor.IStandaloneCodeEditor, model: monaco.editor.ITextModel, relatedNames: Iterable<string>) {
	const relatedUris = [...relatedNames]
		.map((name) => modelEntries.get(name)?.model.uri)
		.filter((uri): uri is monaco.Uri => uri !== undefined)
	try {
		await syncWithRetry(model.uri, relatedUris)
		if (!model.isDisposed()) {
			model.setValue(model.getValue())
			reapplyErrorDecoration(model)
		}
	} catch (err) {
		console.error(`Failed to sync ${model.uri} with the TS worker after retries`, err)
	}

	// Wait for settle regardless of whether the sync above succeeded — even
	// on total sync failure, this is what keeps us from showing whatever the
	// *first* thing to paint happens to be, rather than what it settles on.
	await waitForMarkersToSettle(model.uri)

	// editor.getModel() reads null once disposed (e.g. the user switched
	// files again before this resolved, tearing down this editor instance
	// via the :key remount) — updateOptions on a disposed editor is
	// pointless at best, so skip it rather than assume this is still the
	// live instance.
	if (editor.getModel()) editor.updateOptions({ renderValidationDecorations: 'on' })
}

// Project scripts *and text files* renamed/deleted via FileTree.vue: Monaco
// models can't be renamed in place, so a rename carries the live (possibly
// unsaved) content over to a fresh model at the new URI; a deletion just
// disposes the orphaned one. One place owns this instead of threading it
// through every fileStore.renameScript/renameTextFile/delete* call site.
watch(
	() => [...fileStore.scripts.map((s) => ({ id: s.id, name: s.name })), ...fileStore.textFiles.map((f) => ({ id: f.id, name: f.name }))],
	() => {
		if (!fileStore.projectId) return

		for (const [name, entry] of [...modelEntries]) {
			if (!entry.recordId) continue

			const current = fileStore.scripts.find((s) => s.id === entry.recordId) ?? fileStore.textFiles.find((f) => f.id === entry.recordId)
			if (!current) {
				entry.model.dispose()
				modelEntries.delete(name)
				continue
			}
			if (current.name !== name) {
				const wasActive = editorInstance.value?.getModel() === entry.model
				const language = entry.isText ? TEXT_MONACO_LANGUAGE : 'javascript'
				const renamed = monaco.editor.createModel(entry.model.getValue(), language, monaco.Uri.parse('file:///' + current.name))
				entry.model.dispose()
				modelEntries.delete(name)
				modelEntries.set(current.name, { model: renamed, recordId: entry.recordId, isText: entry.isText })
				if (wasActive) editorInstance.value?.setModel(renamed)
			}
		}
	},
	{ deep: true },
)

// Switching projects (or leaving one for the guest sandbox): project-backed
// models from the *previous* project are stale and must not bleed into
// the next one — guest-mode models (no recordId) are left alone.
watch(() => fileStore.projectId, () => {
	for (const [name, entry] of [...modelEntries]) {
		if (!entry.recordId) continue
		entry.model.dispose()
		modelEntries.delete(name)
	}
})

onBeforeUnmount(() => {
	fileStore.registerSaveAllHandler(null)
	errorDecorationWatcher?.dispose()
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

// Runs `name` as the entry script regardless of which file is currently
// active/visible — used for the game header's Restart (always "main.js",
// see runMainScript) and FileTree's per-script "Run" action, neither of
// which should yank the editor over to a different tab just to run it.
// ensureModel loads a script that's never been opened from its last saved
// content; one that's already open (with live, possibly unsaved edits)
// keeps using that model, same as running the active file always has.
function runNamedScript(name: string) {
	clearErrorDecoration()
	const code = ensureModel(name)?.getValue() ?? ''
	runUserCode(code, name, themeStore.current)
}

function runActiveUserCode() {
	runNamedScript(fileStore.activeFileName)
}

// The game header's Restart button always runs this — "main.js" is the
// project's canonical entry point regardless of whichever script happens to
// be open in the editor at the time.
function runMainScript() {
	runNamedScript('main.js')
}

function onEditorChange(value: string) {
	updateSaveMsg(value)
	if (!fileStore.isTextFile(fileStore.activeFileName)) ensureImportedModels(value)
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
defineExpose({ runActiveUserCode, runMainScript, runNamedScript, setCode, getCode, updateSaveMsg, switchToScript, revealErrorLine })

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

			<div id="file-name">
				<span>{{ fileStore.activeFileName }}</span>

				<!-- Runs just this script as the entry point, regardless of
				     which one the game header's Restart button runs (always
				     main.js — see runMainScript). Text files aren't scripts. -->
				<UTooltip v-if="!fileStore.isTextFile(fileStore.activeFileName)" text="Run this script">
					<UButton icon="tabler:player-play-filled" variant="ghost" color="neutral" size="xs" @click="runActiveUserCode" />
				</UTooltip>
			</div>

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
	display: inline-flex;
	align-items: center;
	gap: 0.25em;
	color: var(--theme-text);
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

<!-- Unscoped: these target Monaco's own decoration DOM, which it creates
     outside this component's scoped-attribute reach regardless of where
     the model is attached. -->
<style>
.error-line-highlight {
	background-color: color-mix(in srgb, var(--theme-error) 18%, transparent);
}

.error-line-margin {
	border-left: 3px solid var(--theme-error);
}
</style>