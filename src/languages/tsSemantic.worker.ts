import { initialize } from 'monaco-editor/esm/vs/common/initialize.js'
import { TypeScriptWorker } from 'monaco-editor/esm/vs/language/typescript/tsWorker.js'
// The compiler instance tsWorker.js itself is built on, so using it at runtime
// costs nothing extra.
import { typescript as ts } from 'monaco-editor/esm/vs/language/typescript/lib/typescriptServices.js'
// Type-only: a value import would bundle a second copy of the whole compiler
// into this worker, next to the one Monaco's tsWorker.js already carries.
import type { Node, SemanticClassificationFormat } from 'typescript'

// SemanticClassificationFormat.TwentyTwenty, spelled out for the reason above.
const TWENTY_TWENTY_FORMAT = '2020' as SemanticClassificationFormat.TwentyTwenty

// Monaco's own TS worker (monaco-editor/esm/vs/language/typescript/ts.worker.js),
// plus the one thing semantic highlighting needs that it doesn't expose: the
// language service's semantic classifications (see semanticHighlighting.ts),
// and an AST check for un-awaited wait() calls (see floatingWaitMarkers.ts).
//
// Monaco's sanctioned way to extend this worker, the `customWorkerPath`
// option, loads the extension with importScripts, which doesn't exist in the
// module workers Vite builds. So this file stands in for ts.worker.js
// instead: same startup, with a subclass in place of TypeScriptWorker.
// Methods added here are callable from the main thread through the worker
// proxy, which forwards any method name it's asked for.

class SunspriteTypeScriptWorker extends TypeScriptWorker {
	/**
	 * Flat `[start, length, classification]` triples over the given range, in
	 * TypeScript's "2020" encoding: `(tokenType + 1) << 8 | modifierBits`.
	 */
	async getEncodedSemanticClassifications(fileName: string, start: number, length: number): Promise<number[]> {
		return this.getLanguageService()
			.getEncodedSemanticClassifications(fileName, { start, length }, TWENTY_TWENTY_FORMAT)
			.spans
	}

	/**
	 * Spans of every `wait(...)` call that's a statement on its own, where the
	 * promise it returns is dropped and so nothing waits for it. Only the API's
	 * own wait counts: the `declare function wait` in the installed API lib,
	 * not a user function or import that shares the name.
	 * `await wait(1)`, `wait(1).then(...)`, `() => wait(1)` and
	 * `const w = wait(1)` all use the promise, so none of them are flagged.
	 * Neither is `void wait(1)`, the explicit way to say "on purpose".
	 */
	async getFloatingWaitCalls(fileName: string): Promise<{ start: number, length: number }[]> {
		const program = this.getLanguageService().getProgram()
		const sourceFile = program?.getSourceFile(fileName)
		if (!program || !sourceFile) return []
		const checker = program.getTypeChecker()

		const spans: { start: number, length: number }[] = []
		const visit = (node: Node) => {
			if (ts.isExpressionStatement(node)) {
				const call = node.expression
				if (
					ts.isCallExpression(call) &&
					ts.isIdentifier(call.expression) &&
					call.expression.text === 'wait' &&
					checker.getSymbolAtLocation(call.expression)?.declarations?.some((d) => ts.getCombinedModifierFlags(d) & ts.ModifierFlags.Ambient)
				) {
					const start = call.getStart(sourceFile)
					spans.push({ start, length: call.getEnd() - start })
				}
			}
			ts.forEachChild(node, visit)
		}
		visit(sourceFile)
		return spans
	}
}

self.onmessage = () => {
	initialize((ctx, createData) => new SunspriteTypeScriptWorker(ctx, createData))
}
