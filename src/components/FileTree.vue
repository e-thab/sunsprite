<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type { DropdownMenuItem, TreeItem } from '@nuxt/ui'
import { useToast } from '@nuxt/ui/composables'
import { useFileStore, type TreeNode } from '@/stores/fileStore'
import { useTreeSelectionStore } from '@/stores/treeSelectionStore'
import { imagePath, animalFiles, cardFiles } from '@/assets/api/gameAssets'
import {
	ALLOWED_IMAGE_CONTENT_TYPES,
	DEFAULT_SCRIPT_FILE_TYPE,
	DEFAULT_TEXT_FILE_TYPE,
	IMAGE_ACCEPT_ATTR,
	imageDisplayName,
	imageFileTypeForExtension,
	joinFileName,
	scriptFileType,
	splitFileName,
} from '@/assets/utils/fileTypes'

const fileStore = useFileStore()
const treeSelectionStore = useTreeSelectionStore()
const toast = useToast()

async function copyImageUrl(path: string) {
	await navigator.clipboard.writeText(path)
	toast.add({
		title: 'Copied to clipboard',
		description: path,
		icon: 'tabler:copy-filled',
	})
}

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

// Reka UI's TreeItem fires select *and* toggle on every click, folders
// included — without this, clicking a folder to expand/collapse it also
// selects it, which recolors the row via the shared treeSelectionStore
// v-model even though nothing should visually "select" a folder. select and
// toggle are separate custom-event dispatches, so preventDefault here only
// cancels the select half; toggling still works.
function preventFolderSelect(event: Event) {
	event.preventDefault()
}

// https://icones.js.org/collection/tabler
// https://icones.js.org/collection/catppuccin

const guestItems: TreeItem[] = [
	// {
	// 	label: 'images',
	// 	defaultExpanded: false,
	// 	children: [
	// 		{
	// 			label: 'animals',
	// 			defaultExpanded: false,
	// 			children: animalFiles.map((f) => imageLeaf('animals', f)),
	// 		},
	// 		{
	// 			label: 'cards',
	// 			defaultExpanded: false,
	// 			children: cardFiles.map((f) => imageLeaf('cards', f)),
	// 		},
	// 	]
	// },

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
		onSelect: preventFolderSelect,
		children: [
			// {
			//   label: 'main.ts',
			//   icon: 'catppuccin:typescript'
			// },
			// {
			// 	label: 'examples',
			// 	defaultExpanded: true,
			// 	children: [
			// 		{
			// 			label: 'input.js',
			// 			icon: 'catppuccin:javascript',
			// 			onSelect: () => emit('selectScript', 'input.js'),
			// 		}
			// 		{
			// 		  label: 'labels.js',
			// 		  icon: 'catppuccin:javascript',
			// 		  onSelect: (event) => {
			// 		    if (event.target) emit('selectScript', (event.target as HTMLElement).innerText)
			// 		  }
			// 		},
			// 		{
			// 		  label: 'lines.js',
			// 		  icon: 'catppuccin:javascript',
			// 		  onSelect: (event) => {
			// 		    if (event.target) emit('selectScript', (event.target as HTMLElement).innerText)
			// 		  }
			// 		},
			// 		{
			// 		  label: 'rectangles.js',
			// 		  icon: 'catppuccin:javascript',
			// 		  onSelect: (event) => {
			// 		    if (event.target) emit('selectScript', (event.target as HTMLElement).innerText)
			// 		  }
			// 		},
			// 		{
			// 		  label: 'rectSpiral.js',
			// 		  icon: 'catppuccin:javascript',
			// 		  onSelect: (event) => {
			// 		    if (event.target) emit('selectScript', (event.target as HTMLElement).innerText)
			// 		  }
			// 		},
			// 		{
			// 		  label: 'sprites.js',
			// 		  icon: 'catppuccin:javascript',
			// 		  onSelect: (event) => {
			// 		    if (event.target) emit('selectScript', (event.target as HTMLElement).innerText)
			// 		  }
			// 		},
			// 	]
			// },

			// {
			// 	label: 'temp.js',
			// 	icon: 'catppuccin:javascript',
			// 	onSelect: () => emit('selectScript', 'temp.js'),
			// },

			{
				label: 'main.js',
				icon: 'fluent:javascript-24-filled',
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

// Hovering a folder's own header means "drop inside, at the end" (the only
// shape onDragOverItem's folder branch ever produces — index always equals
// the current child count). Splicing a placeholder into *that* folder's
// children is safe from the reflow-flicker loop line-indicators elsewhere
// avoid: the folder header row a script's placeholder would've shifted
// away from the cursor isn't in this array at all, just its contents are —
// so the header never moves. A script row within the folder being hovered
// instead (to reorder before/after it) produces index < children.length,
// which is left alone here and shown via the line-indicator (dropLineTarget)
// instead, same as any other sibling-reorder.
function withFolderDropPlaceholder(realChildren: TreeItem[], folderId: string): TreeItem[] {
	if (!dropTarget.value || dropTarget.value.folderId !== folderId) return realChildren
	if (dropTarget.value.index !== realChildren.length) return realChildren
	const placeholder: TreeItem = { label: `__drop-placeholder__${folderId}`, slot: 'drop-placeholder' }
	return [...realChildren, placeholder]
}

// Nuxt UI's `defaultExpanded` per item only seeds Reka's *initial*,
// uncontrolled expand state once at mount — a folder created afterward
// (during this session, after that one seeding pass already ran) never
// gets added to it and stays permanently collapsed regardless of the field,
// which silently hid the placeholder above for exactly the folders someone
// would actually be testing drag-and-drop into. Switching to the
// *controlled* `expanded` prop (bound below) fixes that generally, and
// additionally lets a hover force a specific folder open on demand.
const expandedFolderIds = ref<string[]>([])
const seededFolderIds = new Set<string>()

watch(() => fileStore.folders.map((f) => f.id), (ids) => {
	const additions = ids.filter((id) => !seededFolderIds.has(id))
	if (additions.length === 0) return
	for (const id of additions) seededFolderIds.add(id)
	expandedFolderIds.value = [...expandedFolderIds.value, ...additions]
}, { immediate: true })

function ensureFolderExpanded(folderId: string) {
	if (expandedFolderIds.value.includes(folderId)) return
	expandedFolderIds.value = [...expandedFolderIds.value, folderId]
}

// Guest mode's tree is static and still leans on the guestItems' own
// per-item `defaultExpanded` (uncontrolled) — switching it over to a
// controlled `expanded` array too would need its own seeding logic for no
// real benefit, since none of it ever changes after mount anyway. Passing
// `undefined` for the prop is the same as not binding it at all, so this
// only takes over in project mode, leaving guest mode exactly as before.
const controlledExpandedIds = computed(() => fileStore.projectId ? expandedFolderIds.value : undefined)

function onUpdateExpanded(ids: string[]) {
	if (fileStore.projectId) expandedFolderIds.value = ids
}

function buildNode(node: TreeNode, parentId: string | null): TreeItem {
	if (node.kind === 'folder') {
		return {
			label: node.name,
			kind: 'folder',
			id: node.id,
			parentId,
			onSelect: preventFolderSelect,
			children: withFolderDropPlaceholder(fileStore.childNodes(node.id).map((child) => buildNode(child, node.id)), node.id),
		}
	}
	if (node.kind === 'image') {
		return {
			label: node.name,
			kind: 'image',
			id: node.id,
			parentId,
			thumbnail: node.publicUrl,
			path: node.publicUrl,
			typeLabel: imageFileTypeForExtension(splitFileName(node.name).extension)?.label,
		}
	}
	if (node.kind === 'text') {
		return {
			label: node.name,
			kind: 'text',
			id: node.id,
			parentId,
			icon: DEFAULT_TEXT_FILE_TYPE.icon,
			typeLabel: DEFAULT_TEXT_FILE_TYPE.label,
			// Opens the same way a script does — same Monaco pane, just a
			// plaintext model with no language worker (see CodeEditor.vue).
			onSelect: selectHandler,
		}
	}
	const fileType = scriptFileType(splitFileName(node.name).extension)
	return {
		label: node.name,
		kind: 'script',
		id: node.id,
		parentId,
		icon: fileType.icon,
		typeLabel: fileType.label,
		onSelect: selectHandler,
	}
}

const items = computed<TreeItem[]>(() => {
	return fileStore.projectId ? fileStore.childNodes(null).map(
		(node) => buildNode(node, null)
	) : guestItems
})

// A dropped-into row shifting position because a placeholder row got
// spliced in right next to it — the previous approach — moves the row out
// from under the cursor, which fires a native dragleave, clears the
// target, snaps the row back, re-triggers dragover... an infinite flicker
// loop. This never inserts anything into the list at all: it just derives
// which existing row (if any) should show a drop-line indicator, so the
// layout can never shift under the pointer. `index < siblings.length`
// means "insert before that sibling" (line on its top edge); reaching the
// end of the list means "insert after the last one" (line on its bottom
// edge) instead, since there's no next sibling to draw a top edge on.
const dropLineTarget = computed(() => {
	if (!dropTarget.value) return null
	const { folderId, index } = dropTarget.value
	const siblings = fileStore.childNodes(folderId)
	if (siblings.length === 0) return null
	if (index < siblings.length) return { beforeId: siblings[index]!.id, afterId: null }
	// Reaching the end of a folder's children is hovering that folder's own
	// header (see withFolderDropPlaceholder) — shown via the nested
	// placeholder instead, not a line, so don't show both. The root has no
	// header row of its own to nest a placeholder under, so it still gets
	// an after-line on its last item.
	if (folderId !== null) return null
	return { beforeId: null, afterId: siblings[siblings.length - 1]!.id }
})

function scriptName(item: TreeItem): string {
	return item.label ?? ''
}

// Scripts, images, and text files carry an extension as part of their name;
// folders don't. Used both to render the fixed suffix next to the rename
// input and to keep it out of renamingValue so it can never be typed over.
function fileExtension(item: TreeItem): string {
	return splitFileName(scriptName(item)).extension
}

// Human label for the rename/delete tooltips below — a plain if-chain reads
// better here than a 4-way ternary once 'text' joins 'folder'/'image'/'script'.
function kindLabel(item: TreeItem): string {
	if (item.kind === 'folder') return 'folder'
	if (item.kind === 'image') return 'image'
	if (item.kind === 'text') return 'text file'
	return 'script'
}

// ---- Create ----

async function addScript(folderId: string | null) {
	const input = window.prompt(`New script name ("${joinFileName('', DEFAULT_SCRIPT_FILE_TYPE.extension)}" is added automatically):`)
	if (!input) return

	// Whatever's typed becomes the base name, full stop — mirrors the rename
	// input, which never lets the extension itself be edited either.
	const base = splitFileName(input.trim()).base
	if (!base) return
	const name = joinFileName(base, DEFAULT_SCRIPT_FILE_TYPE.extension)

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

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB

function uploadFile(folderId: string | null) {
	const input = document.createElement('input')
	input.type = 'file'
	input.accept = IMAGE_ACCEPT_ATTR
	input.onchange = async () => {
		const file = input.files?.[0]
		if (!file) return

		if (!ALLOWED_IMAGE_CONTENT_TYPES.has(file.type)) {
			window.alert('Only PNG, JPG, SVG, and WebP images are supported.')
			return
		}
		if (file.size > MAX_IMAGE_SIZE) {
			window.alert('That file is too large — images must be 10MB or smaller.')
			return
		}
		// The name it'll actually be stored under — its recognized type's
		// canonical extension, not necessarily whatever this source file was
		// called (see imageDisplayName) — is what has to be unique, not file.name.
		if (fileStore.images.some((img) => img.name === imageDisplayName(file))) {
			window.alert('A file with that name already exists in this project.')
			return
		}

		try {
			await fileStore.uploadImage(file, folderId)
		} catch (err) {
			window.alert(err instanceof Error ? err.message : 'Failed to upload image')
		}
	}
	input.click()
}

// Blank creation, same shape as addScript — not upload-based: there's no
// file picker here, just a name prompt and an empty new row.
async function addTextFile(folderId: string | null) {
	const input = window.prompt(`New text file name ("${joinFileName('', DEFAULT_TEXT_FILE_TYPE.extension)}" is added automatically):`)
	if (!input) return

	const base = splitFileName(input.trim()).base
	if (!base) return
	const name = joinFileName(base, DEFAULT_TEXT_FILE_TYPE.extension)

	if (fileStore.textFiles.some((f) => f.name === name)) {
		window.alert('A file with that name already exists in this project.')
		return
	}

	await fileStore.createTextFile(name, '', folderId)
}

// Dropdown shown behind the header's own "+" for the project root — folderId
// is null for root. Also folded into itemMenuItems below for folder rows,
// rather than getting its own separate trigger button on those rows.
function folderMenuItems(folderId: string | null) {
	return [
		{ label: 'New script', icon: 'tabler:script-plus', onSelect: () => addScript(folderId) },
		{ label: 'New text file', icon: 'tabler:file-plus', onSelect: () => addTextFile(folderId) },
		{ label: 'New folder', icon: 'tabler:folder-plus', onSelect: () => addFolder(folderId) },
		{ label: 'Upload file', icon: 'tabler:upload', onSelect: () => uploadFile(folderId) },
	]
}

// Every row's actions collapsed into one dropdown behind one trigger button
// (see item-trailing below), rather than a row of separate buttons that used
// to fade in on hover — kind-specific entries (folder's add actions, image's
// copy-url) come first, delete last in its own group so it reads as the one
// destructive action instead of blending in with the rest.
function itemMenuItems(item: TreeItem): DropdownMenuItem[][] {
	const primary: DropdownMenuItem[] = []

	if (item.kind === 'folder') primary.push(...folderMenuItems(item.id))
	if (item.kind === 'image' && item.path) {
		primary.push({ label: 'Copy image URL', icon: 'tabler:copy-filled', onSelect: () => copyImageUrl(item.path) })
	}
	primary.push({ label: `Rename ${kindLabel(item)}`, icon: 'tabler:pencil-filled', onSelect: () => startRename(item) })

	return [
		primary,
		[{ label: `Delete ${kindLabel(item)}`, icon: 'tabler:trash-filled', color: 'error', onSelect: () => deleteItem(item) }],
	]
}

// Right-clicking anywhere on a row opens itemMenuItems at the cursor via the
// UContextMenu wrapped around .tree-row-dnd below (Reka's own trigger reads
// the native contextmenu event's coordinates to position it). Keyed off each
// row's own element so the actions button — see forwardRowContextMenu below —
// can look it up and re-target its own right-clicks there.
const rowDndRefs = new Map<string, HTMLElement>()

function rowKey(item: TreeItem): string | undefined {
	return item.id ?? item.label
}

function setRowDndRef(item: TreeItem, el: Element | ComponentPublicInstance | null) {
	const key = rowKey(item)
	if (!key) return
	if (el) rowDndRefs.set(key, el as HTMLElement)
	else rowDndRefs.delete(key)
}

// The actions button lives in Nuxt UI's separate item-trailing slot, outside
// the .tree-row-dnd element the row's own ContextMenuTrigger is actually
// bound to — a real contextmenu event fired here bubbles up through the
// button's own ancestor chain instead, never reaching that trigger. Re-
// dispatching a synthetic one directly at the row's element, carrying the
// same cursor position, is what Reka's trigger reads to place the menu — same
// result as if the right-click had landed on the row itself.
function forwardRowContextMenu(event: MouseEvent, item: TreeItem) {
	event.preventDefault()
	// Right-clicking the actions button while its own left-click dropdown is
	// already open doesn't count as an "outside" pointerdown to that dropdown
	// (Reka deliberately excludes its own trigger from dismiss-on-outside-click,
	// so re-clicking it doesn't just close-then-reopen) — so without this it's
	// left open underneath the context menu we're about to show instead.
	actionsMenuOpenKey.value = null
	const key = rowKey(item)
	const row = key ? rowDndRefs.get(key) : undefined
	row?.dispatchEvent(new MouseEvent('contextmenu', {
		bubbles: true,
		cancelable: true,
		clientX: event.clientX,
		clientY: event.clientY,
	}))
}

// Controlled (rather than left to each UDropdownMenu's own uncontrolled
// state) specifically so forwardRowContextMenu above has a way to force this
// closed from outside the component that actually owns it.
const actionsMenuOpenKey = ref<string | null>(null)

// ---- Rename ----
// Renaming edits inline (an input replacing the row's label) rather than a
// window.prompt — renamingItemId tracks which single row (if any) is
// currently in edit mode; the #item-label template swaps to the input only
// for that one row.

const renamingItemId = ref<string | null>(null)
const renamingValue = ref('')
const renameInputRef = ref<HTMLInputElement | null>(null)

// A click on the row to the right of the input (rather than on the input
// itself) should just commit-and-close the rename. The naive approach —
// let the browser blur the input as normal, commit on blur — races: mousedown
// shifts focus (and fires blur) before mouseup, so the hidden action buttons
// reappear mid-click and the *mouseup* lands on the reappeared delete button
// instead of this row, with the resulting click then hitting the row's own
// button underneath and triggering its native select-toggle (deselecting the
// item). preventDefault on mousedown stops the browser's automatic focus
// shift, so the input stays focused — nothing reappears mid-click — and we
// commit explicitly on the subsequent click instead, stopping it from
// reaching the row button underneath.
function onRowMouseDown(event: MouseEvent, item: TreeItem) {
	if (renamingItemId.value === item.id) event.preventDefault()
}

function onRowClick(event: MouseEvent, item: TreeItem) {
	if (renamingItemId.value !== item.id) return
	event.stopPropagation()
	commitRename(item)
}

async function startRename(item: TreeItem) {
	renamingItemId.value = item.id
	// The input only ever holds the base name — folders have no extension to
	// strip, scripts/images do (rejoined with it in commitRename below).
	renamingValue.value = item.kind === 'folder' ? scriptName(item) : splitFileName(scriptName(item)).base
	await nextTick()
	renameInputRef.value?.focus()
	renameInputRef.value?.select()
}

function cancelRename() {
	renamingItemId.value = null
}

async function renameScript(current: string, name: string) {
	if (!name || name === current) return

	if (fileStore.scripts.some((script) => script.name === name)) {
		window.alert('A script with that name already exists.')
		return
	}

	await fileStore.renameScript(current, name)
}

async function renameFolder(id: string, currentName: string, parentId: string | null, name: string) {
	if (!name || name === currentName) return

	const hasNameCollision = fileStore.childNodes(parentId).some((node) => node.kind === 'folder' && node.id !== id && node.name === name)
	if (hasNameCollision) {
		window.alert('A folder with that name already exists here.')
		return
	}

	await fileStore.renameFolder(id, name)
}

async function renameImage(id: string, currentName: string, name: string) {
	if (!name || name === currentName) return

	if (fileStore.images.some((img) => img.id !== id && img.name === name)) {
		window.alert('A file with that name already exists in this project.')
		return
	}

	await fileStore.renameImage(id, name)
}

async function renameTextFile(id: string, currentName: string, name: string) {
	if (!name || name === currentName) return

	if (fileStore.textFiles.some((f) => f.id !== id && f.name === name)) {
		window.alert('A file with that name already exists in this project.')
		return
	}

	await fileStore.renameTextFile(id, name)
}

// Guarded on renamingItemId still matching this item: Escape (cancelRename)
// clears it synchronously, but the input's blur (also wired to this) can
// still fire afterward as the element is torn down — without the guard
// that would attempt the same rename a second time.
function commitRename(item: TreeItem) {
	if (renamingItemId.value !== item.id) return
	const typed = renamingValue.value.trim()
	renamingItemId.value = null
	if (!typed) return

	if (item.kind === 'folder') {
		renameFolder(item.id, scriptName(item), item.parentId ?? null, typed)
		return
	}

	// The extension itself was never part of renamingValue (see startRename),
	// so it's re-attached here rather than trusted from what was typed.
	const name = joinFileName(typed, fileExtension(item))
	if (item.kind === 'image') renameImage(item.id, scriptName(item), name)
	else if (item.kind === 'text') renameTextFile(item.id, scriptName(item), name)
	else renameScript(scriptName(item), name)
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

	// Text files (unlike images) can be the active file, same as a script —
	// so a folder delete that takes one out from under the editor needs the
	// same active-file fallback scripts already get.
	const textFilesInside = fileStore.textFilesUnderFolder(id)
	const activeWasInside = scriptsInside.some((s) => s.name === fileStore.activeFileName)
		|| textFilesInside.some((f) => f.name === fileStore.activeFileName)
	await fileStore.deleteFolder(id)

	if (activeWasInside) {
		const next = fileStore.scripts[0]?.name
		if (next) emit('selectScript', next)
	}
}

async function deleteImage(id: string, name: string) {
	if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return
	await fileStore.deleteImage(id)
}

async function deleteTextFile(id: string, name: string) {
	if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return

	const wasActive = fileStore.activeFileName === name
	await fileStore.deleteTextFile(id)

	if (wasActive) {
		const next = fileStore.scripts[0]?.name
		if (next) emit('selectScript', next)
	}
}

function deleteItem(item: TreeItem) {
	if (item.kind === 'folder') return deleteFolder(item.id, scriptName(item))
	if (item.kind === 'image') return deleteImage(item.id, scriptName(item))
	if (item.kind === 'text') return deleteTextFile(item.id, scriptName(item))
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

type DraggedNode = { id: string, kind: 'folder' | 'script' | 'image' | 'text' }
type DropTarget = { folderId: string | null, index: number }

const draggedNode = ref<DraggedNode | null>(null)
const dragOverId = ref<string | null>(null)
const dropTarget = ref<DropTarget | null>(null)

function isDraggable(item: TreeItem): boolean {
	return item.kind === 'folder' || item.kind === 'script' || item.kind === 'image' || item.kind === 'text'
}

async function moveDraggedTo(dragged: DraggedNode, folderId: string | null, position: number) {
	if (dragged.kind === 'folder') await fileStore.moveFolder(dragged.id, folderId, position)
	else if (dragged.kind === 'image') await fileStore.moveImage(dragged.id, folderId, position)
	else if (dragged.kind === 'text') await fileStore.moveTextFile(dragged.id, folderId, position)
	else await fileStore.moveScript(dragged.id, folderId, position)
}

// Native `dragover` fires continuously — many times a second — for as long
// as the pointer sits over a valid target, not just when it actually moves
// to a new one. `dropTarget` feeds the `items` computed (via
// withDropPlaceholder), so assigning a plain new object here on every one
// of those events, even while hovering the exact same spot, was invalidating
// that computed and rebuilding the *entire* tree dozens of times a second —
// this was the "extremely slow" drag lag. Skipping the write when the
// target hasn't actually changed cuts that down to once per real crossing.
function dropTargetsEqual(a: DropTarget | null, b: DropTarget | null): boolean {
	if (a === b) return true
	if (!a || !b) return false
	return a.folderId === b.folderId && a.index === b.index
}

function setDropTarget(next: DropTarget | null) {
	if (dropTargetsEqual(dropTarget.value, next)) return
	dropTarget.value = next
}

// Skipping no-op writes (above) stopped the *reactive* explosion, but
// `fileStore.childNodes(...)` — an O(n) filter+sort over every folder and
// script — still ran synchronously on every single dragover event before
// that equality check ever saw the result, and dragover can fire faster
// than the screen can repaint. Capping the actual computation to once per
// rendered frame (via rAF) fixes that: at most ~60 of these a second no
// matter how fast the browser fires the raw event, while dragOverId (cheap,
// just a CSS class) still updates immediately so hover feedback stays
// instant.
let dragOverFrameId: number | null = null
let pendingDragOverUpdate: (() => void) | null = null

function scheduleDragOverUpdate(update: () => void) {
	pendingDragOverUpdate = update
	if (dragOverFrameId !== null) return
	dragOverFrameId = requestAnimationFrame(() => {
		dragOverFrameId = null
		pendingDragOverUpdate?.()
		pendingDragOverUpdate = null
	})
}

function cancelScheduledDragOverUpdate() {
	if (dragOverFrameId !== null) cancelAnimationFrame(dragOverFrameId)
	dragOverFrameId = null
	pendingDragOverUpdate = null
}

function onDragStart(event: DragEvent, item: TreeItem) {
	if (!isDraggable(item)) return
	draggedNode.value = { id: item.id, kind: item.kind }
	event.dataTransfer?.setData('text/plain', item.label ?? '')
	if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() {
	cancelScheduledDragOverUpdate()
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

	scheduleDragOverUpdate(() => {
		if (item.kind === 'folder') {
			ensureFolderExpanded(item.id)
			setDropTarget({ folderId: item.id, index: fileStore.childNodes(item.id).length })
			return
		}

		const parentId: string | null = item.parentId ?? null
		const siblings = fileStore.childNodes(parentId)
		const index = siblings.findIndex((n) => n.id === item.id)
		setDropTarget({ folderId: parentId, index: index >= 0 ? index : siblings.length })
	})
}

function onDragLeaveItem(item: TreeItem) {
	if (dragOverId.value !== item.id) return
	dragOverId.value = null
	cancelScheduledDragOverUpdate()
	setDropTarget(null)
}

function onDragOverRoot() {
	scheduleDragOverUpdate(() => {
		setDropTarget({ folderId: null, index: fileStore.childNodes(null).length })
	})
}

function onDragLeaveRoot() {
	if (dropTarget.value?.folderId === null) {
		cancelScheduledDragOverUpdate()
		setDropTarget(null)
	}
}

async function onDropOnItem(item: TreeItem) {
	const dragged = draggedNode.value
	const droppable = canDropOn(item)
	cancelScheduledDragOverUpdate()
	dragOverId.value = null
	draggedNode.value = null
	dropTarget.value = null
	if (!dragged || !droppable) return

	if (item.kind === 'folder') {
		const position = fileStore.nextPosition(item.id)
		await moveDraggedTo(dragged, item.id, position)
		return
	}

	// Dropped on a script/image/text-file row: become its sibling, inserted just before it.
	const targetParentId: string | null = item.parentId ?? null
	const siblings = fileStore.childNodes(targetParentId)
	const targetIndex = siblings.findIndex((n) => n.id === item.id)
	const target = siblings[targetIndex]
	if (!target) return
	const before = targetIndex > 0 ? siblings[targetIndex - 1] : undefined
	const position = before ? (before.position + target.position) / 2 : target.position - 1

	await moveDraggedTo(dragged, targetParentId, position)
}

async function onDropOnRoot() {
	const dragged = draggedNode.value
	cancelScheduledDragOverUpdate()
	draggedNode.value = null
	dragOverId.value = null
	dropTarget.value = null
	if (!dragged) return

	const position = fileStore.nextPosition(null)
	await moveDraggedTo(dragged, null, position)
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

		<UContextMenu :disabled="!fileStore.projectId" :items="folderMenuItems(null)">
			<div class="file-tree" @dragover.prevent="onDragOverRoot" @dragleave="onDragLeaveRoot" @drop="onDropOnRoot">
				<!-- selection-behavior="replace": Reka's own default ('toggle')
				deselects an item when it's clicked again while already
				selected, which — since this is a real v-model straight to the
				shared store — actually cleared the selection (see
				treeSelectionStore.ts; AssetLibrary.vue's UTree needs the same
				fix, sharing that same store/model). 'replace' always
				re-selects on click instead, so re-clicking the active item is
				a no-op rather than deactivating it. -->
				<UTree
					v-model="treeSelectionStore.current"
					:items="items"
					:get-key="(item: TreeItem) => item.id ?? item.label"
					selection-behavior="replace"
					:expanded="controlledExpandedIds"
					@update:expanded="onUpdateExpanded"
					class="file-tree"
				>
					<template #item-leading="{ item, expanded }">
						<img v-if="item.thumbnail" :src="item.thumbnail" :title="item.typeLabel" class="thumbnail-icon" alt="" />
						<UIcon v-else-if="item.icon" :name="item.icon" :title="item.typeLabel" class="leading-icon" />
						<UIcon v-else-if="item.kind === 'folder' || item.children?.length" :name="expanded ? 'tabler:folder-open-filled' : 'tabler:folder-filled'" class="leading-icon" />
					</template>

					<template #item-label="{ item }">
						<UContextMenu :disabled="!fileStore.projectId" :items="itemMenuItems(item)">
							<div
								class="tree-row-dnd"
								:ref="(el) => setRowDndRef(item, el)"
								:class="{
									'drag-over': dragOverId === item.id,
									'drop-line-before': dropLineTarget?.beforeId === item.id,
									'drop-line-after': dropLineTarget?.afterId === item.id,
									'renaming': renamingItemId === item.id,
								}"
								:draggable="isDraggable(item) && renamingItemId !== item.id"
								@dragstart="onDragStart($event, item)"
								@dragend="onDragEnd"
								@dragover.prevent.stop="onDragOverItem(item)"
								@dragleave="onDragLeaveItem(item)"
								@drop.stop="onDropOnItem(item)"
								@mousedown="onRowMouseDown($event, item)"
								@click="onRowClick($event, item)"
							></div>
						</UContextMenu>
						<div
							v-if="renamingItemId === item.id"
							class="rename-editing"
							@mousedown="onRowMouseDown($event, item)"
							@click="onRowClick($event, item)"
						>
							<input
								ref="renameInputRef"
								v-model="renamingValue"
								class="rename-input"
								autocomplete="off"
								spellcheck="false"
								@click.stop
								@mousedown.stop
								@keydown.enter="commitRename(item)"
								@keydown.escape="cancelRename"
								@blur="commitRename(item)"
							/>
							<!-- Static, not part of renamingValue — the whole point is that
							     it can't be typed over or cleared, only re-derived from the
							     item's current name in commitRename. -->
							<span v-if="fileExtension(item)" class="rename-extension">.{{ fileExtension(item) }}</span>
						</div>
						<template v-else>
							{{ item.label }}<span v-if="fileStore.isDirty(scriptName(item))" class="dirty-marker">*</span>
						</template>
					</template>

					<template v-if="fileStore.projectId" #item-trailing="{ item }">
						<div v-if="renamingItemId !== item.id" class="item-actions" @contextmenu="forwardRowContextMenu($event, item)">
							<UDropdownMenu
								:items="itemMenuItems(item)"
								:open="actionsMenuOpenKey === rowKey(item)"
								@update:open="(value: boolean) => actionsMenuOpenKey = value ? (rowKey(item) ?? null) : null"
							>
								<!-- <UTooltip text="Actions" ignore-non-keyboard-focus> -->
									<!-- Ghost's default hover/active fill is bg-elevated — invisible here since
									     .file-tree's own background is that same token (see below). Bumped one
									     step up to bg-accented so the highlight actually shows against it. -->
									<UButton
										icon="tabler:dots-vertical"
										variant="ghost"
										color="neutral"
										size="xs"
										:ui="{ base: 'hover:bg-[var(--theme-bg-accented)] active:bg-[var(--theme-bg-accented)]' }"
										@click.stop
									/>
								<!-- </UTooltip> -->
							</UDropdownMenu>
						</div>
					</template>

					<template #drop-placeholder>
						<div class="drop-placeholder"></div>
					</template>
				</UTree>
			</div>
		</UContextMenu>
	</div>
</template>

<style scoped>
.file-tree {
	flex: 1 1 auto;
	min-height: 0;
	overflow-y: auto;
	background-color: var(--theme-bg-elevated);
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
	/* Tailwind's preflight sets every <img> to `max-width: 100%` — for a
	   *fixed-size* one that's a live constraint tied to whatever width the
	   row narrows to, not a one-time value, so it silently wins over the
	   `width` above once the row gets tight enough. flex-shrink: 0 doesn't
	   touch this at all (that only governs the flex algorithm's own shrink
	   pass, which this element correctly opts out of already) — max-width
	   is a separate, later clamp applied on top regardless. Confirmed via a
	   throwaway harness mounting the real component standalone: without this
	   line the icon visibly shrank (down to 0 width) as the panel narrowed;
	   with it, it holds 1.25rem right up to the point the row itself
	   overflows the panel, same as .leading-icon (an inline SVG, never
	   subject to this) already does. */
	max-width: none;
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

/* Absolutely positioned against the tree-item link's own `position:
   relative` rather than sized to the label text, so the drag handle/drop
   target covers the whole row — icon, whitespace, and trailing-button area
   included — not just wherever the label happens to be. The label text
   itself renders as a plain sibling in this slot; Nuxt UI's own linkLabel
   span already truncates it. */
.tree-row-dnd {
	position: absolute;
	inset: 0;
	border-radius: 0.25rem;
}

/* .tree-row-dnd needs to *stay* interactive while renaming (not
   pointer-events:none, tried previously) — it's what a mousedown anywhere
   else in the row (right of the input) now lands on, and its own
   @mousedown handler stops that from bubbling to the row button's native
   select-toggle (which runs on mousedown, before the blur this same click
   triggers even has a chance to fire), which would otherwise deselect an
   already-selected item just from clicking away to finish renaming it.
   Raising this wrapper above it via z-index is what lets clicks *on the
   input itself* still reach the input normally for cursor placement/text
   selection, despite this overlay still covering the same area underneath.
   The wrapper carries the same mousedown/click handling .tree-row-dnd uses
   for "clicked elsewhere in the row" — here that covers the fixed extension
   suffix and any padding around it, i.e. everywhere in this box that isn't
   the input itself (which stops both events from ever reaching here). */
.rename-editing {
	position: relative;
	z-index: 1;
	display: flex;
	align-items: center;
	width: 100%;
	background-color: var(--theme-bg);
	border: 1px solid var(--theme-accent, var(--theme-text-muted));
	border-radius: 0.2rem;
	padding: 0 0.25em;
}

.rename-input {
	flex: 1 1 auto;
	min-width: 0;
	background: none;
	border: none;
	outline: none;
	color: var(--theme-text);
	font: inherit;
	padding: 0;
}

/* Never part of renamingValue (see startRename/commitRename) — this is only
   ever a rendering of the extension the item already had, not an editable
   field, so it's not focusable and can't be selected into the input's text. */
.rename-extension {
	flex: 0 0 auto;
	color: var(--theme-text-muted);
	white-space: nowrap;
	user-select: none;
}

/* Needs to stay the topmost element in the row — it's what dragstart/
   dragover/drop are actually bound to, and giving it a negative z-index to
   avoid covering the label text (tried previously) also pulled it out of
   the hit-testing order, silently breaking drag-and-drop entirely. A
   translucent fill keeps it on top for events while still letting the text
   read through underneath, instead of fighting over paint order. */
.tree-row-dnd.drag-over {
	outline: 2px solid var(--theme-accent, var(--theme-text-muted));
	outline-offset: -1px;
	background-color: color-mix(in srgb, var(--theme-bg-accented) 55%, transparent);
}

/* Only ever spliced into a *folder's* own children (see
   withFolderDropPlaceholder) — never into the same list a hovered row
   itself lives in — so unlike the old script-drop placeholder, this can't
   shift anything out from under the cursor and re-trigger itself. */
.drop-placeholder {
	width: 100%;
	height: 1.25rem;
	border-radius: 0.25rem;
	border: 1.5px dashed var(--theme-text-muted);
	background-color: var(--theme-bg-accented);
	pointer-events: none;
}

/* box-shadow rather than a border/outline: it's purely visual and never
   contributes to layout, so drawing it on the hovered row can't shift that
   row's own position — which a spliced-in placeholder row used to do,
   moving the hovered row out from under the cursor and causing dragleave
   to fire, clearing the target, snapping it back, re-triggering dragover,
   and so on in an endless flicker loop. */
.tree-row-dnd.drop-line-before {
	box-shadow: inset 0 2px 0 0 var(--theme-accent, var(--theme-text-muted));
}

.tree-row-dnd.drop-line-after {
	box-shadow: inset 0 -2px 0 0 var(--theme-accent, var(--theme-text-muted));
}

/* Rendered inside Nuxt UI's own linkTrailing span (data-slot="linkTrailing"
   — the same wrapper the tree's built-in expand/collapse chevron uses),
   which is already an in-flow flex item with `ms-auto` pushing it to the
   row's end. Previously this was pulled out to `position: absolute` instead,
   back when it only had to appear on hover — worth it then, since being out
   of flow let the label use the row's full width while the buttons were
   invisible. Now that there's a single persistent trigger, that trade-off is
   backwards: staying in flow is what makes it behave like the chevron
   already does — the label (min-width: 0 below) gives up space first, this
   button holds its own size instead of being squeezed or overlapped, and if
   the row truly runs out of room, the row itself overflows the panel rather
   than anything visually colliding — the same "drag the splitter further to
   cover it" behavior the chevron already has.

   Also needs `position: relative` + a z-index (same fix as .rename-editing
   above, same root cause): .tree-row-dnd is `position: absolute`, and an
   absolutely-positioned z-index:auto element always paints above a plain
   in-flow sibling regardless of DOM order, so without this the drag overlay
   sat on top of the button at all times and silently ate every click. */
.item-actions {
	position: relative;
	z-index: 1;
	flex-shrink: 0;
}

/* Nuxt UI only gives this element `truncate` (overflow-hidden + text-
   overflow: ellipsis + white-space: nowrap) — none of that clips anything
   until the box can actually shrink narrower than its content, and a flex
   item's default min-width is `auto`, i.e. "at least as wide as its
   unwrapped text". Overriding the floor to 0 is what lets the label actually
   give up space to .item-actions above as the row narrows, so the ellipsis
   applies at any width instead of only when there's slack to spare. */
:deep([data-slot="linkLabel"]) {
	min-width: 0;
}
</style>
