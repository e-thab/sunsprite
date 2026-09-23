import type { TokenPalette } from '@/assets/theme/themes'

/**
 * Syntax highlighting for the code blocks in the docs, in the colors the
 * editor would use for the same code.
 *
 * It's a port of Monaco's own TypeScript/JavaScript Monarch grammar rather
 * than an invention: the keyword list, the operator list and the rule order
 * below all come from monaco-editor's basic-languages/typescript, and the
 * token names it emits are the ones buildMonacoThemeData (themes.ts) already
 * maps to each theme's TokenPalette. So a snippet here and the same code in
 * the editor resolve to the same palette entry, and a new theme colors both
 * without either being told about it.
 *
 * Monaco itself would be the obvious tool — `editor.colorize()` does exactly
 * this — but the docs are reachable at /docs with no editor on the page, and
 * themeStore deliberately keeps the (large) monaco-editor import out of routes
 * that never load it. Two hundred lines of scanner is the cheaper side of that
 * trade.
 *
 * Two deliberate departures from the grammar:
 *
 * - Brackets are `delimiter` here. Monaco gives them bracket-pair colors,
 *   which are a property of that editor's nesting display rather than of the
 *   code, and DocSnippet's palette excludes them for the same reason.
 * - An unterminated quote ends at the newline instead of running on as
 *   `string.invalid`. In an editor that state is a useful complaint about code
 *   you're mid-way through typing; in a fixed snippet it would just be one
 *   stray apostrophe swallowing every line below it.
 */

/** The palette entries a token can land on — every one except the bracket-pair colors. */
export type CodeTokenKind = keyof Omit<
	TokenPalette,
	'bracketColor1' | 'bracketColor2' | 'bracketColor3' | 'bracketColorUnexpected'
>

export type CodeToken = { text: string, kind: CodeTokenKind }

// Monaco's own list, verbatim — matching the keys of textToKeywordObj in the
// TypeScript compiler's scanner.
const KEYWORDS = new Set([
	'abstract', 'any', 'as', 'asserts', 'bigint', 'boolean', 'break', 'case', 'catch', 'class',
	'continue', 'const', 'constructor', 'debugger', 'declare', 'default', 'delete', 'do', 'else',
	'enum', 'export', 'extends', 'false', 'finally', 'for', 'from', 'function', 'get', 'if',
	'implements', 'import', 'in', 'infer', 'instanceof', 'interface', 'is', 'keyof', 'let',
	'module', 'namespace', 'never', 'new', 'null', 'number', 'object', 'out', 'package', 'private',
	'protected', 'public', 'override', 'readonly', 'require', 'global', 'return', 'satisfies',
	'set', 'static', 'string', 'super', 'switch', 'symbol', 'this', 'throw', 'true', 'try', 'type',
	'typeof', 'undefined', 'unique', 'unknown', 'var', 'void', 'while', 'with', 'yield', 'async',
	'await', 'of',
])

// Also Monaco's. A run of symbol characters is `delimiter` when the whole run
// is one of these and uncolored otherwise, which is why the run is matched
// first and looked up second rather than being consumed a character at a time.
const OPERATORS = new Set([
	'<=', '>=', '==', '!=', '===', '!==', '=>', '+', '-', '**', '*', '/', '%', '++', '--', '<<',
	'</', '>>', '>>>', '&', '|', '^', '!', '~', '&&', '||', '??', '?', ':', '=', '+=', '-=', '*=',
	'**=', '/=', '%=', '<<=', '>>=', '>>>=', '&=', '|=', '^=', '@',
])

// Sticky (`y`) throughout: each is tried at the scanner's exact position, never
// searched for further along.
const WHITESPACE = /\s+/y
const LINE_COMMENT = /\/\/[^\n]*/y
const LOWER_IDENT = /#?[a-z_$][\w$]*/y
const UPPER_IDENT = /[A-Z][\w$]*/y
const HEX_NUMBER = /0[xX][0-9a-fA-F]+(?:_+[0-9a-fA-F]+)*n?/y
const RADIX_NUMBER = /0[oO]?[0-7]+n?|0[bB][01]+n?/y
const NUMBER = /\d+(?:_+\d+)*\.\d+(?:_+\d+)*(?:[eE][-+]?\d+)?|\.\d+(?:[eE][-+]?\d+)?|\d+(?:_+\d+)*(?:[eE][-+]?\d+)?n?/y
const SYMBOL_RUN = /[=><!~?:&|+\-*/^%]+/y
const ESCAPE = /\\(?:[abfnrtv\\"'`$]|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/y
/**
 * Monaco's guard for telling a regular expression from a division: a `/` only
 * opens one if a complete `/.../flags` follows and lands somewhere a value can
 * end. It's what keeps `a / b / c` from reading as a regex, so it's ported
 * rather than approximated.
 */
const REGEX_AHEAD = /\/(?=(?:[^\\/]|\\.)+\/[dgimsuy]*\s*(?:\.|;|,|\)|\]|\}|$))/y
const REGEX_BODY = /\/(?:[^\\/[\n]|\\.|\[(?:[^\]\\\n]|\\.)*\])*\/[dgimsuy]*/y

/** Where the scanner is: plain code, inside a quote, or inside a `${}` within one. */
type Mode =
	| { kind: 'code' }
	| { kind: 'string', quote: string }
	/** Code again, but counting braces so the closing one can hand the string back. */
	| { kind: 'interpolation', depth: number }

function matchAt(pattern: RegExp, source: string, at: number): string | undefined {
	pattern.lastIndex = at
	return pattern.exec(source)?.[0]
}

export function tokenizeCode(source: string): CodeToken[] {
	const tokens: CodeToken[] = []

	// Adjacent runs of one kind are merged as they're pushed, so a line of
	// punctuation becomes one span rather than one per character.
	function push(text: string, kind: CodeTokenKind) {
		if (!text) return
		const last = tokens[tokens.length - 1]
		if (last?.kind === kind) last.text += text
		else tokens.push({ text, kind })
	}

	// A stack rather than a flag, because a template literal can hold an
	// interpolation that holds another template literal.
	const modes: Mode[] = [{ kind: 'code' }]
	let i = 0

	/** Consumes a delimited run, honoring backslash escapes, and returns its end. */
	function findClose(from: number, close: string): number {
		const at = source.indexOf(close, from)
		return at === -1 ? source.length : at + close.length
	}

	while (i < source.length) {
		const mode = modes[modes.length - 1]!

		if (mode.kind === 'string') {
			const char = source[i]!

			if (char === mode.quote) {
				push(char, 'string')
				modes.pop()
				i++
				continue
			}
			// Only a template literal interpolates; `${` is literal text in the
			// other two.
			if (mode.quote === '`' && char === '$' && source[i + 1] === '{') {
				push('${', 'delimiter')
				modes.push({ kind: 'interpolation', depth: 0 })
				i += 2
				continue
			}
			const escape = matchAt(ESCAPE, source, i)
			if (escape) {
				push(escape, 'stringEscape')
				i += escape.length
				continue
			}
			// See the note above about unterminated quotes: a newline closes a
			// `'` or `"` rather than letting it run to the end of the snippet.
			if (char === '\n' && mode.quote !== '`') {
				modes.pop()
				continue
			}
			push(char, 'string')
			i++
			continue
		}

		// --- code, and the inside of an interpolation, which is the same thing
		// --- plus a brace count.

		const whitespace = matchAt(WHITESPACE, source, i)
		if (whitespace) {
			push(whitespace, 'default')
			i += whitespace.length
			continue
		}

		const lineComment = matchAt(LINE_COMMENT, source, i)
		if (lineComment) {
			push(lineComment, 'comment')
			i += lineComment.length
			continue
		}

		// `/**` opens a doc comment, but `/**/` is just an empty block comment —
		// the same exclusion Monaco's `\/\*\*(?!\/)` makes.
		if (source.startsWith('/**', i) && source[i + 3] !== '/') {
			const end = findClose(i + 3, '*/')
			push(source.slice(i, end), 'commentDoc')
			i = end
			continue
		}
		if (source.startsWith('/*', i)) {
			const end = findClose(i + 2, '*/')
			push(source.slice(i, end), 'comment')
			i = end
			continue
		}

		if (matchAt(REGEX_AHEAD, source, i)) {
			const regex = matchAt(REGEX_BODY, source, i)
			if (regex) {
				push(regex, 'regexp')
				i += regex.length
				continue
			}
		}

		const char = source[i]!

		if (char === '"' || char === "'" || char === '`') {
			push(char, 'string')
			modes.push({ kind: 'string', quote: char })
			i++
			continue
		}

		// Hex before the general number rule, and both before the `.` delimiter
		// below — otherwise `.5` loses its leading dot and `0x1f` its letters.
		const hex = matchAt(HEX_NUMBER, source, i)
		if (hex) {
			push(hex, 'numberHex')
			i += hex.length
			continue
		}
		const radix = matchAt(RADIX_NUMBER, source, i)
		if (radix) {
			push(radix, 'number')
			i += radix.length
			continue
		}
		const number = matchAt(NUMBER, source, i)
		if (number) {
			push(number, 'number')
			i += number.length
			continue
		}

		const lower = matchAt(LOWER_IDENT, source, i)
		if (lower) {
			push(lower, KEYWORDS.has(lower) ? 'keyword' : 'identifier')
			i += lower.length
			continue
		}
		// Monaco colors any capitalized identifier as a type — which is what
		// makes `Rectangle` and `Colors` read as types in the editor, so they
		// read that way here too.
		const upper = matchAt(UPPER_IDENT, source, i)
		if (upper) {
			push(upper, 'type')
			i += upper.length
			continue
		}

		if (char === '{') {
			if (mode.kind === 'interpolation') mode.depth++
			push(char, 'delimiter')
			i++
			continue
		}
		if (char === '}') {
			// The brace that closes the interpolation, handing the scanner back
			// to the template literal that owns it.
			if (mode.kind === 'interpolation' && mode.depth === 0) {
				push(char, 'delimiter')
				modes.pop()
				i++
				continue
			}
			if (mode.kind === 'interpolation') mode.depth--
			push(char, 'delimiter')
			i++
			continue
		}
		if ('()[];,.'.includes(char)) {
			push(char, 'delimiter')
			i++
			continue
		}

		const symbols = matchAt(SYMBOL_RUN, source, i)
		if (symbols) {
			push(symbols, OPERATORS.has(symbols) ? 'delimiter' : 'default')
			i += symbols.length
			continue
		}

		push(char, 'default')
		i++
	}

	return tokens
}
