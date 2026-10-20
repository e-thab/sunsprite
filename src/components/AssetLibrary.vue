<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import type { TreeItem } from '@nuxt/ui'
import { useToast } from '@nuxt/ui/composables'
import { useFileStore } from '@/stores/fileStore'
import { useTreeSelectionStore } from '@/stores/treeSelectionStore'
import { exampleScriptNames } from '@/api/examples'
import { attributionLabel, libraryRoot, type LibraryEntry, type LibraryFolder } from '@/api/library'
import { splitFileName, uploadFileTypeForExtension } from '@/utils/fileTypes'
import CollapsiblePane from './CollapsiblePane.vue'

const fileStore = useFileStore()
const treeSelectionStore = useTreeSelectionStore()

const toast = useToast()

// Adds a link to this asset at the project root — no file data is copied (see
// fileStore's library images). A name clash gets a numbered suffix rather than
// a prompt, so this stays a single click.
async function addToProject(path: string, fileName: string) {
	try {
		const name = await fileStore.addLibraryImage(path, fileStore.uniqueImageName(fileName))
		toast.add({
			title: 'Added to project',
			description: name,
			icon: 'tabler:books',
		})
	} catch (err) {
		window.alert(err instanceof Error ? err.message : 'Failed to add file to project')
	}
}

async function copyPath(path: string) {
	await navigator.clipboard.writeText(path)
	toast.add({
		title: 'Copied to clipboard',
		description: path,
		icon: 'tabler:copy-filled',
	})
}

// ---- Sound preview ----
// One shared element, so starting a second sound stops the first — same as
// FileTree.vue's audio preview.
const playingPath = ref<string | null>(null)
let previewAudio: HTMLAudioElement | null = null

function togglePlay(path: string) {
	if (playingPath.value === path) {
		stopPlaying()
		return
	}
	stopPlaying()
	previewAudio = new Audio(path)
	previewAudio.addEventListener('ended', stopPlaying)
	playingPath.value = path
	previewAudio.play().catch(stopPlaying)
}

function stopPlaying() {
	previewAudio?.pause()
	previewAudio = null
	playingPath.value = null
}

onBeforeUnmount(stopPlaying)

// No onSelect needed here — EditorView watches the shared selection store
// (bound below as this tree's own v-model) and opens/closes the preview
// from whatever item ends up selected, image or not.
// Reka UI's TreeItem fires select *and* toggle on every click, folders
// included — without this, clicking a folder to expand/collapse it also
// selects it, recoloring the row via the shared treeSelectionStore v-model
// even though nothing should visually "select" a folder. select and toggle
// are separate custom-event dispatches, so preventDefault here only cancels
// the select half; toggling still works.
function preventFolderSelect(event: Event) {
	event.preventDefault()
}

// Files the editor can't use (no upload type for the extension) are left out
// rather than listed as dead rows.
function entryItem(entry: LibraryEntry): TreeItem | undefined {
	if (entry.kind === 'folder') return folderItem(entry)

	const fileType = uploadFileTypeForExtension(splitFileName(entry.name).extension)
	if (fileType?.kind === 'image') {
		return {
			key: entry.path,
			label: entry.name,
			// Rendered as a real thumbnail in #item-leading below rather than
			// an icon — the path doubles as both the copy-button value and a
			// working <img> src.
			thumbnail: entry.path,
			path: entry.path,
		}
	}
	if (fileType?.kind === 'audio') {
		return {
			key: entry.path,
			label: entry.name,
			icon: fileType.icon,
			sound: true,
			path: entry.path,
		}
	}
	return undefined
}

function folderItem(folder: LibraryFolder): TreeItem {
	return {
		// Keyed by path, not label: names repeat across the Library
		// (planets/planets, ui-cursors/large/arrow_e.png and .../small/...),
		// and UTree's expanded/selected state is matched by key.
		key: folder.path,
		label: folder.name,
		defaultExpanded: false,
		onSelect: preventFolderSelect,
		attribution: folder.attribution,
		children: folder.children.map(entryItem).filter((item) => item !== undefined),
	}
}

const items: TreeItem[] = [
	...libraryRoot.children.map(entryItem).filter((item) => item !== undefined),
	{
		key: 'scripts',
		label: 'scripts',
		defaultExpanded: false,
		onSelect: preventFolderSelect,
		children: exampleScriptNames.map((name) => ({
			key: `scripts/${name}`,
			label: name,
			icon: 'fluent:javascript-24-filled',
			path: name,
		})),
	},
]
</script>

<template>
	<CollapsiblePane label="Library" icon="tabler:photo-filled">
	<div class="panel-wrapper">
		<div class="panel-bar">
			<div class="spacer"></div>
			<div>Library</div>
			<div class="spacer"></div>
		</div>

		<div class="asset-tree">
			<!-- selection-behavior="replace": see the matching UTree in
			FileTree.vue, which shares this same treeSelectionStore v-model —
			without it, re-clicking the already-active item deselects it
			instead of leaving it active. -->
			<UTree
				v-model="treeSelectionStore.current"
				:items="items"
				:get-key="(item: TreeItem) => item.key ?? item.label"
				selection-behavior="replace"
				class="asset-tree"
			>
				<template #item-leading="{ item, expanded }">
					<img v-if="item.thumbnail" :src="item.thumbnail" loading="lazy" class="thumbnail-icon" alt="" />
					<UIcon v-else-if="item.icon" :name="item.icon" class="leading-icon" />
					<UIcon v-else-if="item.children?.length" :name="expanded ? 'tabler:folder-open-filled' : 'tabler:folder-filled'" class="leading-icon" />
				</template>

				<template #item-trailing="{ item }">
					<!-- Credits sit on the folder they cover (normally a whole
					pack) and stay visible, unlike the per-file actions. -->
					<UPopover v-if="item.attribution" :content="{ align: 'end' }">
						<UButton
							icon="tabler:info-circle"
							variant="ghost"
							color="neutral"
							size="xs"
							class="credit-button"
							:aria-label="`Credits: ${attributionLabel(item.attribution)}`"
							@click.stop
						/>

						<template #content>
							<div class="credit-card">
								<div class="credit-title">{{ item.attribution.title ?? item.label }}</div>
								<div>by {{ item.attribution.author }}</div>
								<div v-if="item.attribution.license" class="credit-license">
									License:
									<a v-if="item.attribution.licenseUrl" :href="item.attribution.licenseUrl" target="_blank" rel="noopener">{{ item.attribution.license }}</a>
									<template v-else>{{ item.attribution.license }}</template>
								</div>
								<a v-if="item.attribution.url" :href="item.attribution.url" target="_blank" rel="noopener" class="credit-link">
									<UIcon name="tabler:external-link" />{{ item.attribution.url.replace(/^https?:\/\//, '') }}
								</a>
							</div>
						</template>
					</UPopover>

					<div v-if="!item.children && item.path" class="item-actions">
						<UTooltip v-if="item.sound" :text="playingPath === item.path ? 'Stop' : 'Play'">
							<UButton :icon="playingPath === item.path ? 'tabler:player-stop-filled' : 'tabler:player-play-filled'" variant="soft" color="neutral" size="xs" @click.stop="togglePlay(item.path)" />
						</UTooltip>
						<UTooltip text="Copy path">
							<UButton icon="tabler:copy-filled" variant="soft" color="neutral" size="xs" @click.stop="copyPath(item.path)" />
						</UTooltip>
						<UTooltip v-if="item.thumbnail || item.sound" text="Add to project">
							<UButton icon="tabler:arrow-bar-up" variant="subtle" color="primary" size="xs" @click.stop="addToProject(item.path, item.label ?? '')" />
						</UTooltip>
					</div>
				</template>
			</UTree>
		</div>
	</div>
	</CollapsiblePane>
</template>

<style scoped>
.asset-tree {
	flex: 1 1 auto;
	min-height: 0;
	overflow-y: auto;
	background-color: var(--theme-bg-elevated);
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
	/* background-color: var(--theme-bg-muted); */
	background-color: transparent;
}

.leading-icon {
	width: 1.25rem;
	height: 1.25rem;
	flex-shrink: 0;
}

.credit-button {
	margin-left: auto;
	opacity: 0.5;
}

.credit-button:hover,
.credit-button:focus-visible {
	opacity: 1;
}

.credit-card {
	display: flex;
	flex-direction: column;
	gap: 0.2em;
	padding: 0.6em 0.75em;
	max-width: 18rem;
	font-size: 0.85em;
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
