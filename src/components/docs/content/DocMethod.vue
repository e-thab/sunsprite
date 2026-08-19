<script setup lang="ts">
/**
 * One row of a DocMethods table; the description is the default slot.
 * Overloads are just repeated rows with the same name.
 */
defineProps<{
	signature: string
}>()
</script>

<template>
	<tr>
		<td class="doc-name"><code>{{ signature }}</code></td>
		<td class="doc-desc"><slot></slot></td>
	</tr>
</template>
