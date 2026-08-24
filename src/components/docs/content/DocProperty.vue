<script setup lang="ts">
/** One row of a DocProperties table; the description is the default slot. */
defineProps<{
	name: string
	type?: string
}>()
</script>

<template>
	<tr>
		<td class="doc-name">{{ name }}</td>
		<td class="doc-type"><code v-if="type">{{ type }}</code></td>
		<td class="doc-desc"><slot></slot></td>
	</tr>
</template>
