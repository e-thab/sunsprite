<script setup lang="ts">
import { Comment, Fragment, Text, computed, isVNode, ref, useSlots, useTemplateRef, type VNode } from 'vue'
import { useToast } from '@nuxt/ui/composables'
import type { TokenPalette } from '@/assets/theme/themes'
import { tokenizeCode } from '@/assets/docs/docsCode'
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
 *   around whatever needs it; doing so opts the whole block out of the
 *   automatic highlighting below, since the block is then markup rather than
 *   text and there's nothing left to tokenize.
 * - `<DocSnippet :code="source" />` — from a string, usually a template
 *   literal in the page's `<script setup>`. Nothing in the code needs
 *   escaping, which is the easier option once it contains either of those.
 * - `<DocSnippet :code="['rect.color = ', { text: 'Colors.Peru', color: 'type' }]" />`
 *   — from an array mixing plain strings with `{ text, color }` pieces, to
 *   override the automatic coloring of specific tokens — `color` is a
 *   `HighlightColor` (above).
 *
 * Everything given as plain text is syntax-highlighted for you (see
 * docsCode.ts), in the colors the editor would give the same code under
 * whatever theme is active. A hand-written `{ text, color }` piece keeps the
 * color it names; only the plain pieces around it are tokenized.
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

// The slot's own vnodes, for reading a `<pre>`-wrapped snippet as text (see
// segments below). useSlots rather than the `slots` a render function would be
// handed, since this is `<script setup>`.
const slots = useSlots()

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

/**
 * The text of a node whose children are all text — the `<pre>` a slot-provided
 * snippet is written in. Returns undefined the moment it finds a real element,
 * which is what makes hand-colored markup (a `doc-snippet-hl-*` span) opt out:
 * there's no plain text to tokenize, so the slot is rendered as written.
 */
function plainText(node: VNode): string | undefined {
	if (typeof node.children === 'string') return node.children
	if (!Array.isArray(node.children)) return undefined

	let text = ''
	for (const child of node.children) {
		if (typeof child === 'string') text += child
		else if (!isVNode(child)) return undefined
		else if (child.type === Text) text += String(child.children ?? '')
		else if (child.type !== Comment) return undefined
	}
	return text
}

/** The `<pre>` in slot content, which a v-if or a v-for can leave inside a fragment. */
function findPre(nodes: VNode[]): VNode | undefined {
	for (const node of nodes) {
		if (!isVNode(node)) continue
		if (node.type === 'pre') return node
		if (node.type === Fragment && Array.isArray(node.children)) {
			const nested = findPre(node.children as VNode[])
			if (nested) return nested
		}
	}
	return undefined
}

/**
 * Whichever language is on screen right now, as colored spans.
 *
 * A plain function rather than a computed, because part of what it reads isn't
 * reactive: slot content arrives as vnodes, and a cached computed would go on
 * showing the last page's code if Vue reuses this instance for the next one —
 * the same reuse DocMethod guards its measurements against. Re-tokenizing per
 * render costs nothing at the size of a doc snippet.
 */
function segments(): Array<{ text: string; class?: string }> {
	const value: CodeValue | undefined = variants.value
		? (activeLanguage.value ? variants.value[activeLanguage.value] : undefined)
		: (props.code as CodeValue | undefined)

	// No `code` at all means the snippet came in through the slot; its text is
	// tokenized the same way, and only markup it can't read sends it back to
	// rendering the slot itself.
	const slotPre = value === undefined ? findPre(slots.default?.() ?? []) : undefined
	const slotText = slotPre ? plainText(slotPre) : undefined

	const pieces: CodeSegment[] = value === undefined
		? (slotText === undefined ? [] : [slotText])
		: (typeof value === 'string' ? [value] : value)

	// A hand-written piece keeps the color it names; everything given as plain
	// text is tokenized.
	return pieces.flatMap((piece) =>
		typeof piece === 'string'
			? tokenizeCode(piece).map((token) => ({ text: token.text, class: `doc-snippet-hl-${kebabCase(token.kind)}` }))
			: [{ text: piece.text, class: `doc-snippet-hl-${kebabCase(piece.color)}` }]
	)
}

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
				<pre v-if="segments().length" class="doc-snippet"><code><span v-for="(seg, i) in segments()" :key="i" :class="seg.class">{{ seg.text }}</span></code></pre>
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
			<pre v-if="segments().length" class="doc-snippet"><code><span v-for="(seg, i) in segments()" :key="i" :class="seg.class">{{ seg.text }}</span></code></pre>
			<slot v-else></slot>
			<UTooltip text="Copy code">
				<UButton icon="tabler:copy-filled" variant="ghost" color="neutral" size="xs" class="doc-snippet-copy" @click="copyCode" />
			</UTooltip>
		</div>
	</div>
</template>
