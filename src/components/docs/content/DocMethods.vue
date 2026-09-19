<script setup lang="ts">
import DocSection from './DocSection.vue'
import { provideDocFromColumn } from './useDocFromColumn'

/**
 * Wraps a list of DocMethod rows. Inherited methods are listed too, same as
 * DocProperties — but each row stacks its description under its signature
 * rather than beside it, so the table is two columns wide at most.
 */
withDefaults(defineProps<{ id?: string; title?: string }>(), {
	id: 'methods',
	title: 'Methods',
})

const fromColumn = provideDocFromColumn()
</script>

<template>
	<DocSection :id="id" :title="title">
		<div class="doc-table-scroll">
			<table class="doc-table">
				<thead>
					<tr>
						<th>Signature</th>
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
