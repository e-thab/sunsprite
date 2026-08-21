<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { useToast } from '@nuxt/ui/composables'
import DocSection from './DocSection.vue'

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
 *   have to be written as `&lt;` and `&#123;&#123;`.
 * - `<DocSnippet :code="source" />` — from a string, usually a template
 *   literal in the page's `<script setup>`. Nothing in the code needs
 *   escaping, which is the easier option once it contains either of those.
 * - `<DocSnippet :code="{ Sunsprite: a, JavaScript: b }" />` — from an object,
 *   for a snippet whose code differs by language. Its keys label a selector
 *   rendered above the block; picking one swaps in its code. A single-key
 *   object renders like the plain string form, with no selector.
 */
const props = defineProps<{
	code?: string | Record<string, string>
	/** Anchor for the section — derived from `title` when omitted. */
	id?: string
	title?: string
}>()

function slugify(title: string): string {
	return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// No id and no title means no section: just the block on its own.
const sectionId = computed(() => props.id ?? (props.title ? slugify(props.title) : undefined))

// A `code` object's keys are the language selector's labels; a lone key
// renders the same as the plain string form, with no selector to pick it.
const variants = computed(() => (typeof props.code === 'object' ? props.code : undefined))
const languages = computed(() => Object.keys(variants.value ?? {}))
const languageItems = computed(() => languages.value.map((label) => ({ label, value: label, icon: `mdi:language-${label.toLowerCase()}` })))

const activeLanguage = ref(languages.value[0])

const displayedCode = computed(() => {
	if (typeof props.code === 'string') return props.code
	if (!activeLanguage.value) return undefined
	return variants.value?.[activeLanguage.value]
})

// Reads from the rendered `<pre>` rather than `displayedCode`, so it copies
// slot-provided code too — DocSnippet never sees that as a string, only as
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
				<pre v-if="displayedCode" class="doc-snippet"><code>{{ displayedCode }}</code></pre>
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
			<pre v-if="displayedCode" class="doc-snippet"><code>{{ displayedCode }}</code></pre>
			<slot v-else></slot>
			<UTooltip text="Copy code">
				<UButton icon="tabler:copy-filled" variant="ghost" color="neutral" size="xs" class="doc-snippet-copy" @click="copyCode" />
			</UTooltip>
		</div>
	</div>
</template>
