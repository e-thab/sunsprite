<script setup lang="ts">
/** One row of a DocParams table; the description is the default slot. */
defineProps<{
	name: string
	type?: string
	optional?: boolean
}>()
</script>

<template>
	<tr>
		<td class="doc-name">{{ name }}<span v-if="optional" class="doc-optional">?</span></td>
		<td class="doc-type"><code v-if="type">{{ type }}</code></td>
		<td class="doc-desc"><slot></slot></td>
	</tr>
</template>
