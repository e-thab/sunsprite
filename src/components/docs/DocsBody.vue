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
			<div class="header-actions">
				<slot name="header-actions"></slot>
			</div>
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

/* flex-shrink: 0 rather than the min-width: 0 this used to carry (which let
   the group compress below its natural content width, shrinking the icon
   and then letting the title's own overflow get run over by the actions
   button — flex layout positions siblings off box size, not painted
   overflow). Neither this group nor .header-actions below ever shrinks now;
   .docs-body-header's own ancestor pane already clips horizontal overflow
   (splitpanes__pane { overflow: hidden }), so once there's no room left the
   row just runs past the pane's edge and gets covered by it instead of
   reflowing internally. */
.header-title-group {
	display: flex;
	align-items: center;
	gap: 0.5em;
	flex-shrink: 0;
}

.header-icon {
	color: var(--theme-text-toned);
	font-size: 1.3em;
}

.header-title {
	margin: 0;
	font-size: 1.3em;
	color: var(--theme-text-highlighted);
	white-space: nowrap;
}

.header-actions {
	flex-shrink: 0;
}
</style>
