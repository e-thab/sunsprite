/**
 * postMessage contract between the parent app (PhaserCanvas.vue) and the
 * sandboxed iframe (sandbox.html / src/sandbox/main.ts).
 */

export type ParentToSandboxMessage =
	| { type: 'sunsprite:run', code: string }
	| { type: 'sunsprite:play' }
	| { type: 'sunsprite:pause' }
	| { type: 'sunsprite:keydown', code: string }
	| { type: 'sunsprite:keyup', code: string }
	| { type: 'sunsprite:blur' }
	| { type: 'sunsprite:contextmenu' }

export type SandboxToParentMessage =
	| { type: 'sunsprite:ready' }
	| { type: 'sunsprite:mouse', x: number, y: number }
	| { type: 'sunsprite:paused', paused: boolean }
	| { type: 'sunsprite:fps', fps: number }
	| { type: 'sunsprite:output', kind: 'print' | 'warn' | 'error' | 'printStartMsg' | 'clear', msg?: string }

export const SANDBOX_ORIGIN = '*' as const
