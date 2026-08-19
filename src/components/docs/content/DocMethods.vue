<script setup lang="ts">
import DocSection from './DocSection.vue'

/** Wraps a list of DocMethod rows. Own methods only, same as DocProperties. */
withDefaults(defineProps<{ id?: string; title?: string }>(), {
	id: 'methods',
	title: 'Methods',
})
</script>

<template>
	<DocSection :id="id" :title="title">
		<table class="doc-table">
			<thead>
				<tr>
					<th>Signature</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>
				<slot></slot>
			</tbody>
		</table>
	</DocSection>
</template>
