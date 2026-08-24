import * as monaco from 'monaco-editor'
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

monaco.languages.registerColorProvider('javascript', {
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
