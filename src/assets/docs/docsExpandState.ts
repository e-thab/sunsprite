import type { InjectionKey } from 'vue'

export interface DocsExpandState {
	isExpanded: (id: string) => boolean
	toggle: (id: string) => void
}

export const docsExpandStateKey: InjectionKey<DocsExpandState> = Symbol('docsExpandState')
