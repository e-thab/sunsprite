<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useTemplateRef } from 'vue'
import { useDocsToc } from '@/assets/docs/docsToc'

/**
 * A titled, anchored block of page content — and the unit the table of
 * contents is built from. The other doc blocks (DocParams, DocMethods, ...)
 * are all sections themselves; use this directly for anything they don't
 * cover.
 */
const props = defineProps<{
	/** Anchor, unique within the page — the DOM id becomes `section-<id>`. */
	id: string
	/** Heading. A section without one renders bare and stays out of the table of contents. */
	title?: string
}>()

const domId = computed(() => `section-${props.id}`)

const root = useTemplateRef<HTMLElement>('root')
const toc = useDocsToc()

onMounted(() => {
	if (props.title && root.value) toc?.register({ id: domId.value, label: props.title, el: root.value })
})

onBeforeUnmount(() => toc?.unregister(domId.value))
</script>

<template>
	<section :id="domId" ref="root" class="doc-section">
		<h2 v-if="title" class="doc-section-title">{{ title }}</h2>
		<slot></slot>
	</section>
</template>
