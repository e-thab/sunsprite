import type { Component } from 'vue'
import ColorSwatches from './ColorSwatches.vue'

/**
 * Components a doc page can drop into its body via a `DocWidgetSection`, keyed
 * by name so the content modules under `@/assets/docs/content` stay plain data.
 * Add an entry here and the name becomes valid in `DocBody.widgets`.
 */
export const docWidgets = {
	'color-swatches': ColorSwatches,
} satisfies Record<string, Component>

export type DocWidgetName = keyof typeof docWidgets
