import { initialize } from 'monaco-editor/esm/vs/common/initialize.js'
import { TypeScriptWorker } from 'monaco-editor/esm/vs/language/typescript/tsWorker.js'
// Type-only: a value import would bundle a second copy of the whole compiler
// into this worker, next to the one Monaco's tsWorker.js already carries.
import type { SemanticClassificationFormat } from 'typescript'

// SemanticClassificationFormat.TwentyTwenty, spelled out for the reason above.
const TWENTY_TWENTY_FORMAT = '2020' as SemanticClassificationFormat.TwentyTwenty

// Monaco's own TS worker (monaco-editor/esm/vs/language/typescript/ts.worker.js),
// plus the one thing semantic highlighting needs that it doesn't expose: the
// language service's semantic classifications. See semanticHighlighting.ts.
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
}

self.onmessage = () => {
	initialize((ctx, createData) => new SunspriteTypeScriptWorker(ctx, createData))
}
