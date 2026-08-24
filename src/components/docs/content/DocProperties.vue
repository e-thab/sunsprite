<script setup lang="ts">
import DocSection from './DocSection.vue'

/**
 * Wraps a list of DocProperty rows. Own properties only — anything a page gets
 * from a composed trait belongs on that trait's own page (see DocMixins).
 */
withDefaults(defineProps<{ id?: string; title?: string }>(), {
	id: 'properties',
	title: 'Properties',
})
</script>

<template>
	<DocSection :id="id" :title="title">
		<table class="doc-table">
			<thead>
				<tr>
					<th>Name</th>
					<th>Type</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>
				<slot></slot>
			</tbody>
		</table>
	</DocSection>
</template>
