<script setup lang="ts">
import DocSection from './DocSection.vue'

/** Wraps a list of DocParam rows. */
withDefaults(defineProps<{ id?: string; title?: string }>(), {
	id: 'params',
	title: 'Params',
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
