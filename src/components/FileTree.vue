<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TreeItem } from '@nuxt/ui'
import { useFileStore, type TreeNode } from '@/stores/fileStore'
import { useTreeSelectionStore } from '@/stores/treeSelectionStore'
import { imagePath, animalFiles, cardFiles } from '@/assets/api/gameAssets'

const fileStore = useFileStore()
const treeSelectionStore = useTreeSelectionStore()

const emit = defineEmits<{
	selectScript: [fileName: string]
}>()

// No onSelect needed here — EditorView watches the shared selection store
// (bound below as this tree's own v-model) and opens/closes the preview
// from whatever item ends up selected, image or not.
function imageLeaf(category: string, fileName: string): TreeItem {
	const path = imagePath(category, fileName)
	return {
		label: fileName,
		thumbnail: path,
		path,
	}
}

// Reads the script name from the item's own data rather than the clicked
// element's rendered text — the label slot appends a "*" for unsaved
// files, which would otherwise get emitted as part of the file name. The
// template invokes this with (event, item) even though TreeItem.onSelect's
// declared type only requires the event, so item is typed optional here.
function selectHandler(_event: any, item?: TreeItem) {
	if (item?.label) emit('selectScript', item.label)
}

// https://icones.js.org/collection/tabler
// https://icones.js.org/collection/catppuccin

// icon: 'catppuccin:image'
// icon: 'catppuccin:svg'

const guestItems: TreeItem[] = [
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
		]
	},

	// {
	//   label: 'Sounds',
	//   defaultExpanded: true,
	//   children: [
	//     {
	//       label: 'sound.wav',
	//       icon: 'catppuccin:audio'
	//     },
	//   ]
	// },

	{
		label: 'scripts',
		defaultExpanded: true,
		children: [
			// {
			//   label: 'main.ts',
			//   icon: 'catppuccin:typescript'
			// },
			{
				label: 'examples',
				defaultExpanded: true,
				children: [
					{
						label: 'input.js',
						icon: 'catppuccin:javascript',
						onSelect: () => emit('selectScript', 'input.js'),
					}
					// {
					//   label: 'labels.js',
					//   icon: 'catppuccin:javascript',
					//   onSelect: (event) => {
					//     if (event.target) emit('selectScript', (event.target as HTMLElement).innerText)
					//   }
					// },
					// {
					//   label: 'lines.js',
					//   icon: 'catppuccin:javascript',
					//   onSelect: (event) => {
					//     if (event.target) emit('selectScript', (event.target as HTMLElement).innerText)
					//   }
					// },
					// {
					//   label: 'rectangles.js',
					//   icon: 'catppuccin:javascript',
					//   onSelect: (event) => {
					//     if (event.target) emit('selectScript', (event.target as HTMLElement).innerText)
					//   }
					// },
					// {
					//   label: 'rectSpiral.js',
					//   icon: 'catppuccin:javascript',
					//   onSelect: (event) => {
					//     if (event.target) emit('selectScript', (event.target as HTMLElement).innerText)
					//   }
					// },
					// {
					//   label: 'sprites.js',
					//   icon: 'catppuccin:javascript',
					//   onSelect: (event) => {
					//     if (event.target) emit('selectScript', (event.target as HTMLElement).innerText)
					//   }
					// },
				]
			},

			{
				label: 'temp.js',
				icon: 'catppuccin:javascript',
				onSelect: () => emit('selectScript', 'temp.js'),
			},

			{
				label: 'main.js',
				icon: 'catppuccin:javascript',
				onSelect: () => emit('selectScript', 'main.js'),
			},
		]
	},
	// {
	//   label: 'app/',
	//   defaultExpanded: true,
	//   children: [
	//     {
	//       label: 'composables/',
	//       children: [
	//         {
	//           label: 'useAuth.js',
	//           icon: 'catppuccin:javascript'
	//         },
	//         {
	//           label: 'useUser.ts',
	//           icon: 'catppuccin:typescript'
	//         }
	//       ]
	//     },
	//     {
	//       label: 'components/',
	//       defaultExpanded: false,
	//       children: [
	//         {
	//           label: 'Card.vue',
	//           icon: 'catppuccin:vue'
	//         },
	//         {
	//           label: 'Button.vue',
	//           icon: 'catppuccin:vue'
	//         }
	//       ]
	//     },
	//   ]
	// },
	// {
	//   label: 'app.vue',
	//   icon: 'catppuccin:vue'
	// },
	// {
	//   label: 'nuxt.config.ts',
	//   icon: 'catppuccin:nuxt'
	// },
]

// ---- Project mode: real folders + scripts ----
// Splices the drop-placeholder row into a folder's (or the root's) real
// children when a drag is currently hovering a target inside it — see the
// drag-and-drop section below for how `dropTarget` gets computed.
function withDropPlaceholder(realChildren: TreeItem[], folderId: string | null): TreeItem[] {
	if (!dropTarget.value || dropTarget.value.folderId !== folderId) return realChildren
	const index = Math.min(dropTarget.value.index, realChildren.length)
	const placeholder: TreeItem = { label: `__drop-placeholder__${folderId ?? 'root'}`, slot: 'drop-placeholder' }
	return [...realChildren.slice(0, index), placeholder, ...realChildren.slice(index)]
}

function buildNode(node: TreeNode, parentId: string | null): TreeItem {
	if (node.kind === 'folder') {
		const realChildren = fileStore.childNodes(node.id).map((child) => buildNode(child, node.id))
		return {
			label: node.name,
			kind: 'folder',
			id: node.id,
			parentId,
			defaultExpanded: true,
			children: withDropPlaceholder(realChildren, node.id),
		}
	}
	return {
		label: node.name,
		kind: 'script',
		id: node.id,
		parentId,
		icon: 'catppuccin:javascript',
		onSelect: selectHandler,
	}
}

const items = computed<TreeItem[]>(() => {
	if (!fileStore.projectId) return guestItems

	const realRootChildren = fileStore.childNodes(null).map((node) => buildNode(node, null))
	return withDropPlaceholder(realRootChildren, null)
})

function scriptName(item: TreeItem): string {
	return item.label ?? ''
}

// ---- Create ----

async function addScript(folderId: string | null) {
	const name = window.prompt('New script name (e.g. game.js):')
	if (!name) return

	if (fileStore.scripts.some((script) => script.name === name)) {
		window.alert('A script with that name already exists.')
		return
	}

	await fileStore.createScript(name, '', folderId)
}

async function addFolder(parentId: string | null) {
	const name = window.prompt('New folder name:')
	if (!name) return

	const hasNameCollision = fileStore.childNodes(parentId).some((node) => node.kind === 'folder' && node.name === name)
	if (hasNameCollision) {
		window.alert('A folder with that name already exists here.')
		return
	}

	await fileStore.createFolder(name, parentId)
}

function uploadFile() {
	window.alert("File upload is coming soon — there's no storage backend set up yet.")
}

// Dropdown shown behind the "+" trailing button on folder rows, and behind
// the header's own "+" for the project root — folderId is null for root.
function folderMenuItems(folderId: string | null) {
	return [
		{ label: 'New script', icon: 'tabler:script-plus', onSelect: () => addScript(folderId) },
		{ label: 'Upload file', icon: 'tabler:upload', onSelect: () => uploadFile() },
		{ label: 'New folder', icon: 'tabler:folder-plus', onSelect: () => addFolder(folderId) },
	]
}

// ---- Rename ----

async function renameScript(current: string) {
	const name = window.prompt('Rename script:', current)
	if (!name || name === current) return

	if (fileStore.scripts.some((script) => script.name === name)) {
		window.alert('A script with that name already exists.')
		return
	}

	await fileStore.renameScript(current, name)
}

async function renameFolder(id: string, currentName: string, parentId: string | null) {
	const name = window.prompt('Rename folder:', currentName)
	if (!name || name === currentName) return

	const hasNameCollision = fileStore.childNodes(parentId).some((node) => node.kind === 'folder' && node.id !== id && node.name === name)
	if (hasNameCollision) {
		window.alert('A folder with that name already exists here.')
		return
	}

	await fileStore.renameFolder(id, name)
}

function renameItem(item: TreeItem) {
	if (item.kind === 'folder') return renameFolder(item.id, scriptName(item), item.parentId ?? null)
	return renameScript(scriptName(item))
}

// ---- Delete ----

async function deleteScript(name: string) {
	if (fileStore.scripts.length <= 1) {
		window.alert("Can't delete the last script in a project.")
		return
	}
	if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return

	const wasActive = fileStore.activeFileName === name
	await fileStore.deleteScript(name)

	if (wasActive) {
		const next = fileStore.scripts[0]?.name
		if (next) emit('selectScript', next)
	}
}

async function deleteFolder(id: string, name: string) {
	const scriptsInside = fileStore.scriptsUnderFolder(id)
	if (fileStore.scripts.length - scriptsInside.length <= 0) {
		window.alert("Can't delete the last script in a project.")
		return
	}

	const message = scriptsInside.length > 0
		? `Delete "${name}" and its ${scriptsInside.length} script${scriptsInside.length === 1 ? '' : 's'}? This can't be undone.`
		: `Delete "${name}"? This can't be undone.`
	if (!window.confirm(message)) return

	const activeWasInside = scriptsInside.some((s) => s.name === fileStore.activeFileName)
	await fileStore.deleteFolder(id)

	if (activeWasInside) {
		const next = fileStore.scripts[0]?.name
		if (next) emit('selectScript', next)
	}
}

function deleteItem(item: TreeItem) {
	if (item.kind === 'folder') return deleteFolder(item.id, scriptName(item))
	return deleteScript(scriptName(item))
}

// ---- Drag and drop ----
//
// Native HTML5 DnD rather than a tree-DnD library — the drag handle/drop
// target is a div rendered into the item-label slot (the one bit of each
// row's markup this component fully controls; Nuxt UI's Tree renders the
// rest of the row itself), absolutely positioned to cover the whole row
// rather than just the label text, so hovering/dropping anywhere on the
// item works, not only directly over its name. Dropping on a folder reparents into it
// (appended at the end); dropping on a script makes the dragged item that
// script's sibling, inserted just before it; dropping on the tree's own
// background (nothing more specific claimed the event) sends it to the
// project root. Guest-mode rows never set `.kind`, so `draggable` is false
// for them and none of this activates outside project mode.
//
// `dropTarget` mirrors whichever of those three outcomes is currently
// hovered as a { folderId, index } pair — withDropPlaceholder (above)
// splices an actual placeholder row into that folder's/root's rendered
// children at that index, so the projected drop location reads as a real,
// highlighted empty slot rather than just a highlighted existing row.

type DraggedNode = { id: string, kind: 'folder' | 'script' }
type DropTarget = { folderId: string | null, index: number }

const draggedNode = ref<DraggedNode | null>(null)
const dragOverId = ref<string | null>(null)
const dropTarget = ref<DropTarget | null>(null)

function isDraggable(item: TreeItem): boolean {
	return item.kind === 'folder' || item.kind === 'script'
}

function onDragStart(event: DragEvent, item: TreeItem) {
	if (!isDraggable(item)) return
	draggedNode.value = { id: item.id, kind: item.kind }
	event.dataTransfer?.setData('text/plain', item.label ?? '')
	if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() {
	draggedNode.value = null
	dragOverId.value = null
	dropTarget.value = null
}

function canDropOn(item: TreeItem): boolean {
	if (!draggedNode.value || !isDraggable(item)) return false
	// Refuse dropping a folder onto itself — moveFolder also guards against
	// dropping into one of its own descendants, since that's only knowable
	// by walking the tree the store already owns.
	return !(draggedNode.value.kind === 'folder' && draggedNode.value.id === item.id)
}

function onDragOverItem(item: TreeItem) {
	if (!canDropOn(item)) return
	dragOverId.value = item.id

	if (item.kind === 'folder') {
		dropTarget.value = { folderId: item.id, index: fileStore.childNodes(item.id).length }
		return
	}

	const parentId: string | null = item.parentId ?? null
	const siblings = fileStore.childNodes(parentId)
	const index = siblings.findIndex((n) => n.id === item.id)
	dropTarget.value = { folderId: parentId, index: index >= 0 ? index : siblings.length }
}

function onDragLeaveItem(item: TreeItem) {
	if (dragOverId.value !== item.id) return
	dragOverId.value = null
	dropTarget.value = null
}

function onDragOverRoot() {
	dropTarget.value = { folderId: null, index: fileStore.childNodes(null).length }
}

function onDragLeaveRoot() {
	if (dropTarget.value?.folderId === null) dropTarget.value = null
}

async function onDropOnItem(item: TreeItem) {
	const dragged = draggedNode.value
	const droppable = canDropOn(item)
	dragOverId.value = null
	draggedNode.value = null
	dropTarget.value = null
	if (!dragged || !droppable) return

	if (item.kind === 'folder') {
		const position = fileStore.nextPosition(item.id)
		if (dragged.kind === 'folder') await fileStore.moveFolder(dragged.id, item.id, position)
		else await fileStore.moveScript(dragged.id, item.id, position)
		return
	}

	// Dropped on a script row: become its sibling, inserted just before it.
	const targetParentId: string | null = item.parentId ?? null
	const siblings = fileStore.childNodes(targetParentId)
	const targetIndex = siblings.findIndex((n) => n.id === item.id)
	const target = siblings[targetIndex]
	if (!target) return
	const before = targetIndex > 0 ? siblings[targetIndex - 1] : undefined
	const position = before ? (before.position + target.position) / 2 : target.position - 1

	if (dragged.kind === 'folder') await fileStore.moveFolder(dragged.id, targetParentId, position)
	else await fileStore.moveScript(dragged.id, targetParentId, position)
}

async function onDropOnRoot() {
	const dragged = draggedNode.value
	draggedNode.value = null
	dragOverId.value = null
	dropTarget.value = null
	if (!dragged) return

	const position = fileStore.nextPosition(null)
	if (dragged.kind === 'folder') await fileStore.moveFolder(dragged.id, null, position)
	else await fileStore.moveScript(dragged.id, null, position)
}
</script>

<template>
	<div class="panel-wrapper">
		<div class="panel-bar">
			<div class="spacer"></div>

			<div>Files</div>

			<UDropdownMenu v-if="fileStore.projectId" :items="folderMenuItems(null)" style="flex: 0 1 auto;">
				<UTooltip text="Add..." ignore-non-keyboard-focus>
					<UButton icon="tabler:plus" variant="ghost" color="neutral" size="xs" />
				</UTooltip>
			</UDropdownMenu>
			<div v-else class="spacer"></div>
		</div>

		<div class="file-tree" @dragover.prevent="onDragOverRoot" @dragleave="onDragLeaveRoot" @drop="onDropOnRoot">
			<UTree v-model="treeSelectionStore.current" :items="items" class="file-tree">
				<template #item-leading="{ item, expanded }">
					<img v-if="item.thumbnail" :src="item.thumbnail" class="thumbnail-icon" alt="" />
					<UIcon v-else-if="item.icon" :name="item.icon" class="leading-icon" />
					<UIcon v-else-if="item.kind === 'folder' || item.children?.length" :name="expanded ? 'tabler:folder-open-filled' : 'tabler:folder-filled'" class="leading-icon" />
				</template>

				<template #item-label="{ item }">
					<div
						class="tree-row-dnd"
						:class="{ 'drag-over': dragOverId === item.id }"
						:draggable="isDraggable(item)"
						@dragstart="onDragStart($event, item)"
						@dragend="onDragEnd"
						@dragover.prevent.stop="onDragOverItem(item)"
						@dragleave="onDragLeaveItem(item)"
						@drop.stop="onDropOnItem(item)"
					></div>
					{{ item.label }}<span v-if="fileStore.isDirty(scriptName(item))" class="dirty-marker">*</span>
				</template>

				<template v-if="fileStore.projectId" #item-trailing="{ item }">
					<div class="item-actions">
						<UDropdownMenu v-if="item.kind === 'folder'" :items="folderMenuItems(item.id)">
							<UTooltip text="Add..." ignore-non-keyboard-focus>
								<UButton icon="tabler:plus" variant="ghost" color="neutral" size="xs" @click.stop />
							</UTooltip>
						</UDropdownMenu>

						<UTooltip :text="item.kind === 'folder' ? 'Rename folder' : 'Rename script'">
							<UButton icon="tabler:pencil-filled" variant="ghost" color="neutral" size="xs" @click.stop="renameItem(item)" />
						</UTooltip>

						<UTooltip :text="item.kind === 'folder' ? 'Delete folder' : 'Delete script'">
							<UButton icon="tabler:trash-filled" variant="ghost" color="error" size="xs" @click.stop="deleteItem(item)" />
						</UTooltip>
					</div>
				</template>

				<template #drop-placeholder>
					<div class="drop-placeholder"></div>
				</template>
			</UTree>
		</div>
	</div>
</template>

<style scoped>
.file-tree {
	flex: 1 1 auto;
	min-height: 0;
	overflow-y: auto;
	background-color: var(--theme-bg-neutral);
}

.spacer {
	width: 1.5em;
	flex: 0 1 auto;
}

.dirty-marker {
	color: var(--theme-warning);
	margin-left: 0.15em;
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

/* Absolutely positioned against the tree-item link's own `position:
   relative` (same anchor `.item-actions` below uses) rather than sized to
   the label text, so the drag handle/drop target covers the whole row —
   icon, whitespace, and trailing-button area included — not just wherever
   the label happens to be. The label text itself renders as a plain
   sibling in this slot; Nuxt UI's own linkLabel span already truncates it. */
.tree-row-dnd {
	position: absolute;
	inset: 0;
	border-radius: 0.25rem;
}

.tree-row-dnd.drag-over {
	outline: 2px solid var(--theme-accent, var(--theme-scroll-light));
	outline-offset: -1px;
	background-color: var(--theme-bg-light);
}

.drop-placeholder {
	width: 100%;
	height: 1.25rem;
	border-radius: 0.25rem;
	border: 1.5px dashed var(--theme-scroll-light);
	background-color: var(--theme-bg-light);
	pointer-events: none;
}

/* Nuxt UI's tree-item link is `position: relative`, which is what these
   coordinates anchor to — taking the actions out of flow (rather than
   relying on the trailing slot's own flex/margin-auto behavior) also frees
   the label to use the row's full width instead of sharing it, so the
   filename doesn't truncate just because these buttons exist. */
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
