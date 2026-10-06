/**
 * Just enough of a syntax highlighter for the signatures in a methods table.
 *
 * Not a TypeScript parser and not trying to be one — these are signatures, a
 * far smaller grammar than the language they're written in, and everything
 * they contain is either a name, a type, or the punctuation between the two.
 * The same three-way split the editor's real highlighter would land on for
 * this input, reached by scanning rather than parsing.
 *
 * DocSnippet's hand-colored segments are the other half of this: free-form
 * code, colored a token at a time by whoever wrote the page, against the
 * editor theme's own Monaco palette. A signature has a shape regular enough to
 * color on its own, so it does.
 */

export type SignatureTokenKind =
	/** The method's own name — the leading identifier. */
	| 'name'
	/** An identifier in type position: after a `:`, and anywhere nested inside one. */
	| 'type'
	/** Everything else: punctuation, parameter names, whitespace. */
	| 'plain'

export type SignatureToken = { text: string, kind: SignatureTokenKind }

const IDENTIFIER_START = /[A-Za-z_$]/
const IDENTIFIER_PART = /[A-Za-z0-9_$]/

/**
 * Splits a signature into colorable runs.
 *
 * Takes the *rendered* text, not the prop: DocMethod re-lays a signature one
 * parameter per line once it stops fitting, and the wrapped form is what has
 * to come back colored. Nothing here depends on the two being the same string
 * — the scanner's state is driven by brackets and colons, which the added
 * newlines and tabs don't touch.
 */
export function tokenizeSignature(signature: string): SignatureToken[] {
	const tokens: SignatureToken[] = []

	/**
	 * One open bracket. `restore` is what the scanner was looking at just
	 * outside it, and `base` is what a comma inside it falls back to — which is
	 * the whole reason both are needed. The two differ constantly: in
	 * `cb: (x: number) => void` the parameter list opens *inside* a type but its
	 * own contents start as parameter names, so `base` is false while `restore`
	 * is true.
	 */
	type Bracket = { restore: boolean, base: boolean }

	const open: Bracket[] = []
	let inType = false
	// The first identifier is the method's name; every later one is a parameter
	// name or a type. Nothing after a `(` can be the name, but this doesn't need
	// to know that — the first identifier always comes first.
	let named = false

	// Runs of the same kind are merged as they're pushed, so the markup gets one
	// span per colored run rather than one per character of punctuation.
	function push(text: string, kind: SignatureTokenKind) {
		const last = tokens[tokens.length - 1]
		if (last?.kind === kind) last.text += text
		else tokens.push({ text, kind })
	}

	let i = 0
	while (i < signature.length) {
		const char = signature[i]!

		if (IDENTIFIER_START.test(char)) {
			let end = i + 1
			while (end < signature.length && IDENTIFIER_PART.test(signature[end]!)) end++
			if (!named) {
				push(signature.slice(i, end), 'name')
				named = true
			} else {
				push(signature.slice(i, end), inType ? 'type' : 'plain')
			}
			i = end
			continue
		}

		// A parameter list, wherever it appears: its contents start as parameter
		// names, and each comma in it returns to one.
		if (char === '(') {
			open.push({ restore: inType, base: false })
			inType = false
		}
		// Type arguments are types all the way down, commas included — which is
		// the difference between `Map<string, number>` and a parameter list, and
		// why bracket kind has to be tracked rather than just bracket depth.
		else if (char === '<') {
			open.push({ restore: inType, base: true })
			inType = true
		}
		// An array, tuple or object-literal type is a continuation of whatever
		// it appears in rather than a context of its own.
		else if (char === '[' || char === '{') {
			open.push({ restore: inType, base: inType })
		}
		// `>` closes type arguments — unless it's the tail of an arrow type's
		// `=>`, the same distinction DocMethod's parameter splitter has to make.
		else if (char === ')' || char === ']' || char === '}' || (char === '>' && signature[i - 1] !== '=')) {
			// Nothing to pop means the signature is unbalanced; treating that as
			// a return to the outermost level is as good a guess as any, and
			// keeps a malformed signature rendering rather than throwing.
			inType = open.pop()?.restore ?? false
		}
		else if (char === ':') inType = true
		else if (char === ',') inType = open[open.length - 1]?.base ?? false

		push(char, 'plain')
		i++
	}

	return tokens
}
