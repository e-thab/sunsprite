<script setup lang="ts">
import DocSection from './DocSection.vue'

/** What a function gives back; the description is the default slot. */
withDefaults(defineProps<{ type?: string; id?: string; title?: string }>(), {
	id: 'returns',
	title: 'Returns',
})
</script>

<template>
	<DocSection :id="id" :title="title">
		<p><code v-if="type">{{ type }}</code><template v-if="type"> — </template><slot /></p>
	</DocSection>
</template>
