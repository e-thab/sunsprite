import * as monaco from 'monaco-editor'
import { LANGUAGE_SUPPORTS } from '@/assets/languages/monacoLanguages'
import type { SyntaxSlot } from '@/assets/languages/textmateHighlighting'

// Semantic highlighting: coloring names by what the TypeScript language
// service knows they *are*, layered over the TextMate grammar's guesses from
// syntax alone (textmateHighlighting.ts). It's what lets the `Sprite` in
// `new Sprite()` read as a class while the `play` in `.play()` reads as a
// method, and a parameter stay parameter-colored everywhere it's used, not
// just where it's declared. VSCode does the same thing.
//
// The classifications come from our own TS worker (tsSemantic.worker.ts),
// because Monaco's doesn't expose them. Each one is translated into the same
// slot names the TextMate tokens use, so the existing themes color both
// without knowing which one a token came from. Monaco colors semantic tokens
// through the theme's token rules, so no separate semantic theme is needed.

/**
 * TypeScript's "2020" token types (TokenType in its classifier2020.ts), by
 * index, mapped to the palette slot each one is colored as.
 */
const SLOT_BY_TS_TOKEN_TYPE: readonly SyntaxSlot[] = [
	'type', // class
	'type', // enum
	'type', // interface
	'type', // namespace
	'type', // typeParameter
	'type', // type
	'parameter', // parameter
	'identifier', // variable (`constant` when readonly or built in, see slotFor)
	'constant', // enumMember
	'property', // property
	'function', // function, including variables and parameters holding one
	'function', // member, i.e. a method
]
const TS_VARIABLE = 7
// TokenModifier in classifier2020.ts: declaration, static, async, readonly, defaultLibrary, local
const TS_READONLY_MODIFIER = 1 << 3
const TS_DEFAULT_LIBRARY_MODIFIER = 1 << 4
const TS_TYPE_OFFSET = 8

const LEGEND_SLOTS: SyntaxSlot[] = [...new Set<SyntaxSlot>([...SLOT_BY_TS_TOKEN_TYPE, 'constant'])]
const legend: monaco.languages.SemanticTokensLegend = { tokenTypes: LEGEND_SLOTS, tokenModifiers: [] }

function slotFor(classification: number): SyntaxSlot | undefined {
	const tokenType = (classification >> TS_TYPE_OFFSET) - 1
	// `const` names, matching what the TextMate grammar already does for their
	// declarations (`variable.other.constant`), so a constant doesn't change
	// color between where it's declared and where it's used. Built-in globals
	// like `Math` and `console` too, the way VSCode themes color
	// `variable.defaultLibrary`.
	if (tokenType === TS_VARIABLE && classification & (TS_READONLY_MODIFIER | TS_DEFAULT_LIBRARY_MODIFIER)) return 'constant'
	return SLOT_BY_TS_TOKEN_TYPE[tokenType]
}

interface SemanticTypeScriptWorker {
	getEncodedSemanticClassifications(fileName: string, start: number, length: number): Promise<number[]>
}

/**
 * Converts TypeScript's flat `[offset, length, classification]` triples into
 * Monaco's encoding: five numbers per token (line delta, start-character
 * delta from the previous token if on the same line, length, legend index,
 * modifier bits), all zero-based.
 */
function toSemanticTokens(model: monaco.editor.ITextModel, spans: number[]): Uint32Array {
	const data: number[] = []
	let previousLine = 0
	let previousChar = 0
	for (let i = 0; i < spans.length; i += 3) {
		const slot = slotFor(spans[i + 2]!)
		if (!slot) continue

		const position = model.getPositionAt(spans[i]!)
		const line = position.lineNumber - 1
		const char = position.column - 1
		// Names never span lines, but Monaco's encoding can't express one that
		// does, so anything that somehow would is cut off at the line's end.
		const length = Math.min(spans[i + 1]!, model.getLineMaxColumn(position.lineNumber) - position.column)

		data.push(line - previousLine, line === previousLine ? char - previousChar : char, length, LEGEND_SLOTS.indexOf(slot), 0)
		previousLine = line
		previousChar = char
	}
	return new Uint32Array(data)
}

let installed = false

/**
 * Registers a semantic tokens provider for every language with a TS service
 * behind it. Only takes effect in an editor created with
 * `'semanticHighlighting.enabled': true`. Monaco's default leaves it to the
 * theme, and standalone themes have no way to turn it on.
 */
export function installSemanticHighlighting() {
	// Called from CodeEditor's setup, which runs again on every remount.
	if (installed) return
	installed = true

	for (const support of LANGUAGE_SUPPORTS) {
		const getWorkerAccessor = support.getWorkerAccessor
		if (!getWorkerAccessor) continue

		monaco.languages.registerDocumentSemanticTokensProvider(support.monacoLanguage, {
			getLegend: () => legend,
			async provideDocumentSemanticTokens(model, _lastResultId, token) {
				try {
					const getWorker = await getWorkerAccessor()
					const worker = (await getWorker(model.uri)) as SemanticTypeScriptWorker
					const spans = await worker.getEncodedSemanticClassifications(model.uri.toString(), 0, model.getValueLength())
					// Monaco cancels a request when the model changes under it, and
					// re-requests; spans computed against the old text would land in
					// the wrong places.
					if (token.isCancellationRequested || model.isDisposed()) return null
					return { data: toSemanticTokens(model, spans) }
				} catch {
					// The worker can briefly not know a model it's asked about (e.g.
					// mid-remount). No tokens just means TextMate's colors stand,
					// and the next edit asks again.
					return null
				}
			},
			releaseDocumentSemanticTokens() {},
		})
	}
}
