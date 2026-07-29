<script setup lang="ts">
import type { TreeItem } from '@nuxt/ui'
import { useToast } from '@nuxt/ui/composables'
import { exampleScriptNames } from '@/assets/api/examples'
import { imagePath, animalFiles, cardFiles } from '@/assets/api/gameAssets'

const emit = defineEmits<{
	previewImage: [path: string, label: string]
}>()

const toast = useToast()

async function copyPath(path: string) {
	await navigator.clipboard.writeText(path)
	toast.add({
		title: 'Copied to clipboard',
		description: path,
		icon: 'tabler:copy',
	})
}

function imageLeaf(category: string, fileName: string): TreeItem {
	const path = imagePath(category, fileName)
	return {
		label: fileName,
		// Rendered as a real thumbnail in #item-leading below rather than an
		// icon — these are the actual game assets, so the path doubles as
		// both the copy-button value and a working <img> src (public/ is
		// served as-is at the site root in both dev and prod).
		thumbnail: path,
		path,
		onSelect: () => emit('previewImage', path, fileName),
	}
}

const items: TreeItem[] = [
	{
		label: 'images',
		defaultExpanded: false,
		children: [
			{
				label: 'animals',
				defaultExpanded: false,
				children: animalFiles.map((f) => imageLeaf('animals', f)),
			},
			{
				label: 'cards',
				defaultExpanded: false,
				children: cardFiles.map((f) => imageLeaf('cards', f)),
			},
		],
	},
	{
		label: 'sounds',
		defaultExpanded: false,
		children: [
			{ label: 'No sounds yet', disabled: true },
		],
	},
	{
		label: 'scripts',
		defaultExpanded: false,
		children: exampleScriptNames.map((name) => ({
			label: name,
			icon: 'catppuccin:javascript',
			path: name,
		})),
	},
]
</script>

<template>
	<div class="panel-wrapper">
		<div class="panel-bar">
			<div class="spacer"></div>
			<div>Assets</div>
			<div class="spacer"></div>
		</div>

		<div class="asset-tree">
			<UTree :items="items" class="asset-tree">
				<template #item-leading="{ item, expanded }">
					<img v-if="item.thumbnail" :src="item.thumbnail" class="thumbnail-icon" alt="" />
					<UIcon v-else-if="item.icon" :name="item.icon" class="leading-icon" />
					<UIcon v-else-if="item.children?.length" :name="expanded ? 'tabler:folder-open-filled' : 'tabler:folder-filled'" class="leading-icon" />
				</template>

				<template #item-trailing="{ item }">
					<div v-if="!item.children && item.path" class="item-actions">
						<UTooltip text="Copy path">
							<UButton icon="tabler:copy" variant="ghost" color="neutral" size="xs" @click.stop="copyPath(item.path)" />
						</UTooltip>
					</div>
				</template>
			</UTree>
		</div>
	</div>
</template>

<style scoped>
.asset-tree {
	flex: 1 1 auto;
	min-height: 0;
	overflow-y: auto;
	background-color: var(--theme-bg-neutral);
}

.spacer {
	width: 1.5em;
	flex: 0 1 auto;
}

.thumbnail-icon {
	width: 1.25rem;
	height: 1.25rem;
	flex-shrink: 0;
	object-fit: contain;
	border-radius: 0.2rem;
	background-color: var(--theme-bg-dark);
}

.leading-icon {
	width: 1.25rem;
	height: 1.25rem;
	flex-shrink: 0;
}

/* Same reveal-on-hover pattern as FileTree.vue's rename/delete actions. */
.item-actions {
	display: flex;
	align-items: center;
	gap: 0.15em;
	position: absolute;
	right: 0.5em;
	top: 50%;
	transform: translateY(-50%);
	opacity: 0;
	pointer-events: none;
	transition: opacity 0.1s;
}

:deep([data-slot="link"]:hover) .item-actions,
:deep([data-slot="link"]:focus-within) .item-actions {
	opacity: 1;
	pointer-events: auto;
}
</style>
