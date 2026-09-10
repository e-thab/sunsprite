<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ProgressGroupItem } from '@nuxt/ui'
import { useFileStore } from '@/stores/fileStore'
import { PROJECT_STORAGE_QUOTA_BYTES } from '@/stores/projectStore'
import { formatBytes } from '@/assets/utils/formatBytes'

const fileStore = useFileStore()
const expanded = ref(false)

// Computed directly from the file tree already loaded into fileStore — no
// extra fetch. Unlike ProjectsView.vue's list (which needs a dedicated
// aggregate query across every project a user owns), the editor already has
// this exact project's scripts/textFiles/images in memory to power the tree
// itself, so summing them here is free and stays live as files are added/
// removed/edited during the session, without needing its own network call.
const encoder = new TextEncoder()
const usage = computed(() => {
	let textBytes = 0
	for (const script of fileStore.scripts) textBytes += encoder.encode(script.content).length
	for (const file of fileStore.textFiles) textBytes += encoder.encode(file.content).length
	const imageBytes = fileStore.images.reduce((sum, image) => sum + image.size, 0)
	// No sound-file storage in the data model yet — see StorageUsage's own
	// comment in projectStore.ts. Always 0 until that exists.
	return { textBytes, imageBytes, soundBytes: 0 }
})

const usedBytes = computed(() => usage.value.textBytes + usage.value.imageBytes + usage.value.soundBytes)
const isOverQuota = computed(() => usedBytes.value > PROJECT_STORAGE_QUOTA_BYTES)

const groupItems = computed<ProgressGroupItem[]>(() => [
	{ label: 'Text', icon: 'tabler:file-text', value: usage.value.textBytes, color: 'var(--theme-text)' },
	{ label: 'Images', icon: 'tabler:photo', value: usage.value.imageBytes, color: 'var(--theme-primary)' },
	{ label: 'Audio', icon: 'tabler:music', value: usage.value.soundBytes, color: 'var(--theme-secondary)' },
])
</script>

<template>
	<div class="storage-indicator">
		<!-- Collapsed: the simple single bar. Expanded: swapped for
		     UProgressGroup, whose own item list is what surfaces the
		     per-category breakdown — same component ProjectsView.vue's list
		     used before being simplified back down to the plain bar there. -->
		<UProgress
			v-if="!expanded"
			:model-value="usedBytes"
			:max="PROJECT_STORAGE_QUOTA_BYTES"
			:color="isOverQuota ? 'error' : 'primary'"
			size="sm"
			class="storage-widget"
		>
			<template #status>
				<span :class="{ 'storage-status-over': isOverQuota }">{{ formatBytes(usedBytes) }} / {{ formatBytes(PROJECT_STORAGE_QUOTA_BYTES) }}</span>
			</template>
		</UProgress>

		<UProgressGroup
			v-else
			:items="groupItems"
			:max="PROJECT_STORAGE_QUOTA_BYTES"
			size="sm"
			class="storage-widget"
		>
			<template #status>
				<span :class="{ 'storage-status-over': isOverQuota }">{{ formatBytes(usedBytes) }} / {{ formatBytes(PROJECT_STORAGE_QUOTA_BYTES) }}</span>
			</template>
			<template #item-trailing="{ item }">
				{{ formatBytes(item.value ?? 0) }}
			</template>
		</UProgressGroup>

		<div class="button-wrapper">
			<UTooltip :text="expanded ? 'Collapse' : 'Expand'" ignore-non-keyboard-focus>
				<UButton
				class="expand-button"
				:icon="expanded ? 'tabler:chevron-down' : 'tabler:chevron-up'"
				variant="soft"
				color="neutral"
				size="xs"
				:aria-label="expanded ? 'Collapse storage details' : 'Expand storage details'"
				@click="expanded = !expanded"
				/>
			</UTooltip>
		</div>
	</div>
</template>

<style scoped>
.storage-indicator {
	flex-shrink: 0;
	display: flex;
	align-items: flex-start;
	padding: 0.5em;
	border-top: 1px solid var(--theme-border);
	background-color: var(--theme-bg-elevated);
}

.storage-widget {
	flex: 1 1 auto;
	min-width: 0;
}

.button-wrapper {
	position: relative;
	width: 0;
	height: 0;
}

.expand-button {
	position: absolute;
	right: 0;
}

/* Same fix as ProjectsView.vue's own status override — status's theme class
   ties its width to the fill percentage (built for a trailing percentage
   label), which leaves a low-usage project's "X / Y" readout almost no room. */
.storage-widget :deep([data-slot="status"]) {
	width: 100% !important;
	justify-content: flex-start;
	font-weight: bold;
	color: var(--theme-text);
}

.storage-status-over {
	color: var(--theme-error);
}

/* .storage-widget :deep([data-slot="list"]) {
	margin-top: 0.3em;
} */
</style>
