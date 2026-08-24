<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { useToast } from '@nuxt/ui/composables'
import type { TokenPalette } from '@/assets/theme/themes'
import DocSection from './DocSection.vue'

/**
 * A snippet's manual-highlight colors — the same syntax-token categories
 * (keyword, type, string, comment, ...) each editor theme in
 * `@/assets/theme` already defines for Monaco, so a highlighted snippet
 * tracks whatever theme the user has picked instead of a fixed palette.
 * Bracket-pair colors are a theme-internal detail of that editor, not
 * something meaningful to hand-assign here, so they're excluded.
 */
type HighlightColor = keyof Omit<TokenPalette, 'bracketColor1' | 'bracketColor2' | 'bracketColor3' | 'bracketColorUnexpected'>
/** One piece of a snippet: plain text, or text colored to fake a syntax highlighter. */
type CodeSegment = string | { text: string; color: HighlightColor }
type CodeValue = string | CodeSegment[]

/**
 * A block of code — a signature, a worked example, a snippet mid-page. Every
 * snippet shows a copy-to-clipboard button on hover.
 *
 * Pass a `title` (or an `id`) to make it a section of the page, with a heading
 * and an anchor the table of contents can link to. With neither it renders as
 * a bare block, which is what a signature under the page heading wants.
 *
 * Three ways to give it the code:
 *
 * - `<DocSnippet><pre>...</pre></DocSnippet>` — inline in the template. The
 *   `<pre>` isn't optional: Vue's compiler condenses runs of whitespace in
 *   template text, and a literal `<pre>` tag is what switches that off, so
 *   code written without one arrives here as a single line. `<` and `{{` also
 *   have to be written as `&lt;` and `&#123;&#123;`. Color a piece of it by
 *   hand with a `<span class="doc-snippet-hl-keyword">` (see `HighlightColor`
 *   above for the full list — the class name is the same word, kebab-cased)
 *   around whatever needs it.
 * - `<DocSnippet :code="source" />` — from a string, usually a template
 *   literal in the page's `<script setup>`. Nothing in the code needs
 *   escaping, which is the easier option once it contains either of those.
 * - `<DocSnippet :code="['rect.color = ', { text: 'Colors.Peru', color: 'type' }]" />`
 *   — from an array mixing plain strings with `{ text, color }` pieces, to
 *   manually color specific tokens as a stand-in for real syntax
 *   highlighting (there's no language-aware highlighter here) — `color` is
 *   a `HighlightColor` (above).
 *
 * Any of the above works per-language too: `code` can also be an object —
 * `{ Sunsprite: a, JavaScript: b }` — keyed by language, each value one of
 * the plain forms above. Its keys label a selector rendered above the block;
 * picking one swaps in its code. A single-key object renders like its plain
 * form, with no selector.
 */
const props = defineProps<{
	code?: CodeValue | Record<string, CodeValue>
	/** Anchor for the section — derived from `title` when omitted. */
	id?: string
	title?: string
}>()

function slugify(title: string): string {
	return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// camelCase token names (numberHex, stringEscape, ...) as kebab-case CSS
// class suffixes, matching every other class name in docsPage.css.
function kebabCase(name: string): string {
	return name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

// No id and no title means no section: just the block on its own.
const sectionId = computed(() => props.id ?? (props.title ? slugify(props.title) : undefined))

// A plain object keyed by language name is the multi-language form. A
// segment array is itself the code for one language, so — despite also
// being an "object" by typeof — it's excluded here.
const variants = computed(() => (props.code && typeof props.code === 'object' && !Array.isArray(props.code) ? props.code : undefined))
const languages = computed(() => Object.keys(variants.value ?? {}))
const languageItems = computed(() => languages.value.map((label) => ({ label, value: label, icon: `mdi:language-${label.toLowerCase()}` })))

const activeLanguage = ref(languages.value[0])

// Whichever language is on screen right now, flattened to one plain-text
// segment per piece so the template never has to branch on `code`'s shape —
// a bare string (or a bare-string piece of an array) is just a segment with
// no color class.
const segments = computed<Array<{ text: string; class?: string }>>(() => {
	const value: CodeValue | undefined = variants.value
		? (activeLanguage.value ? variants.value[activeLanguage.value] : undefined)
		: (props.code as CodeValue | undefined)
	if (!value) return []
	const pieces = typeof value === 'string' ? [value] : value
	return pieces.map((piece) => (typeof piece === 'string' ? { text: piece } : { text: piece.text, class: `doc-snippet-hl-${kebabCase(piece.color)}` }))
})

// Reads from the rendered `<pre>` rather than `segments`, so it copies
// slot-provided code too — DocSnippet never sees that as data, only as
// whatever markup the caller passed in.
const bodyEl = useTemplateRef<HTMLElement>('bodyEl')
const toast = useToast()

async function copyCode() {
	const text = bodyEl.value?.querySelector('pre')?.textContent
	if (!text) return
	await navigator.clipboard.writeText(text)
	toast.add({ title: 'Copied to clipboard', icon: 'tabler:copy-filled' })
}
</script>

<template>
	<DocSection v-if="sectionId" :id="sectionId" :title="title">
		<div class="doc-snippet-frame">
			<UTabs v-if="languages.length > 1" v-model="activeLanguage" :items="languageItems" :content="false" color="primary" variant="link" size="xs" class="doc-snippet-tabs" />
			<div ref="bodyEl" class="doc-snippet-body">
				<pre v-if="segments.length" class="doc-snippet"><code><span v-for="(seg, i) in segments" :key="i" :class="seg.class">{{ seg.text }}</span></code></pre>
				<slot v-else></slot>
				<UTooltip text="Copy code">
					<UButton icon="tabler:copy-filled" variant="ghost" color="neutral" size="xs" class="doc-snippet-copy" @click="copyCode" />
				</UTooltip>
			</div>
		</div>
	</DocSection>
	<div v-else class="doc-snippet-frame">
		<UTabs v-if="languages.length > 1" v-model="activeLanguage" :items="languageItems" :content="false" color="primary" variant="link" size="xs" class="doc-snippet-tabs" />
		<div ref="bodyEl" class="doc-snippet-body">
			<pre v-if="segments.length" class="doc-snippet"><code><span v-for="(seg, i) in segments" :key="i" :class="seg.class">{{ seg.text }}</span></code></pre>
			<slot v-else></slot>
			<UTooltip text="Copy code">
				<UButton icon="tabler:copy-filled" variant="ghost" color="neutral" size="xs" class="doc-snippet-copy" @click="copyCode" />
			</UTooltip>
		</div>
	</div>
</template>
