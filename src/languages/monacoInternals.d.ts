// Monaco ships no declarations for these two modules: they're the pieces of
// its own ts.worker.js entry that tsSemantic.worker.ts reassembles around a
// subclass. Typed only as far as that file uses them.

declare module 'monaco-editor/esm/vs/common/initialize.js' {
	export function initialize(createWorker: (ctx: unknown, createData: unknown) => unknown): void
}

declare module 'monaco-editor/esm/vs/language/typescript/tsWorker.js' {
	import type { LanguageService } from 'typescript'

	export class TypeScriptWorker {
		constructor(ctx: unknown, createData: unknown)
		getLanguageService(): LanguageService
	}
}
