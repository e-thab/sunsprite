<script setup lang="ts">
import { computed } from 'vue'
import DocSection from './DocSection.vue'

/**
 * A block of code — a signature, a worked example, a snippet mid-page.
 *
 * Pass a `title` (or an `id`) to make it a section of the page, with a heading
 * and an anchor the table of contents can link to. With neither it renders as
 * a bare block, which is what a signature under the page heading wants.
 *
 * Two ways to give it the code:
 *
 * - `<DocSnippet><pre>...</pre></DocSnippet>` — inline in the template. The
 *   `<pre>` isn't optional: Vue's compiler condenses runs of whitespace in
 *   template text, and a literal `<pre>` tag is what switches that off, so
 *   code written without one arrives here as a single line. `<` and `{{` also
 *   have to be written as `&lt;` and `&#123;&#123;`.
 * - `<DocSnippet :code="source" />` — from a string, usually a template
 *   literal in the page's `<script setup>`. Nothing in the code needs
 *   escaping, which is the easier option once it contains either of those.
 */
const props = defineProps<{
	code?: string
	/** Anchor for the section — derived from `title` when omitted. */
	id?: string
	title?: string
}>()

function slugify(title: string): string {
	return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// No id and no title means no section: just the block on its own.
const sectionId = computed(() => props.id ?? (props.title ? slugify(props.title) : undefined))
</script>

<template>
	<DocSection v-if="sectionId" :id="sectionId" :title="title">
		<pre v-if="code" class="doc-snippet"><code>{{ code }}</code></pre>
		<slot v-else></slot>
	</DocSection>
	<pre v-else-if="code" class="doc-snippet"><code>{{ code }}</code></pre>
	<slot v-else></slot>
</template>
