<script setup lang="ts">
import type { TreeItem } from '@nuxt/ui'
import { useToast } from '@nuxt/ui/composables'
import { exampleScriptNames } from '@/assets/api/examples'

const toast = useToast()

async function copyPath(path: string) {
	await navigator.clipboard.writeText(path)
	toast.add({
		title: 'Copied to clipboard',
		description: path,
		icon: 'tabler:copy',
	})
}

// Built-in game assets live in public/ (loaded by Phaser at runtime via a
// literal URL string, e.g. Sprite's `src`), unlike src/assets/images (editor
// chrome icons bundled through Vite). public/ isn't part of Vite's module
// graph, so there's no way to glob it at build time — this list is
// hand-kept in sync with public/images/*.
function imageLeaf(category: string, fileName: string): TreeItem {
	const path = `/images/${category}/${fileName}`
	return {
		label: fileName,
		// Rendered as a real thumbnail in #item-leading below rather than an
		// icon — these are the actual game assets, so the path doubles as
		// both the copy-button value and a working <img> src (public/ is
		// served as-is at the site root in both dev and prod).
		thumbnail: path,
		path,
	}
}

const animalFiles = [
	'elephant.png',
	'giraffe.png',
	'hippo.png',
	'monkey.png',
	'panda.png',
	'parrot.png',
	'penguin.png',
	'pig.png',
	'rabbit.png',
	'snake.png',
]

const cardFiles = [
	'back.png',
	'clubs_02.png',
	'clubs_03.png',
	'clubs_04.png',
	'clubs_05.png',
	'clubs_06.png',
	'clubs_07.png',
	'clubs_08.png',
	'clubs_09.png',
	'clubs_10.png',
	'clubs_A.png',
	'clubs_J.png',
	'clubs_K.png',
	'clubs_Q.png',
	'diamonds_02.png',
	'diamonds_03.png',
	'diamonds_04.png',
	'diamonds_05.png',
	'diamonds_06.png',
	'diamonds_07.png',
	'diamonds_08.png',
	'diamonds_09.png',
	'diamonds_10.png',
	'diamonds_A.png',
	'diamonds_J.png',
	'diamonds_K.png',
	'diamonds_Q.png',
	'empty.png',
	'hearts_02.png',
	'hearts_03.png',
	'hearts_04.png',
	'hearts_05.png',
	'hearts_06.png',
	'hearts_07.png',
	'hearts_08.png',
	'hearts_09.png',
	'hearts_10.png',
	'hearts_A.png',
	'hearts_J.png',
	'hearts_K.png',
	'hearts_Q.png',
	'joker_black.png',
	'joker_red.png',
	'spades_02.png',
	'spades_03.png',
	'spades_04.png',
	'spades_05.png',
	'spades_06.png',
	'spades_07.png',
	'spades_08.png',
	'spades_09.png',
	'spades_10.png',
	'spades_A.png',
	'spades_J.png',
	'spades_K.png',
	'spades_Q.png',
]

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
					<UIcon v-else-if="item.children?.length" :name="expanded ? 'tabler:folder-open' : 'tabler:folder'" class="leading-icon" />
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
