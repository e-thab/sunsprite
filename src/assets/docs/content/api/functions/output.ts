import type { DocCategoryNode, DocEntryNode } from '../../../docsTypes'

function fn(entry: Omit<DocEntryNode, 'kind'>): DocEntryNode {
	return { kind: 'entry', ...entry }
}

const print = fn({
	slug: 'print',
	title: 'print()',
	icon: 'tabler:message',
	summary: 'Display a message in the output panel.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'print(...msg: Printable[]): void',
		description: 'Display a normal message in the output panel.',
		params: [{ name: 'msg', type: 'Printable[]', description: 'The message to display.' }],
		related: [{ path: 'api/functions/output/warn' }, { path: 'api/functions/output/clear' }],
	},
})

const warn = fn({
	slug: 'warn',
	title: 'Output.warn()',
	icon: 'tabler:alert-triangle',
	summary: 'Display a warning message in the output panel.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'Output.warn(...msg: Printable[]): void',
		description: 'Display a warning message in the output panel.',
		params: [{ name: 'msg', type: 'Printable[]', description: 'The warning message to display.' }],
		related: [{ path: 'api/functions/output/print' }, { path: 'api/functions/output/error' }],
	},
})

const error = fn({
	slug: 'error',
	title: 'Output.error()',
	icon: 'tabler:alert-circle',
	summary: 'Display an error message in the output panel.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'Output.error(...msg: Printable[]): void',
		description: 'Display an error message in the output panel.',
		params: [{ name: 'msg', type: 'Printable[]', description: 'The error message to display.' }],
		related: [{ path: 'api/functions/output/warn' }],
	},
})

const clear = fn({
	slug: 'clear',
	title: 'Output.clear()',
	icon: 'tabler:eraser',
	summary: 'Clear all messages from the output panel.',
	body: {
		kind: 'api-member',
		memberKind: 'function',
		signature: 'Output.clear(): void',
		description: 'Clear all messages from the output panel.',
		related: [{ path: 'api/functions/output/print' }],
	},
})

export const output: DocCategoryNode = {
	kind: 'category',
	slug: 'output',
	title: 'Output',
	icon: 'tabler:message-2',
	summary: 'Print messages to the output panel.',
	intro: 'Functions for writing to the output panel — normal messages, warnings, and errors — plus clearing it.',
	children: [print, warn, error, clear],
}
