import * as monaco from 'monaco-editor'
import { SCRIPT_MONACO_LANGUAGES } from '@/languages/monacoLanguages'
import { assetKindForName, DEFAULT_TEXT_FILE_TYPE, splitFileName } from '@/utils/fileTypes'
import { describeMissingFile, type AssetKind, type NamedAsset } from '@/api/fileNames'

// Flags string literals that name a project file which doesn't exist —
// `new Sprite({ src: 'playr.png' })` — before the script ever runs. The
// declarations can't do this themselves: ImageSource/AudioSource (apiLib.ts)
// deliberately accept any string, so a name built at runtime still type-checks,
// which means a misspelt literal does too. Same reasoning, and the same shape,
// as monaco-colors.ts's unknown-color markers.
//
// Purely textual, like that one: any quoted, complete, bare file name with an
// image/audio/.txt extension counts, wherever it appears. A path or URL ('/', ':')
// isn't a project file name, and a template literal with a `${}` in it isn't
// a complete name, so neither is checked. The running game reports the same
// problems with the same wording (see describeMissingFile), for anything this
// misses.
const FILE_NAME_LITERAL_PATTERN = /(["'`])([^"'`\\/:\n${}]+\.[A-Za-z0-9]+)\1/g

const MARKER_OWNER = 'sunsprite-assets'
const MARKER_DEBOUNCE_MS = 250

let knownAssets: readonly NamedAsset[] = []
let knownNames = new Set<string>()

/** The project's current files, from CodeEditor.vue whenever they change. */
export function setKnownAssets(assets: readonly NamedAsset[]) {
	knownAssets = assets.map(({ name, kind }) => ({ name, kind }))
	knownNames = new Set(knownAssets.map((asset) => asset.name))
	for (const model of markerWatchers.keys()) {
		if (!model.isDisposed()) refreshMarkers(model)
	}
}

/**
 * Which kind of file a quoted name looks like it means, going by extension.
 * Text files only count as .txt — the one extension "New text file" creates.
 * A text file renamed to anything else still completes and still reads fine
 * with Files.read; a misspelling of one just isn't flagged here, the same as
 * any other unrecognized extension (the running game still reports it).
 */
function literalKind(name: string): AssetKind | undefined {
	const assetKind = assetKindForName(name)
	if (assetKind) return assetKind
	return splitFileName(name).extension.toLowerCase() === DEFAULT_TEXT_FILE_TYPE.extension ? 'text' : undefined
}

function refreshMarkers(model: monaco.editor.ITextModel) {
	const text = model.getValue()
	const markers: monaco.editor.IMarkerData[] = []

	for (const match of text.matchAll(FILE_NAME_LITERAL_PATTERN)) {
		const name = match[2]!
		if (knownNames.has(name)) continue
		const kind = literalKind(name)
		if (!kind) continue

		// Inside the quotes only, where a squiggle reads as "this name".
		const start = model.getPositionAt(match.index + 1)
		const end = model.getPositionAt(match.index + 1 + name.length)
		markers.push({
			severity: monaco.MarkerSeverity.Warning,
			message: describeMissingFile(name, kind, knownAssets),
			startLineNumber: start.lineNumber,
			startColumn: start.column,
			endLineNumber: end.lineNumber,
			endColumn: end.column,
		})
	}

	monaco.editor.setModelMarkers(model, MARKER_OWNER, markers)
}

const markerWatchers = new Map<monaco.editor.ITextModel, monaco.IDisposable>()
const markerTimers = new Map<monaco.editor.ITextModel, ReturnType<typeof setTimeout>>()

function scheduleRefresh(model: monaco.editor.ITextModel) {
	const pending = markerTimers.get(model)
	if (pending) clearTimeout(pending)

	markerTimers.set(model, setTimeout(() => {
		markerTimers.delete(model)
		if (!model.isDisposed()) refreshMarkers(model)
	}, MARKER_DEBOUNCE_MS))
}

function watchModel(model: monaco.editor.ITextModel) {
	if (markerWatchers.has(model)) return
	if (!SCRIPT_MONACO_LANGUAGES.includes(model.getLanguageId())) return

	markerWatchers.set(model, model.onDidChangeContent(() => scheduleRefresh(model)))
	refreshMarkers(model)
}

function unwatchModel(model: monaco.editor.ITextModel) {
	markerWatchers.get(model)?.dispose()
	markerWatchers.delete(model)

	const pending = markerTimers.get(model)
	if (pending) clearTimeout(pending)
	markerTimers.delete(model)
}

monaco.editor.onDidCreateModel(watchModel)
monaco.editor.onWillDisposeModel(unwatchModel)
monaco.editor.getModels().forEach(watchModel)
