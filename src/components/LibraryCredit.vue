<script setup lang="ts">
import type { LibraryAttribution } from '@/api/library'

// The credit popover's contents, shared by AssetLibrary.vue (on an attributed
// folder) and FileTree.vue (on a project's link to a Library asset, which also
// passes the asset's path so it's clear what the link points at).
defineProps<{
	attribution?: LibraryAttribution
	// Shown when the attribution has no title of its own.
	fallbackTitle?: string
	path?: string
}>()
</script>

<template>
	<div class="credit-card">
		<div v-if="path" class="credit-path">{{ path }}</div>
		<template v-if="attribution">
			<div v-if="attribution.title ?? fallbackTitle" class="credit-title">{{ attribution.title ?? fallbackTitle }}</div>
			<div>by {{ attribution.author }}</div>
			<div v-if="attribution.license" class="credit-license">
				License:
				<a v-if="attribution.licenseUrl" :href="attribution.licenseUrl" target="_blank" rel="noopener">{{ attribution.license }}</a>
				<template v-else>{{ attribution.license }}</template>
			</div>
			<a v-if="attribution.url" :href="attribution.url" target="_blank" rel="noopener" class="credit-link">
				<UIcon name="tabler:external-link" />{{ attribution.url.replace(/^https?:\/\//, '') }}
			</a>
		</template>
	</div>
</template>

<style scoped>
.credit-card {
	display: flex;
	flex-direction: column;
	gap: 0.2em;
	padding: 0.6em 0.75em;
	max-width: 18rem;
	font-size: 0.85em;
}

/* Paths run long and have no spaces to wrap at. */
.credit-path {
	font-family: monospace;
	color: var(--theme-text-toned);
	overflow-wrap: anywhere;
	user-select: text;
}

.credit-path:not(:last-child) {
	padding-bottom: 0.4em;
	margin-bottom: 0.2em;
	border-bottom: 1px solid var(--theme-border);
}

.credit-title {
	font-weight: 600;
}

.credit-license,
.credit-link {
	color: var(--theme-text-toned);
}

.credit-card a {
	text-decoration: underline;
}

.credit-link {
	display: inline-flex;
	align-items: center;
	gap: 0.3em;
	margin-top: 0.2em;
	overflow-wrap: anywhere;
}
</style>
