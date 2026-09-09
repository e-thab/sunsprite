import * as monaco from 'monaco-editor'
import { ModuleDetectionKind } from 'typescript'
import { SCRIPT_FILE_TYPES, scriptTypeForFile, type ScriptLanguageId } from '@/assets/utils/fileTypes'

// Everything the editor has to set up *per script language*, in one place.
//
// JavaScript and TypeScript are both served by Monaco's TypeScript language
// service, but through two entirely separate LanguageServiceDefaults objects:
// extra libs and compiler options registered on one are invisible to the
// other. So every call that used to go straight to `javascriptDefaults` has to
// fan out across both, and doing that at each call site is how the two drift.
//
// The `defaults` field is deliberately optional. A language with no TypeScript
// service behind it — Python, if it lands — registers a descriptor here with
// that field absent and its own providers instead, and every consumer below
// already handles that case rather than assuming a service exists. That's the
// seam: adding a third language should be an entry here, not a rewrite of
// CodeEditor.vue.

type WorkerAccessor = (...uris: monaco.Uri[]) => Promise<unknown>

export interface EditorLanguageSupport {
	id: ScriptLanguageId
	monacoLanguage: string
	/** The TS language service behind this language, when there is one. */
	defaults?: monaco.typescript.LanguageServiceDefaults
	/** Resolves the worker serving this language, for forcing a diagnostics sync. */
	getWorkerAccessor?: () => Promise<WorkerAccessor>
}

// What both languages check against. Lifted verbatim from what CodeEditor.vue
// used to set on javascriptDefaults alone, so JavaScript's behavior is
// unchanged by TypeScript's arrival.
const SHARED_COMPILER_OPTIONS: monaco.typescript.CompilerOptions = {
	lib: ['es2020'],
	allowJs: true,
	checkJs: true,
	// Sunsprite scripts are imported by their real stored name — './helper.ts'
	// is what the file is actually called, and what moduleRunner resolves at
	// runtime. Without this, TypeScript rejects its own extension in a
	// specifier ("An import path can only end with a '.ts' extension when
	// 'allowImportingTsExtensions' is enabled") and every explicit .ts import
	// carries a squiggle over a path that resolves perfectly well. The usual
	// reason to leave it off — that tsc has to rewrite the specifier on emit —
	// doesn't apply: nothing here emits, and the runtime does its own
	// resolution (see scriptResolution.ts).
	allowImportingTsExtensions: true,
	target: monaco.typescript.ScriptTarget.ES2020,
	strictNullChecks: true,
	// Without this, a script with no top-level import/export is treated as a
	// "global script" rather than a module, so its declarations silently leak
	// into every other open script's scope in the language service (no
	// "cannot find name" diagnostic, phantom autocomplete) even though
	// moduleRunner.ts genuinely isolates each script at runtime. Forcing
	// module semantics keeps the editor's view of cross-script visibility
	// consistent with actual execution: real imports required between
	// project scripts. The ambient Sunsprite API (apiLib/apiModel) is
	// deliberately exempt via `declare global`, so it stays available
	// without an import.
	moduleDetection: ModuleDetectionKind.Force,
}

const SUPPORTS: EditorLanguageSupport[] = [
	{
		id: 'javascript',
		monacoLanguage: 'javascript',
		defaults: monaco.typescript.javascriptDefaults,
		getWorkerAccessor: () => monaco.typescript.getJavaScriptWorker(),
	},
	{
		id: 'typescript',
		monacoLanguage: 'typescript',
		defaults: monaco.typescript.typescriptDefaults,
		getWorkerAccessor: () => monaco.typescript.getTypeScriptWorker(),
	},
]

/** Which language's setup serves a given file, keyed off its extension. */
export function languageSupportFor(fileName: string): EditorLanguageSupport {
	const type = scriptTypeForFile(fileName)
	return SUPPORTS.find((support) => support.id === type.id) ?? SUPPORTS[0]!
}

/** Every Monaco language id a *script* can be opened under — never plaintext. */
export const SCRIPT_MONACO_LANGUAGES: string[] = SCRIPT_FILE_TYPES.map((type) => type.monacoLanguage)

/**
 * Diagnostics and compiler options for every language that has a service.
 * Called once, at module load, before any model exists.
 *
 * TypeScript gets `strict` on top of the shared options and JavaScript
 * doesn't, which is the one deliberate difference between them: an
 * unannotated parameter is ordinary JavaScript but an unfinished thought in a
 * .ts file, and someone who picked TypeScript asked to be told about it.
 */
export function configureLanguageServices() {
	for (const support of SUPPORTS) {
		if (!support.defaults) continue

		support.defaults.setDiagnosticsOptions({
			noSemanticValidation: false,
			noSyntaxValidation: false,
		})

		support.defaults.setCompilerOptions({
			...support.defaults.getCompilerOptions(),
			...SHARED_COMPILER_OPTIONS,
			...(support.id === 'typescript' ? { strict: true } : {}),
		})
	}
}

/**
 * Installs one declaration file into every language's service at the same URI,
 * handing back a single disposable covering all of them.
 *
 * addExtraLib layers rather than replaces, so swapping an API version means
 * disposing what's there first — and that has to happen for both languages
 * together or they end up on different versions of the API (see
 * CodeEditor.vue's selectedVersion watcher).
 */
export function installExtraLib(text: string, uri: string): monaco.IDisposable {
	const installed = SUPPORTS
		.map((support) => support.defaults?.addExtraLib(text, uri))
		.filter((disposable): disposable is monaco.IDisposable => disposable !== undefined)

	return { dispose: () => installed.forEach((disposable) => disposable.dispose()) }
}
