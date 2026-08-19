<script setup lang="ts">
import type { DocRef } from '@/assets/docs/docsTypes'
import { useDocRefs } from './useDocRefs'

/**
 * A "see also" row of links to related pages. Deliberately not a DocSection —
 * it's a footer for the page, not a section of it, so it stays out of the
 * table of contents.
 */
defineProps<{
	paths: (string | DocRef)[]
	label?: string
}>()

const { normalize, labelOf, iconOf, href, go } = useDocRefs()
</script>

<template>
	<div class="doc-related">
		<span class="doc-related-label">{{ label ?? 'See also' }}</span>
		<UButton
			v-for="ref in normalize(paths)"
			:key="ref.path"
			:label="labelOf(ref)"
			:icon="iconOf(ref)"
			:href="href(ref)"
			variant="soft"
			color="neutral"
			size="xs"
			@click.prevent="go(ref)"
		/>
	</div>
</template>
