import * as monaco from 'monaco-editor'
import type { QuickInfo, SymbolDisplayPart, JSDocTagInfo } from 'typescript'
import { LANGUAGE_SUPPORTS } from '@/languages/monacoLanguages'

// Hover docs for script languages, standing in for Monaco's own TS hover
// (QuickInfoAdapter in monaco-editor's typescript/languageFeatures.js).
//
// It's the same markdown Monaco builds, split differently. Monaco puts a
// comment's text and its @param/@returns lines into one markdown string, so
// they render as sibling <p>s that no CSS can tell apart. Here they're two
// strings, and every string in a hover renders as its own .markdown-hover
// block: the signature first, then the comment text, then the tags. That lets
// main.css space out the comment's paragraphs without spreading the tag lines
// along with them, and set the tags off from the text above.

interface QuickInfoWorker {
	getQuickInfoAtPosition(fileName: string, position: number): Promise<QuickInfo | undefined>
}

function displayPartsToString(parts: SymbolDisplayPart[] | undefined): string {
	return parts ? parts.map((part) => part.text).join('') : ''
}

/** One tag as Monaco formats it: `*@param*`name` — text`, `*@returns* — text`. */
function tagToString(tag: JSDocTagInfo): string {
	let label = `*@${tag.name}*`
	if (tag.name === 'param' && tag.text) {
		const [name, ...rest] = tag.text
		label += `\`${name!.text}\``
		if (rest.length > 0) label += ` — ${rest.map((part) => part.text).join(' ')}`
	} else if (tag.text) {
		label += ` — ${tag.text.map((part) => part.text).join(' ')}`
	}
	return label
}

let installed = false

/**
 * Turns off Monaco's TS hover and registers this one for every language with a
 * TS service behind it. Has to run before the first model of either language
 * exists: Monaco reads the `hovers` mode setting once, when the language first
 * loads, and never registers or drops its provider after that.
 */
export function installQuickInfoHover() {
	// Called from CodeEditor's setup, which runs again on every remount.
	if (installed) return
	installed = true

	for (const support of LANGUAGE_SUPPORTS) {
		const { defaults, getWorkerAccessor } = support
		if (!defaults || !getWorkerAccessor) continue

		defaults.setModeConfiguration({ ...defaults.modeConfiguration, hovers: false })

		monaco.languages.registerHoverProvider(support.monacoLanguage, {
			async provideHover(model, position, token) {
				try {
					const getWorker = await getWorkerAccessor()
					const worker = (await getWorker(model.uri)) as QuickInfoWorker
					const info = await worker.getQuickInfoAtPosition(model.uri.toString(), model.getOffsetAt(position))
					if (!info || token.isCancellationRequested || model.isDisposed()) return null

					const start = model.getPositionAt(info.textSpan.start)
					const end = model.getPositionAt(info.textSpan.start + info.textSpan.length)
					return {
						range: monaco.Range.fromPositions(start, end),
						contents: [
							{ value: '```typescript\n' + displayPartsToString(info.displayParts) + '\n```\n' },
							// Monaco skips an empty string entirely, so a comment
							// with no text just leaves its block out.
							{ value: displayPartsToString(info.documentation) },
							{ value: (info.tags ?? []).map(tagToString).join('  \n\n') },
						],
					}
				} catch {
					// Same as semanticHighlighting.ts: the worker can briefly not
					// know a model mid-remount, and no hover is the right answer.
					return null
				}
			},
		})
	}
}
