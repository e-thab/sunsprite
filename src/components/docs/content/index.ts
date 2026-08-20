import type { App } from 'vue'
import '@/assets/docs/docsPage.css'
import DocColorSwatches from './DocColorSwatches.vue'
import DocLink from './DocLink.vue'
import DocMethod from './DocMethod.vue'
import DocMethods from './DocMethods.vue'
import DocMixins from './DocMixins.vue'
import DocParam from './DocParam.vue'
import DocParams from './DocParams.vue'
import DocProperties from './DocProperties.vue'
import DocProperty from './DocProperty.vue'
import DocRelated from './DocRelated.vue'
import DocReturns from './DocReturns.vue'
import DocSection from './DocSection.vue'
import DocSnippet from './DocSnippet.vue'

/**
 * The building blocks a docs page writes its body out of. They're registered
 * globally (from main.ts) rather than imported per page, so a page under
 * `@/assets/docs/content` is just markup — no import block to maintain, which
 * is what makes pages quick to write and edit.
 *
 * Anything added here is immediately usable, and type-checked, in every page.
 * A page is a normal SFC either way, so it can still import its own
 * components for one-off content.
 */
export const docComponents = {
	DocColorSwatches,
	DocLink,
	DocMethod,
	DocMethods,
	DocMixins,
	DocParam,
	DocParams,
	DocProperties,
	DocProperty,
	DocRelated,
	DocReturns,
	DocSection,
	DocSnippet,
}

export function installDocComponents(app: App) {
	for (const [name, component] of Object.entries(docComponents)) {
		app.component(name, component)
	}
}

// What gives pages their type-checking and editor autocomplete for the tags
// above, since nothing imports them.
declare module 'vue' {
	interface GlobalComponents extends DocComponents {}
}

type DocComponents = typeof docComponents
