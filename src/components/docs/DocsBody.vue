<script setup lang="ts">
import type { DocEntryNode } from '@/assets/docs/docsTypes'

/**
 * The chrome around a page: its header, and then the page's own SFC. Anything
 * below the title is the page's business — see `@/assets/docs/content` for the
 * pages themselves and `./content` for the blocks they're built from.
 */
defineProps<{
	node: DocEntryNode
}>()
</script>

<template>
	<div class="docs-body">
		<header class="docs-body-header">
			<div class="header-title-group">
				<UIcon v-if="node.icon" :name="node.icon" class="header-icon" />
				<h1 class="header-title">{{ node.title }}</h1>
			</div>
			<slot name="header-actions"></slot>
		</header>

		<div class="docs-page">
			<component :is="node.component" />
		</div>
	</div>
</template>

<style scoped>
.docs-body {
	color: var(--theme-text);
}

.docs-body-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5em;
	margin-bottom: 0.75em;
}

.header-title-group {
	display: flex;
	align-items: center;
	gap: 0.5em;
	min-width: 0;
}

.header-icon {
	color: var(--theme-text-toned);
	font-size: 1.3em;
}

.header-title {
	margin: 0;
	font-size: 1.3em;
	color: var(--theme-text-highlighted);
}
</style>
