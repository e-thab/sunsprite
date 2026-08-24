<script setup lang="ts">
import type { DocRef } from '@/assets/docs/docsTypes'
import DocSection from './DocSection.vue'
import { useDocRefs } from './useDocRefs'

/** The shared traits a class or trait is composed from, as links to their own pages. */
withDefaults(defineProps<{
	paths: (string | DocRef)[]
	id?: string
	title?: string
	hint?: string
}>(), {
	id: 'composed-from',
	title: 'Composed From',
	hint: "Members declared on these shared traits aren't repeated here — click through to see them.",
})

const { normalize, labelOf, iconOf, href, go } = useDocRefs()
</script>

<template>
	<DocSection :id="id" :title="title">
		<p v-if="hint" class="doc-section-hint">{{ hint }}</p>
		<div class="doc-cards">
			<a
				v-for="ref in normalize(paths)"
				:key="ref.path"
				class="doc-card"
				:href="href(ref)"
				@click.prevent="go(ref)"
			>
				<UIcon v-if="iconOf(ref)" :name="iconOf(ref)!" class="doc-card-icon" />
				<span>{{ labelOf(ref) }}</span>
			</a>
		</div>
	</DocSection>
</template>
