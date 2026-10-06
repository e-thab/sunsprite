import * as monaco from 'monaco-editor'
import { SCRIPT_MONACO_LANGUAGES } from '@/assets/languages/monacoLanguages'
import Colors from '@/assets/api/Colors'

// Monaco's own built-in color provider (registered for every language) only
// recognizes color literals that already look like one in the raw text —
// hex codes — so it never picks up `Colors.Jade` and friends, even though
// each resolves to exactly such a literal.
//
// A second, separately-registered color provider is *not* additive the way
// it sounds like it should be: Monaco's internal aggregation (_findColorData
// in its colorPicker contrib) calls every non-default provider first, and
// the moment any of them returns an array from provideDocumentColors — even
// an empty one, on a document with no Colors.* references at all — it
// treats that as "a provider handled this" and never calls the built-in
// default provider at all. Registering ours here previously killed literal
// hex-code swatches project-wide instead of leaving them alone, which is
// exactly the bug that motivated the comment you're reading now. So this
// provider has to fully replace the default one's behavior rather than
// stack alongside it, matching literal hex codes itself too and merging
// those with the Colors.* matches into one combined result. rgb()/hsl()
// aren't reproduced — nothing in this project ever uses them, only hex —
// so there's nothing real to restore parity with there.
const colorsByName = new Map(Object.entries(Colors) as [string, string][])

const COLORS_REFERENCE_PATTERN = /\bColors\.(\w+)\b/g
// Captures the surrounding quotes too (backreference \1 requires the same
// quote character on both ends) — a hex code is only a color *literal* when
// it's the entirety of a string's contents; "#ff00ff" is one, but a bare
// #ff00ff floating in code isn't valid JS at all, and "prefix #ff00ff" is a
// string that merely contains hex-shaped text, not a color value. Including
// the quotes in the match (rather than stopping just short of them, as an
// earlier version of this did) is also what makes converting a match to a
// Colors.* name below correctly drop the now-unwanted quotes along with it,
// instead of leaving them stranded around the new reference.
const LITERAL_HEX_STRING_PATTERN = /(["'])#([A-Fa-f0-9]{8}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{4}|[A-Fa-f0-9]{3})\1/g

// Mirrors the hex pattern's own "whole string, not just text that happens to
// contain the shape of one" rule for the other direction: `Colors.Magenta`
// is a real reference, but "Colors.Magenta" is a string whose contents just
// look like one. Only checks for the match being flanked by a *matching*
// quote pair immediately on both sides (not full tokenization of the
// document — a Colors.* reference buried mid-string, e.g. "prefix
// Colors.Magenta suffix", won't be caught by this), which is enough for the
// actual failure mode this guards against.
function isWholeQuotedString(text: string, start: number, end: number): boolean {
	const before = text[start - 1]
	const after = text[end]
	return (before === '"' || before === "'") && after === before
}

// Shorthand 3/4-digit hex (e.g. "0bd") doubles each digit ("00bbdd") — the
// same expansion CSS itself uses. Colors.* values are always the full
// 6-digit form, so this only ever branches for literal matches.
function hexDigitsToColor(digits: string): monaco.languages.IColor {
	const full = digits.length <= 4 ? digits.split('').map((d) => d + d).join('') : digits
	const value = parseInt(full.slice(0, 6), 16)
	const alphaHex = full.length === 8 ? full.slice(6, 8) : undefined
	return {
		red: ((value >> 16) & 0xff) / 255,
		green: ((value >> 8) & 0xff) / 255,
		blue: (value & 0xff) / 255,
		alpha: alphaHex ? parseInt(alphaHex, 16) / 255 : 1,
	}
}

function formatHex(color: monaco.languages.IColor): string {
	const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0')
	const alphaHex = color.alpha < 1 ? toHex(color.alpha) : ''
	return `#${toHex(color.red)}${toHex(color.green)}${toHex(color.blue)}${alphaHex}`
}

// Reverse lookup for the color picker's presentations: when the currently
// picked color exactly matches one of Colors' own values, offer that name
// as an option alongside the raw hex, so picking a color that happens to be
// e.g. Colors.Red doesn't force you into a hardcoded literal instead.
function matchingColorName(hex: string): string | undefined {
	for (const [name, value] of colorsByName) {
		if (value.toLowerCase() === hex.toLowerCase()) return name
	}
	return undefined
}

function toColorInfo(model: monaco.editor.ITextModel, index: number, length: number, color: monaco.languages.IColor): monaco.languages.IColorInformation {
	const start = model.getPositionAt(index)
	const end = model.getPositionAt(index + length)
	return {
		color,
		range: {
			startLineNumber: start.lineNumber,
			startColumn: start.column,
			endLineNumber: end.lineNumber,
			endColumn: end.column,
		},
	}
}

// Registered for every script language, not just JavaScript: a color literal
// in a .ts file is the same literal and deserves the same swatch. See
// SCRIPT_MONACO_LANGUAGES in monacoLanguages.ts.
monaco.languages.registerColorProvider(SCRIPT_MONACO_LANGUAGES, {
	provideDocumentColors(model) {
		const text = model.getValue()
		const results: monaco.languages.IColorInformation[] = []

		for (const match of text.matchAll(COLORS_REFERENCE_PATTERN)) {
			const hex = colorsByName.get(match[1]!)
			if (!hex) continue
			if (isWholeQuotedString(text, match.index, match.index + match[0].length)) continue
			results.push(toColorInfo(model, match.index, match[0].length, hexDigitsToColor(hex.replace(/^#/, ''))))
		}

		for (const match of text.matchAll(LITERAL_HEX_STRING_PATTERN)) {
			results.push(toColorInfo(model, match.index, match[0].length, hexDigitsToColor(match[2]!)))
		}

		return results
	},
	// Called again with the live color as the picker's sliders move (not just
	// once for the original match), so this always reflects whatever's
	// currently picked rather than the color the swatch originally had.
	provideColorPresentations(model, colorInfo) {
		const hex = formatHex(colorInfo.color)
		const name = matchingColorName(hex)

		// Whether the range currently holds a quoted string (a literal hex
		// match — its range always includes the quotes, see
		// LITERAL_HEX_STRING_PATTERN) or a bare reference (Colors.*, no
		// quotes of its own) determines whether the hex presentation needs to
		// add quotes or can reuse the ones already there. Read from the
		// live text at the range rather than decided once up front, so this
		// stays correct across repeated presentation switches within the same
		// picker session (converting Colors.Magenta -> "#ff00ff" and then
		// wanting to cycle again correctly sees a quoted string the second
		// time, not the original bare reference).
		const current = model.getValueInRange(colorInfo.range)
		const quote = current.length >= 2 && current[0] === current[current.length - 1] && (current[0] === '"' || current[0] === "'")
			? current[0]!
			: '"'
		const hexLabel = `${quote}${hex}${quote}`

		const presentations: monaco.languages.IColorPresentation[] = []
		if (name) presentations.push({ label: `Colors.${name}` })
		presentations.push({ label: hexLabel })
		return presentations
	},
})

// ---------------------------------------------------------------------------
// Completions
// ---------------------------------------------------------------------------

// Monaco draws a swatch in a completion row's icon slot when the item's kind is
// Color *and* a CSS color can be found on it — suggestWidgetRenderer.js's
// ColorExtractor tries the label and detail as whole strings, then the
// documentation loosely. Its TypeScript worker can never satisfy the first
// half: convertKind maps enum members to Property and has no branch that emits
// Color at all. So the only way to put swatches in the dropdown is to supply
// the items ourselves.
//
// Which is why apiLib.ts declares Colors with an index signature now instead of
// as an enum. Two providers offering the same names would show every color
// twice: Monaco de-duplicates nothing across providers, and its one
// short-circuit — suggest.js only moves on to the next provider *group* when
// the previous group produced nothing — can't separate us, because a plain
// language-id selector and ours both score 10 and so share a group. Leaving
// TypeScript with no members to offer is the whole mechanism. (An `exclusive`
// selector would outrank it, but zeroes every other provider for the entire
// model, taking all TypeScript completions with it.)
const COLORS_MEMBER_ACCESS_PATTERN = /\bColors\.(\w*)$/

monaco.languages.registerCompletionItemProvider(SCRIPT_MONACO_LANGUAGES, {
	triggerCharacters: ['.'],
	provideCompletionItems(model, position) {
		const linePrefix = model.getValueInRange({
			startLineNumber: position.lineNumber,
			startColumn: 1,
			endLineNumber: position.lineNumber,
			endColumn: position.column,
		})

		const match = COLORS_MEMBER_ACCESS_PATTERN.exec(linePrefix)
		if (!match) return { suggestions: [] }

		// Spans what's been typed since the dot rather than ending at the
		// cursor alone, so accepting a row after typing a few letters replaces
		// them instead of appending to them.
		const typed = match[1]!
		const range: monaco.IRange = {
			startLineNumber: position.lineNumber,
			endLineNumber: position.lineNumber,
			startColumn: position.column - typed.length,
			endColumn: position.column,
		}

		const suggestions: monaco.languages.CompletionItem[] = []
		for (const [name, hex] of colorsByName) {
			suggestions.push({
				label: name,
				kind: monaco.languages.CompletionItemKind.Color,
				// Both halves of the swatch: Color alone renders the generic
				// kind icon, and this is the string ColorExtractor matches
				// (strictly, so it has to be the hex and nothing else). It
				// doubles as the value shown beside the name in the row.
				detail: hex,
				insertText: name,
				range,
			})
		}

		return { suggestions }
	},
})

// ---------------------------------------------------------------------------
// Unknown-name validation
// ---------------------------------------------------------------------------

// Reinstates the one thing lost with the enum: `Colors.Jae` used to be a
// TypeScript error ("Property 'Jae' does not exist"), and an index signature
// accepts any name. The document scan this needs is the same one the color
// provider above already performs, but it's driven from its own content
// listener rather than piggybacking on provideDocumentColors — that runs only
// for models attached to an editor, and only while color decorators are turned
// on, neither of which should silently decide whether typos get reported.
const UNKNOWN_COLOR_MARKER_OWNER = 'sunsprite-colors'
const MARKER_DEBOUNCE_MS = 250

function refreshUnknownColorMarkers(model: monaco.editor.ITextModel) {
	const text = model.getValue()
	const markers: monaco.editor.IMarkerData[] = []

	for (const match of text.matchAll(COLORS_REFERENCE_PATTERN)) {
		const name = match[1]!
		if (colorsByName.has(name)) continue
		if (isWholeQuotedString(text, match.index, match.index + match[0].length)) continue

		// Underlines just the name, not the `Colors.` qualifier, matching where
		// TypeScript used to put the squiggle.
		const nameIndex = match.index + match[0].length - name.length
		const start = model.getPositionAt(nameIndex)
		const end = model.getPositionAt(nameIndex + name.length)
		markers.push({
			severity: monaco.MarkerSeverity.Error,
			message: `'${name}' is not a color name.`,
			startLineNumber: start.lineNumber,
			startColumn: start.column,
			endLineNumber: end.lineNumber,
			endColumn: end.column,
		})
	}

	// Replaces the whole array for this owner every time, which is the only way
	// setModelMarkers works — hence an owner of our own, so this never clears
	// the runtime errors CodeEditor.vue publishes under its own.
	monaco.editor.setModelMarkers(model, UNKNOWN_COLOR_MARKER_OWNER, markers)
}

const markerWatchers = new Map<monaco.editor.ITextModel, monaco.IDisposable>()
const markerTimers = new Map<monaco.editor.ITextModel, ReturnType<typeof setTimeout>>()

function scheduleMarkerRefresh(model: monaco.editor.ITextModel) {
	const pending = markerTimers.get(model)
	if (pending) clearTimeout(pending)

	markerTimers.set(model, setTimeout(() => {
		markerTimers.delete(model)
		if (!model.isDisposed()) refreshUnknownColorMarkers(model)
	}, MARKER_DEBOUNCE_MS))
}

function watchModelForUnknownColors(model: monaco.editor.ITextModel) {
	if (markerWatchers.has(model)) return
	if (!SCRIPT_MONACO_LANGUAGES.includes(model.getLanguageId())) return

	markerWatchers.set(model, model.onDidChangeContent(() => scheduleMarkerRefresh(model)))
	refreshUnknownColorMarkers(model)
}

function unwatchModelForUnknownColors(model: monaco.editor.ITextModel) {
	markerWatchers.get(model)?.dispose()
	markerWatchers.delete(model)

	const pending = markerTimers.get(model)
	if (pending) clearTimeout(pending)
	markerTimers.delete(model)
}

monaco.editor.onDidCreateModel(watchModelForUnknownColors)
monaco.editor.onWillDisposeModel(unwatchModelForUnknownColors)
// Anything that already exists by the time this module is first imported —
// CodeEditor.vue creates the API model during its own setup, and script models
// can outlive a remount.
monaco.editor.getModels().forEach(watchModelForUnknownColors)
