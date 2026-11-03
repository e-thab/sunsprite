import * as monaco from 'monaco-editor'
import { createHighlighterCoreSync } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { EncodedTokenMetadata, INITIAL, type StateStack } from 'shiki/textmate'
import typescript from 'shiki/langs/typescript.mjs'
import javascript from 'shiki/langs/javascript.mjs'

// Syntax highlighting for scripts, using VSCode's own TextMate grammars (by
// way of Shiki) in place of Monaco's built-in Monarch ones.
//
// Monarch's TypeScript grammar only knows a handful of token kinds: every
// name is `identifier` (or `type.identifier` if it happens to start with a
// capital letter), so a function call, a property and a parameter all look
// the same. The TextMate grammar knows which is which, and it is what VSCode
// itself highlights with.
//
// The awkward part is that TextMate themes match on the whole scope stack
// ("a `variable.other.property` inside a `meta.object-literal`"), which
// Monaco's theming can't express: it colors a single token name per token.
// So the grammar runs against one fixed theme, SLOT_THEME below, where each
// slot in SLOT_SCOPES gets its own sentinel color. The color a token comes
// back with tells us which slot it landed in, and that slot's name is what
// Monaco sees. The real colors stay where they always were, in each
// palette's Monaco theme (buildMonacoThemeData in themes.ts), keyed by those
// same slot names.
//
// Tokenizing never depends on which app theme is active, so switching themes
// is still just monaco.editor.setTheme.

/**
 * Which TextMate scopes land in each palette slot. Scope matching follows
 * TextMate's rules: a selector matches its own scope and any more specific
 * one (`variable` covers `variable.other.readwrite`), the deepest scope in
 * the stack that matches anything wins, and among selectors that match the
 * same scope the more specific one wins. Order within this table doesn't matter.
 *
 * Names are Monaco token names, so `comment.doc` is colored by a `comment.doc`
 * theme rule if one exists and falls back to `comment` otherwise.
 */
export const SLOT_SCOPES = {
	identifier: ['variable', 'meta.definition.variable'],
	keyword: [
		'keyword',
		'storage',
		// `this`, `super`
		'variable.language',
		// Operators that are words: `new`, `typeof`, `instanceof`, `in`, `keyof`...
		// (more specific than `keyword.operator`, so they stay out of `operator`)
		'keyword.operator.new',
		'keyword.operator.expression',
		// The `${` and `}` around an embedded template expression
		'punctuation.definition.template-expression',
		// The `@` of a JSDoc tag, so it reads as one piece with its name
		'punctuation.definition.block.tag.jsdoc',
	],
	// Keywords that steer control rather than declare something: `import`,
	// `export`, `from`, `if`, `return`, `await`, `try`... Everything else in
	// `keyword` above (`const`, `function`, `async`, `new`...) stays there.
	'keyword.control': ['keyword.control'],
	// `true`, `false`, `null`, `undefined`, `NaN`, `Infinity`, and the `*` of
	// `import * as`. Keywords in Monarch, and still `keyword` in any palette
	// that doesn't color them separately.
	literal: ['constant.language'],
	delimiter: [
		'punctuation',
		'meta.brace',
		// Operators to the grammar, punctuation to the eye: the `:` of a type
		// annotation, `|` and `&` between types, and `...`.
		'keyword.operator.type',
		'keyword.operator.spread',
		'keyword.operator.rest',
	],
	// Symbol operators: `=`, `+=`, `===`, `&&`, `??`... Still `delimiter` in
	// any palette that doesn't color them separately. (`=>` isn't one: the
	// grammar scopes it as `storage`, so it's a keyword.)
	operator: ['keyword.operator'],
	type: [
		'entity.name.type',
		'entity.name.class',
		'entity.other.inherited-class',
		'support.class',
		'support.type',
	],
	// Also catches the `Sprite` in `new Sprite()`: the grammar scopes it exactly
	// like the `play` in `new Sprite().play()`, so no selector can single it out
	// as a class. VSCode only gets that right through semantic highlighting.
	function: ['entity.name.function', 'support.function'],
	property: [
		'variable.other.property',
		'variable.other.object.property',
		'variable.object.property',
		'support.variable.property',
		'meta.object-literal.key',
	],
	// Including the name after a JSDoc `@param`
	parameter: ['variable.parameter', 'variable.other.jsdoc'],
	constant: ['variable.other.constant', 'variable.other.enummember', 'support.constant'],
	number: ['constant.numeric'],
	'number.hex': ['constant.numeric.hex'],
	string: ['string', 'punctuation.definition.string'],
	'string.escape': ['constant.character.escape'],
	comment: ['comment', 'punctuation.definition.comment'],
	'comment.doc': [
		'comment.block.documentation',
		// The `/**` and `*/`, and the braces around a JSDoc `{type}`, which the
		// general `punctuation` selectors elsewhere would otherwise win
		'comment.block.documentation punctuation',
		'comment.block.documentation punctuation.definition.comment',
	],
	// Everything inside a regex literal is one color. The leaf-scope selectors
	// (`punctuation.definition.string`, `keyword.operator`) would otherwise beat
	// a bare `string.regexp punctuation`, so they're restated under it.
	regexp: [
		'string.regexp',
		'string.regexp keyword',
		'string.regexp keyword.operator',
		'string.regexp constant',
		'string.regexp punctuation',
		'string.regexp punctuation.definition.string',
	],
} satisfies Record<string, string[]>

export type SyntaxSlot = keyof typeof SLOT_SCOPES

const SLOTS = Object.keys(SLOT_SCOPES) as SyntaxSlot[]
const SLOT_THEME_NAME = 'sunsprite-slots'
const sentinelColor = (index: number) => `#${(index + 1).toString(16).padStart(6, '0')}`

const SLOT_THEME = {
	name: SLOT_THEME_NAME,
	type: 'dark' as const,
	settings: [
		// Nothing in SLOTS can be pure white, so a token that comes back this
		// color matched none of them.
		{ settings: { foreground: '#ffffff', background: '#000000' } },
		...SLOTS.map((slot, i) => ({ scope: SLOT_SCOPES[slot], settings: { foreground: sentinelColor(i) } })),
	],
}

// Sync is possible because everything is imported up front and the JavaScript
// regex engine needs no WASM, so the tokenizer is installed before any editor
// exists, never racing the first render.
const highlighter = createHighlighterCoreSync({
	themes: [SLOT_THEME],
	langs: [typescript, javascript],
	engine: createJavaScriptRegexEngine(),
})

// vscode-textmate's color map: index -> uppercase hex. Each token's metadata
// carries an index into this, which is what gets turned back into a slot.
const slotByColorIndex = new Map<number, SyntaxSlot>()
{
	const { colorMap } = highlighter.setTheme(SLOT_THEME_NAME)
	const slotBySentinel = new Map(SLOTS.map((slot, i) => [sentinelColor(i), slot]))
	colorMap.forEach((color, index) => {
		const slot = slotBySentinel.get(color.toLowerCase())
		if (slot) slotByColorIndex.set(index, slot)
	})
}

// Monaco works out whether a token is part of a comment, string or regex from
// its *name*, not its color (toStandardTokenType in Monaco's tokenization.js),
// and leans on that for bracket matching, bracket-pair colors and
// auto-closing quotes. The grammar already knows, so its answer is appended to
// the name when the slot's own name doesn't already say it, e.g. the
// `keyword` that is an `@param` tag inside a doc comment goes out as
// `keyword.comment`. Theme rules match by prefix, so that's still colored as
// `keyword`. Indexed by vscode-textmate's StandardTokenType.
const STANDARD_TYPE_SUFFIXES = ['', 'comment', 'string', 'regex'] as const

function tokenName(metadata: number): string {
	const slot = slotByColorIndex.get(EncodedTokenMetadata.getForeground(metadata)) ?? ''
	const suffix = STANDARD_TYPE_SUFFIXES[EncodedTokenMetadata.getTokenType(metadata)] ?? ''
	if (!suffix || slot.startsWith(suffix) || (suffix === 'regex' && slot === 'regexp')) return slot
	// An unmatched token inside a string or comment still needs its type; with
	// no slot to hang it on, `text` matches no rule and keeps the default color.
	return `${slot || 'text'}.${suffix}`
}

class TextMateState implements monaco.languages.IState {
	constructor(readonly ruleStack: StateStack) {}

	clone() {
		return new TextMateState(this.ruleStack)
	}

	// Lets Monaco stop re-tokenizing below an edit as soon as a line ends in
	// the same state it did before, instead of running to the end of the file.
	equals(other: monaco.languages.IState) {
		return other instanceof TextMateState && other.ruleStack.equals(this.ruleStack)
	}
}

// Past these, a line is left uncolored rather than stalling the editor: a
// pasted minified bundle shouldn't freeze typing.
const MAX_LINE_LENGTH = 20_000
const TOKENIZE_TIME_LIMIT_MS = 500

/**
 * Replaces Monaco's Monarch tokenizer with the TextMate grammar for every
 * language loaded above. Monaco's own language configuration (brackets,
 * auto-closing pairs, comment toggling) is untouched: it's registered
 * separately from the tokenizer, and still comes from Monaco.
 *
 * An explicit setTokensProvider takes precedence over the lazily-loaded
 * Monarch grammar regardless of which lands first (Monaco registers that one
 * as a factory, only consulted when nothing is registered directly).
 */
let installed = false

export function installTextMateHighlighting() {
	// Called from CodeEditor's setup, which runs again on every remount.
	if (installed) return
	installed = true

	// getLoadedLanguages includes Shiki's aliases (`ts`, `js`...), which aren't
	// Monaco language ids.
	const monacoLanguages = new Set(monaco.languages.getLanguages().map((language) => language.id))
	for (const lang of highlighter.getLoadedLanguages()) {
		if (!monacoLanguages.has(lang)) continue
		const grammar = highlighter.getLanguage(lang)
		monaco.languages.setTokensProvider(lang, {
			getInitialState: () => new TextMateState(INITIAL),
			tokenize(line, state: TextMateState) {
				if (line.length >= MAX_LINE_LENGTH) {
					return { endState: state, tokens: [{ startIndex: 0, scopes: '' }] }
				}

				const result = grammar.tokenizeLine2(line, state.ruleStack, TOKENIZE_TIME_LIMIT_MS)
				const tokens: monaco.languages.IToken[] = []
				for (let i = 0; i < result.tokens.length; i += 2) {
					tokens.push({ startIndex: result.tokens[i]!, scopes: tokenName(result.tokens[i + 1]!) })
				}
				return { endState: new TextMateState(result.ruleStack), tokens }
			},
		})
	}
}
