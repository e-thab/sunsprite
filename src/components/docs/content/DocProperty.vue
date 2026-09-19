<script setup lang="ts">
import type { DocRef } from '@/assets/docs/docsTypes'
import DocFrom from './DocFrom.vue'
import { useDocFromColumn } from './useDocFromColumn'

/**
 * One row of a DocProperties table; the description is the default slot.
 * `from` names the trait a composing page inherits this property from —
 * omitted on a page's own properties.
 */
const props = defineProps<{
	name: string
	type?: string
	from?: string | DocRef
	readonly?: boolean
}>()

const fromColumn = useDocFromColumn(props.from)
</script>

<template>
	<tr>
		<td class="doc-name">{{ name }}</td>
		<td class="doc-type">
			<code v-if="type">{{ type }}</code>
			<span v-if="readonly" class="doc-readonly">read-only</span>
		</td>
		<td class="doc-desc"><slot></slot></td>
		<td v-if="fromColumn" class="doc-from-cell">
			<DocFrom v-if="from" :from="from" />
		</td>
	</tr>
</template>
