<script setup lang="ts">
import DocSection from './DocSection.vue'

/**
 * A worked example. Two ways to write one:
 *
 * - `<DocExample code="..." />` — from a string, usually a template literal in
 *   the page's `<script setup>`. Nothing in the code needs escaping.
 * - `<DocExample><pre>...</pre></DocExample>` — inline in the template. The
 *   `<pre>` isn't optional: Vue's compiler condenses runs of whitespace in
 *   template text, and a literal `<pre>` tag is what switches that off, so
 *   code written without one arrives here as a single line. `<` and `{{` still
 *   have to be written as `&lt;` and `&#123;&#123;` — use the `code` prop
 *   instead if that gets tiresome.
 */
withDefaults(defineProps<{ code?: string; id?: string; title?: string }>(), {
	id: 'example',
	title: 'Example',
})
</script>

<template>
	<DocSection :id="id" :title="title">
		<pre v-if="code" class="doc-example"><code>{{ code }}</code></pre>
		<slot v-else></slot>
	</DocSection>
</template>
