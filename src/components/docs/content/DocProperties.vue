<script setup lang="ts">
import DocSection from './DocSection.vue'
import { provideDocFromColumn } from './useDocFromColumn'

/**
 * Wraps a list of DocProperty entries — every property the page's subject has,
 * including the ones it gets from a composed trait. An inherited row carries
 * `from` so it links back to the trait that declares it (see DocMixins); the
 * column that holds those links only appears once a row asks for it.
 *
 * There's no Description heading: each entry's description is a row of its own
 * under the entry, not a column, so the table is four columns wide at most.
 */
withDefaults(defineProps<{ id?: string; title?: string }>(), {
	id: 'properties',
	title: 'Properties',
})

const fromColumn = provideDocFromColumn()
</script>

<template>
	<DocSection :id="id" :title="title">
		<div class="doc-table-scroll">
			<table class="doc-table">
				<thead>
					<tr>
						<th>Name</th>
						<th>Type</th>
						<th>Default</th>
						<th v-if="fromColumn" class="doc-from-cell">From</th>
					</tr>
				</thead>
				<tbody>
					<slot></slot>
				</tbody>
			</table>
		</div>
	</DocSection>
</template>
