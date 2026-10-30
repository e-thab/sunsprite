import * as monaco from 'monaco-editor'
import { LANGUAGE_SUPPORTS } from '@/languages/monacoLanguages'

// Warns about `wait(2)` written as a statement on its own, without `await`.
// It type-checks fine and throws nothing, but the promise it returns is
// dropped, so the next line runs immediately: the pause the script reads as
// having never happens. TypeScript has no diagnostic for this (it's lint
// territory, typescript-eslint's no-floating-promises), so the check lives in
// our own TS worker (tsSemantic.worker.ts), where the real AST and checker can
// tell the API's wait from a user function of the same name, and skip
// comments and strings for free.
//
// Only wait, not every promise-returning API call: a bare `smoothTo(...)` is
// a perfectly good "start this and carry on", while a bare wait can't do
// anything at all.

interface FloatingWaitWorker {
	getFloatingWaitCalls(fileName: string): Promise<{ start: number, length: number }[]>
}

const MARKER_OWNER = 'sunsprite-floating-wait'
const MARKER_DEBOUNCE_MS = 250
const MESSAGE = "wait() doesn't pause anything without `await`, so the next line runs right away. Write `await wait(...)` to wait here."

async function refreshMarkers(model: monaco.editor.ITextModel) {
	const support = LANGUAGE_SUPPORTS.find((s) => s.monacoLanguage === model.getLanguageId())
	if (!support?.getWorkerAccessor) return

	const version = model.getVersionId()
	let spans: { start: number, length: number }[]
	try {
		const getWorker = await support.getWorkerAccessor()
		const worker = (await getWorker(model.uri)) as FloatingWaitWorker
		spans = await worker.getFloatingWaitCalls(model.uri.toString())
	} catch {
		// The worker can briefly not know a model it's asked about (e.g.
		// mid-remount). The next edit asks again.
		return
	}
	// Spans computed against older text would land in the wrong places; the
	// edit that changed it has already scheduled a fresh check.
	if (model.isDisposed() || model.getVersionId() !== version) return

	const markers = spans.map(({ start, length }): monaco.editor.IMarkerData => {
		const from = model.getPositionAt(start)
		const to = model.getPositionAt(start + length)
		return {
			severity: monaco.MarkerSeverity.Warning,
			message: MESSAGE,
			startLineNumber: from.lineNumber,
			startColumn: from.column,
			endLineNumber: to.lineNumber,
			endColumn: to.column,
		}
	})
	// An owner of our own, so this never clears anyone else's markers.
	monaco.editor.setModelMarkers(model, MARKER_OWNER, markers)
}

const markerWatchers = new Map<monaco.editor.ITextModel, monaco.IDisposable>()
const markerTimers = new Map<monaco.editor.ITextModel, ReturnType<typeof setTimeout>>()

function scheduleRefresh(model: monaco.editor.ITextModel) {
	const pending = markerTimers.get(model)
	if (pending) clearTimeout(pending)

	markerTimers.set(model, setTimeout(() => {
		markerTimers.delete(model)
		if (!model.isDisposed()) void refreshMarkers(model)
	}, MARKER_DEBOUNCE_MS))
}

function watchModel(model: monaco.editor.ITextModel) {
	if (markerWatchers.has(model)) return
	if (!LANGUAGE_SUPPORTS.some((s) => s.getWorkerAccessor && s.monacoLanguage === model.getLanguageId())) return

	markerWatchers.set(model, model.onDidChangeContent(() => scheduleRefresh(model)))
	// Deferred like an edit rather than run now: a model is often created
	// before its worker has started.
	scheduleRefresh(model)
}

function unwatchModel(model: monaco.editor.ITextModel) {
	markerWatchers.get(model)?.dispose()
	markerWatchers.delete(model)

	const pending = markerTimers.get(model)
	if (pending) clearTimeout(pending)
	markerTimers.delete(model)
}

let installed = false

/** Starts checking every script model, current and future, for un-awaited wait() calls. */
export function installFloatingWaitMarkers() {
	// Called from CodeEditor's setup, which runs again on every remount.
	if (installed) return
	installed = true

	monaco.editor.onDidCreateModel(watchModel)
	monaco.editor.onWillDisposeModel(unwatchModel)
	monaco.editor.getModels().forEach(watchModel)
}
