<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { TreeItem } from '@nuxt/ui'
import { useToast } from '@nuxt/ui/composables'
import { useFileStore } from '@/stores/fileStore'
import { selectModifier, useTreeSelectionStore } from '@/stores/treeSelectionStore'
import { setCountDragImage } from '@/utils/dragImage'
import { exampleScriptNames } from '@/api/examples'
import { attributionLabel, libraryRoot, type LibraryEntry, type LibraryFolder } from '@/api/library'
import { LIBRARY_DRAG_MIME, splitFileName, uploadFileTypeForExtension } from '@/utils/fileTypes'
import { audioDuration, formatDuration } from '@/utils/audioDuration'
import CollapsiblePane from './CollapsiblePane.vue'
import LibraryCredit from './LibraryCredit.vue'

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

// ---- Drag into the project ----
// An image or sound row can be dragged onto the file tree, which adds a link
// to it in whichever folder it lands in (see FileTree.vue's onDropOnTree) —
// the same link the "Add to project" button makes at the root. Dragging one
// that's part of a multi-selection takes every selected asset along.

function isAddable(item: TreeItem): boolean {
	return !item.children && !!item.path && (!!item.thumbnail || !!item.sound)
}

// ---- Multi-selection ----
// Kept in treeSelectionStore, shared with the file tree so that only one tree
// ever has a multi-selection — see the notes there. Only addable rows take
// part, since dragging is all a multi-selection here is for: a Shift or
// Ctrl/Cmd click on an example script is just a plain select.

// Controlled (rather than each folder's defaultExpanded) only so a range can
// tell which rows are actually showing.
const expandedKeys = ref<string[]>([])

// Addable rows in the order they're shown, skipping the contents of closed
// folders — what a Shift-click's range runs over.
function visibleAssetKeys(): string[] {
	const keys: string[] = []
	const add = (list: TreeItem[]) => {
		for (const item of list) {
			if (item.children) {
				if (expandedKeys.value.includes(item.key)) add(item.children)
			} else if (isAddable(item)) {
				keys.push(item.key)
			}
		}
	}
	add(items)
	return keys
}

// A plain click is left to Reka (which replaces treeSelectionStore.current,
// opening an image's preview); a modifier click only changes the selection.
function onAssetSelect(event: CustomEvent<{ originalEvent?: Event }>, item?: TreeItem) {
	if (!item) return
	const modifier = selectModifier(event)
	if (!modifier) return
	event.preventDefault()
	if (modifier === 'range') treeSelectionStore.selectRange('library', item.key, visibleAssetKeys())
	else treeSelectionStore.toggle('library', item.key)
}

// `current` included — the store always puts it in the selection.
function isInSelection(item: TreeItem): boolean {
	return treeSelectionStore.isSelected('library', item.key)
}

// The Library image EditorView is previewing, if any — it opens one for any
// selection with a thumbnail (see its watcher on treeSelectionStore.current).
// Highlighted apart from the plain selection, same as FileTree.vue's
// viewedId; a selected sound or example script opens nothing, so gets only
// the neutral fill. Matched by key: a file tree row never has one.
const viewedKey = computed<string | null>(() => {
	const current = treeSelectionStore.current
	return current?.thumbnail && current.path ? current.key ?? null : null
})

// A selected row's key is its path (see entryItem), so the selection can go
// straight into the drag — one path per line.
function onDragStart(event: DragEvent, item: TreeItem) {
	if (!event.dataTransfer) return
	const selected = isInSelection(item) ? treeSelectionStore.selectedKeys('library') : []
	const paths: string[] = selected.length > 1 ? selected : [item.path]
	event.dataTransfer.setData(LIBRARY_DRAG_MIME, paths.join('\n'))
	event.dataTransfer.effectAllowed = 'copy'
	if (paths.length > 1) setCountDragImage(event.dataTransfer, paths.length)
}

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
			onSelect: onAssetSelect,
		}
	}
	if (fileType?.kind === 'audio') {
		return {
			key: entry.path,
			label: entry.name,
			icon: fileType.icon,
			sound: true,
			path: entry.path,
			onSelect: onAssetSelect,
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
				v-model:expanded="expandedKeys"
				class="asset-tree"
			>
				<template #item-leading="{ item, expanded }">
					<img v-if="item.thumbnail" :src="item.thumbnail" loading="lazy" class="thumbnail-icon" alt="" />
					<UIcon v-else-if="item.icon" :name="item.icon" class="leading-icon" />
					<UIcon v-else-if="item.children?.length" :name="expanded ? 'tabler:folder-open-filled' : 'tabler:folder-filled'" class="leading-icon" />
				</template>

				<template #item-label="{ item }">
					<!-- Same whole-row drag handle as FileTree.vue's .tree-row-dnd,
					     covering the thumbnail too (which would otherwise start
					     the browser's own image drag). Only on rows that can be
					     added — a folder's credit button must stay clickable. -->
					<div
						v-if="isAddable(item)"
						class="library-row-dnd"
						:class="{ 'in-selection': isInSelection(item), viewing: viewedKey === item.key }"
						draggable="true"
						@dragstart="onDragStart($event, item)"
					></div>
					{{ item.label }}
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
							<LibraryCredit :attribution="item.attribution" :fallback-title="item.label" />
						</template>
					</UPopover>

					<span v-if="item.sound && audioDuration(item.path) !== undefined" class="item-duration">{{ formatDuration(audioDuration(item.path)!) }}</span>

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

/* Lines top-level rows' fills up with nested ones', and keeps every fill the
   same gap short of the right edge — see the matching rule in FileTree.vue. */
.asset-tree :deep(.asset-tree[data-slot="root"]) {
	padding-inline: calc(0.375rem - 1px);
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

/* Positioned against the row's link (Nuxt UI makes it `relative`), same as
   FileTree.vue's .tree-row-dnd. .item-actions below comes later in the row
   and is positioned too, so it still paints — and takes clicks — on top. */
.library-row-dnd {
	position: absolute;
	inset: 0;
}

/* Row highlights, matching FileTree.vue's: a neutral fill for selected rows,
   and a theme-colored one for the image open in the center panel
   (viewedKey), which wins when a row is both. Both classes ride on
   .library-row-dnd, which every row that can be multi-selected or previewed
   has; [data-selected] covers Reka's own selection, which can also be an
   example script. Drawn on the ::before Nuxt UI paints its own selected fill
   on, which matches this tree's background and so never shows. Selection
   doesn't recolor the name. */
.asset-tree :deep([data-slot="link"][data-selected])::before,
.asset-tree :deep([data-slot="link"]:has(.library-row-dnd.in-selection))::before {
	background-color: var(--theme-bg-accented);
}

.asset-tree :deep([data-slot="link"]:has(.library-row-dnd.viewing))::before {
	background-color: color-mix(in srgb, var(--theme-primary) 25%, transparent);
}

.asset-tree :deep([data-slot="link"][data-selected]) {
	color: inherit;
}

.asset-tree :deep([data-slot="link"][data-selected]:hover) {
	color: var(--ui-text-highlighted);
}

.item-duration {
	flex-shrink: 0;
	font-size: 0.75em;
	font-variant-numeric: tabular-nums;
	color: var(--theme-text-toned);
	white-space: nowrap;
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
