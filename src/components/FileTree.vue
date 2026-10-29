<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type { DropdownMenuItem, TreeItem } from '@nuxt/ui'
import { useToast } from '@nuxt/ui/composables'
import { libraryKind, useFileStore, type TreeNode } from '@/stores/fileStore'
import { selectModifier, useTreeSelectionStore } from '@/stores/treeSelectionStore'
import { setCountDragImage } from '@/utils/dragImage'
import { useNamePromptStore } from '@/stores/namePromptStore'
import { useProjectSettingsStore } from '@/stores/projectSettingsStore'
import { attributionFor, attributionLabel } from '@/api/library'
import { audioDuration, formatDuration } from '@/utils/audioDuration'
import {
	DEFAULT_TEXT_FILE_TYPE,
	FILE_TREE_DRAG_MIME,
	LIBRARY_DRAG_MIME,
	UPLOAD_ACCEPT_ATTR,
	UPLOAD_FORMAT_LABELS,
	uploadDisplayName,
	uploadFileTypeFor,
	uploadFileTypeForExtension,
	isFileNameTooLong,
	isMainScript,
	joinFileName,
	type ScriptFileType,
	scriptTypeForFile,
	MAX_FILE_NAME_LENGTH,
	scriptFileType,
	splitFileName,
} from '@/utils/fileTypes'
import { formatBytes } from '@/utils/formatBytes'
import CollapsiblePane from './CollapsiblePane.vue'
import LibraryCredit from './LibraryCredit.vue'
import StorageIndicator from './StorageIndicator.vue'

const fileStore = useFileStore()
const treeSelectionStore = useTreeSelectionStore()
const namePromptStore = useNamePromptStore()
const projectSettingsStore = useProjectSettingsStore()
const toast = useToast()

// The project's canonical entry point — always what the game header's
// Restart button runs (see CodeEditor.vue's runMainScript). Can't be
// deleted from here (see itemMenuItems) so that invariant always holds.
// Matched on base name (isMainScript), not a literal: a TypeScript project's
// entry script is main.ts, and it's every bit as undeletable.

// Shared by every create/rename path below (scripts, text files, images,
// folders) — the rename input also caps typing itself via :maxlength, so
// this mainly catches image uploads, which have no equivalent way to limit
// their (source-file-derived) name as it's typed. Always takes the *base*
// name — the extension doesn't count against the limit (see
// MAX_FILE_NAME_LENGTH) — so split first if what you have is a full name.
function checkNameLength(base: string): boolean {
	if (!isFileNameTooLong(base)) return true
	window.alert(`Names can't be longer than ${MAX_FILE_NAME_LENGTH} characters.`)
	return false
}

async function copyFileUrl(path: string) {
	await navigator.clipboard.writeText(path)
	toast.add({
		title: 'Copied to clipboard',
		description: path,
		icon: 'tabler:copy-filled',
	})
}

const emit = defineEmits<{
	selectScript: [fileName: string]
	runScript: [fileName: string]
}>()

// Every file row's select handler. A plain click is left to Reka, which
// replaces treeSelectionStore.current (collapsing any multi-selection — see
// the store's Multi-selection notes), and opens a script or text file. A
// Shift or Ctrl/Cmd click only changes which rows are selected, so it's kept
// from Reka and opens nothing. Folders are never part of a multi-selection —
// clicking one only ever opens or closes it (see preventFolderSelect).
//
// Reads the script name from the item's own data rather than the clicked
// element's rendered text — the label slot appends a "*" for unsaved
// files, which would otherwise get emitted as part of the file name. The
// template invokes this with (event, item) even though TreeItem.onSelect's
// declared type only requires the event, so item is typed optional here.
function onFileSelect(event: CustomEvent<{ originalEvent?: Event }>, item?: TreeItem) {
	if (!item) return
	const modifier = selectModifier(event)
	if (modifier) {
		event.preventDefault()
		if (modifier === 'range') treeSelectionStore.selectRange('files', item.id, visibleFileIds())
		else treeSelectionStore.toggle('files', item.id)
		return
	}
	if ((item.kind === 'script' || item.kind === 'text') && item.label) emit('selectScript', item.label)
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

// ---- Folders + scripts, in a loaded project or the guest sandbox alike ----

// Nuxt UI's `defaultExpanded` per item only seeds Reka's *initial*,
// uncontrolled expand state once at mount — a folder created afterward
// (during this session, after that one seeding pass already ran) never
// gets added to it and stays permanently collapsed regardless of the field.
// Switching to the *controlled* `expanded` prop (bound below) fixes that
// generally, and additionally lets a drag hover open a specific folder on
// demand (see scheduleAutoExpand).
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

function onUpdateExpanded(ids: string[]) {
	expandedFolderIds.value = ids
}

function buildNode(node: TreeNode, parentId: string | null): TreeItem {
	if (node.kind === 'folder') {
		return {
			label: node.name,
			kind: 'folder',
			id: node.id,
			parentId,
			// A folder has no size of its own — only whatever's actually
			// inside it, recursively (see folderSizeBytes's own comment).
			size: fileStore.folderSizeBytes(node.id),
			onSelect: preventFolderSelect,
			children: fileStore.childNodes(node.id).map((child) => buildNode(child, node.id)),
		}
	}
	if (node.kind === 'image') {
		return {
			label: node.name,
			kind: 'image',
			id: node.id,
			parentId,
			size: node.size,
			thumbnail: node.publicUrl,
			path: node.publicUrl,
			typeLabel: uploadFileTypeForExtension(splitFileName(node.name).extension)?.label,
			onSelect: onFileSelect,
		}
	}
	if (node.kind === 'audio') {
		// No thumbnail, so selecting one doesn't open EditorView's image
		// preview — the row has its own Play instead, on hover and in its menu
		// (see Audio preview).
		const fileType = uploadFileTypeForExtension(splitFileName(node.name).extension)
		return {
			label: node.name,
			kind: 'audio',
			id: node.id,
			parentId,
			size: node.size,
			path: node.publicUrl,
			icon: fileType?.icon,
			typeLabel: fileType?.label,
			onSelect: onFileSelect,
		}
	}
	if (node.kind === 'libraryImage') {
		// Same shape as an uploaded image or sound — thumbnail/path are what
		// EditorView's preview and the "Copy URL" actions read — just pointed
		// at the Library asset instead of an R2 object. No size: a link stores
		// nothing, so the trailing slot shows the library chip in its place.
		// The chip opens the asset's credit, which travels with the link.
		const fileType = uploadFileTypeForExtension(splitFileName(node.libraryPath).extension)
		const sound = libraryKind(node.libraryPath) === 'audio'
		return {
			label: node.name,
			kind: 'libraryImage',
			id: node.id,
			parentId,
			sound,
			thumbnail: sound ? undefined : node.libraryPath,
			icon: sound ? fileType?.icon : undefined,
			path: node.libraryPath,
			typeLabel: fileType?.label,
			attribution: attributionFor(node.libraryPath),
			onSelect: onFileSelect,
		}
	}
	if (node.kind === 'text') {
		return {
			label: node.name,
			kind: 'text',
			id: node.id,
			parentId,
			size: node.size,
			icon: DEFAULT_TEXT_FILE_TYPE.icon,
			typeLabel: DEFAULT_TEXT_FILE_TYPE.label,
			// Opens the same way a script does — same Monaco pane, just a
			// plaintext model with no language worker (see CodeEditor.vue).
			onSelect: onFileSelect,
		}
	}
	const fileType = scriptFileType(splitFileName(node.name).extension)
	return {
		label: node.name,
		kind: 'script',
		id: node.id,
		parentId,
		size: node.size,
		icon: fileType.icon,
		typeLabel: fileType.label,
		onSelect: onFileSelect,
	}
}

const items = computed<TreeItem[]>(() => fileStore.childNodes(null).map((node) => buildNode(node, null)))

// Every row by id, at any depth — what a multi-row drag turns its selected
// ids back into.
const itemsById = computed(() => {
	const byId = new Map<string, TreeItem>()
	const add = (list: TreeItem[]) => {
		for (const item of list) {
			byId.set(item.id, item)
			if (item.children) add(item.children)
		}
	}
	add(items.value)
	return byId
})

// ---- Multi-selection ----
// Kept in treeSelectionStore, shared with the Library so that only one tree
// ever has a multi-selection — see the notes there.

// Files in the order they're shown, skipping the contents of closed folders —
// what a Shift-click's range runs over.
function visibleFileIds(): string[] {
	const ids: string[] = []
	const add = (list: TreeItem[]) => {
		for (const item of list) {
			if (item.kind !== 'folder') ids.push(item.id)
			else if (expandedFolderIds.value.includes(item.id)) add(item.children ?? [])
		}
	}
	add(items.value)
	return ids
}

// `current` included — the store always puts it in the selection.
function isInSelection(item: TreeItem): boolean {
	return treeSelectionStore.isSelected('files', item.id)
}

// Whatever the center panel is showing: the image EditorView previews (it
// opens one for any selection with a thumbnail — see its watcher on
// treeSelectionStore.current), and otherwise the active script or text file.
// A previewed Library image has no row here, so nothing is marked then.
// Highlighted apart from the selection (see .viewing), since the two drift
// apart: Ctrl-clicking other files, or selecting a sound, leaves the open
// file where it was.
const viewedId = computed<string | null>(() => {
	const current = treeSelectionStore.current
	if (current?.thumbnail && current.path) return current.id ?? null
	const name = fileStore.activeFileName
	return (fileStore.scripts.find((s) => s.name === name) ?? fileStore.textFiles.find((f) => f.name === name))?.id ?? null
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

// Drives the name/icon coloring below: a script that just threw takes
// priority over merely being unsaved, so the row reads as "look here" rather
// than the two states visually competing.
function itemStateClass(item: TreeItem): string | undefined {
	const name = scriptName(item)
	if (fileStore.erroredScriptName === name) return 'item-state-error'
	if (fileStore.isDirty(name)) return 'item-state-dirty'
	return undefined
}

// An uploaded sound, or a link to one of the Library's.
function isSoundItem(item: TreeItem): boolean {
	return item.kind === 'audio' || (item.kind === 'libraryImage' && item.sound)
}

function libraryChipTitle(item: TreeItem): string {
	const credit = item.attribution ? `\n${attributionLabel(item.attribution)}` : ''
	return `Linked from the Library: ${item.path}${credit}\nDoesn't use project storage`
}

// Human label for the rename/delete tooltips below — a plain if-chain reads
// better here than a 4-way ternary once 'text' joins 'folder'/'image'/'script'.
function kindLabel(item: TreeItem): string {
	if (item.kind === 'folder') return 'folder'
	if (isSoundItem(item)) return 'sound'
	if (item.kind === 'image' || item.kind === 'libraryImage') return 'image'
	if (item.kind === 'text') return 'text file'
	return 'script'
}

// Whichever existing script would clash with `name` — matched on the *base*
// name, across every script extension, not just an exact hit.
//
// Two scripts can't share a base even under different extensions. An
// extensionless `./helper` resolves to whichever extension the importing
// script's own language prefers (see scriptResolution.ts), so a project
// holding both helper.js and helper.ts would silently hand two importers two
// different files. For `main` it's worse still: isMainScript matches on the
// base, so both would claim to be the entry point, both would be undeletable,
// and Restart would run whichever happened to sit earlier in the list.
//
// `currentName` is the script being renamed, which must not clash with itself
// — without it, switching a script's own type would always report a conflict.
function conflictingScript(name: string, currentName?: string) {
	const base = splitFileName(name).base
	return fileStore.scripts.find((script) =>
		script.name !== currentName && splitFileName(script.name).base === base)
}

// Says which file is in the way, and why it counts when the extension differs
// — "a script with that name already exists" reads like a bug when the name
// visibly *doesn't* match.
function reportScriptConflict(name: string, existing: { name: string }) {
	if (existing.name === name) {
		window.alert('A script with that name already exists.')
		return
	}
	window.alert(`"${existing.name}" already uses the name "${splitFileName(name).base}". Scripts can't share a name, even with different extensions.`)
}

// ---- Create ----

async function addScript(folderId: string | null, type: ScriptFileType) {
	const input = await namePromptStore.prompt({
		title: 'New script',
		description: `"${joinFileName('', type.extension)}" is added automatically.`,
		maxLength: MAX_FILE_NAME_LENGTH,
		confirmLabel: 'Create',
	})
	if (!input) return

	// Whatever's typed becomes the base name, full stop — mirrors the rename
	// input, which never lets the extension itself be edited either.
	const base = splitFileName(input.trim()).base
	if (!base) return
	const name = fileStore.newScriptName(base, type)

	const conflict = conflictingScript(name)
	if (conflict) {
		reportScriptConflict(name, conflict)
		return
	}

	try {
		await fileStore.createScript(name, '', folderId)
	} catch (err) {
		window.alert(err instanceof Error ? err.message : 'Failed to create script')
	}
}

async function addFolder(parentId: string | null) {
	const name = await namePromptStore.prompt({
		title: 'New folder',
		maxLength: MAX_FILE_NAME_LENGTH,
		confirmLabel: 'Create',
	})
	if (!name) return

	const hasNameCollision = fileStore.childNodes(parentId).some((node) => node.kind === 'folder' && node.name === name)
	if (hasNameCollision) {
		window.alert('A folder with that name already exists here.')
		return
	}

	await fileStore.createFolder(name, parentId)
}

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024 // 10MB

// "PNG, JPG, SVG, WebP, MP3, Ogg, WAV, and M4A"
const supportedFormatsText = `${UPLOAD_FORMAT_LABELS.slice(0, -1).join(', ')}, and ${UPLOAD_FORMAT_LABELS[UPLOAD_FORMAT_LABELS.length - 1]}`

function uploadFile(folderId: string | null) {
	const input = document.createElement('input')
	input.type = 'file'
	input.accept = UPLOAD_ACCEPT_ATTR
	input.onchange = async () => {
		const file = input.files?.[0]
		if (!file) return

		if (!uploadFileTypeFor(file)) {
			window.alert(`Only ${supportedFormatsText} files are supported.`)
			return
		}
		if (file.size > MAX_UPLOAD_SIZE) {
			window.alert('That file is too large — uploads must be 10MB or smaller.')
			return
		}
		// The name it'll actually be stored under — its recognized type's
		// canonical extension, not necessarily whatever this source file was
		// called (see uploadDisplayName) — is what has to be unique, not file.name.
		const name = uploadDisplayName(file)
		if (!checkNameLength(splitFileName(name).base)) return
		if (fileStore.isImageNameTaken(name)) {
			window.alert('A file with that name already exists in this project.')
			return
		}

		try {
			await fileStore.uploadImage(file, folderId)
		} catch (err) {
			window.alert(err instanceof Error ? err.message : 'Failed to upload file')
		}
	}
	input.click()
}

// ---- Audio preview ----
// One shared element, so starting a second file's preview stops the first.

const previewingAudioId = ref<string | null>(null)
let previewAudio: HTMLAudioElement | null = null

function toggleAudioPreview(item: TreeItem) {
	if (previewingAudioId.value === item.id) {
		stopAudioPreview()
		return
	}
	stopAudioPreview()
	previewAudio = new Audio(item.path)
	previewAudio.addEventListener('ended', stopAudioPreview)
	previewingAudioId.value = item.id
	previewAudio.play().catch((err) => {
		stopAudioPreview()
		window.alert(`Couldn't play "${scriptName(item)}": ${err instanceof Error ? err.message : err}`)
	})
}

function stopAudioPreview() {
	previewAudio?.pause()
	previewAudio = null
	previewingAudioId.value = null
}

onBeforeUnmount(stopAudioPreview)

// Blank creation, same shape as addScript — not upload-based: there's no
// file picker here, just a name prompt and an empty new row.
async function addTextFile(folderId: string | null) {
	const input = await namePromptStore.prompt({
		title: 'New text file',
		description: `"${joinFileName('', DEFAULT_TEXT_FILE_TYPE.extension)}" is added automatically.`,
		maxLength: MAX_FILE_NAME_LENGTH,
		confirmLabel: 'Create',
	})
	if (!input) return

	const base = splitFileName(input.trim()).base
	if (!base) return
	const name = joinFileName(base, DEFAULT_TEXT_FILE_TYPE.extension)

	if (fileStore.textFiles.some((f) => f.name === name)) {
		window.alert('A file with that name already exists in this project.')
		return
	}

	try {
		await fileStore.createTextFile(name, '', folderId)
	} catch (err) {
		window.alert(err instanceof Error ? err.message : 'Failed to create text file')
	}
}

// Dropdown shown behind the header's own "+" for the project root — folderId
// is null for root. Also folded into itemMenuItems below for folder rows,
// rather than getting its own separate trigger button on those rows.
// Upload only ever appears in a real project — the guest sandbox has no
// object storage to put an uploaded file in (see fileStore.uploadImage's own
// guard, the actual enforcement point).
// "New script" is a plain action while the project's family has one script type,
// and a submenu of the types while it has more (projectSettingsStore's
// availableScriptTypes). Deliberately not always a submenu: with a single entry
// it would be a click that asks nothing.
function newScriptItem(folderId: string | null): DropdownMenuItem {
	const types = projectSettingsStore.availableScriptTypes

	if (types.length < 2) {
		return { label: 'New script', icon: 'tabler:script-plus', onSelect: () => addScript(folderId, types[0]!) }
	}

	return {
		label: 'New script',
		icon: 'tabler:script-plus',
		children: types.map((type) => ({
			label: `${type.label} (.${type.extension})`,
			icon: type.icon,
			onSelect: () => addScript(folderId, type),
		})),
	}
}

// Lets an existing script move between .js and .ts. Purely a rename — the
// content is left exactly as written, so switching back restores the file
// unchanged. Going to .js can leave TypeScript syntax behind that's no longer
// valid; that surfaces immediately as an error on the offending line rather
// than being silently rewritten, and switching back undoes it.
//
// Offered only while the project's family has more than one script type — the
// same condition newScriptItem uses.
function scriptTypeItem(item: TreeItem): DropdownMenuItem | undefined {
	const types = projectSettingsStore.availableScriptTypes
	if (types.length < 2) return undefined

	const current = scriptTypeForFile(scriptName(item))

	return {
		label: 'Script type',
		icon: 'tabler:file-code',
		children: types.map((type) => ({
			label: `${type.label} (.${type.extension})`,
			// The current type is checked rather than left out, so the menu shows
			// what the file *is* and not only what it could become — same
			// convention as the API version dropdown (versions/index.ts).
			...(type.id === current.id
				? { icon: 'tabler:check', color: 'primary' as const }
				: { icon: type.icon }),
			onSelect: () => switchScriptType(item, type),
		})),
	}
}

async function switchScriptType(item: TreeItem, type: ScriptFileType) {
	const current = scriptName(item)
	const { base, extension } = splitFileName(current)
	if (extension === type.extension) return

	// Straight through the same path the rename input uses, so the collision
	// check (a helper.ts already sitting next to this helper.js), the store
	// write, and the editor's own model swap all behave identically to a
	// hand-typed rename. The model's language follows from the new name —
	// see CodeEditor.vue's rename watcher.
	await renameScript(current, joinFileName(base, type.extension))
}

function folderMenuItems(folderId: string | null): DropdownMenuItem[] {
	const items: DropdownMenuItem[] = [
		newScriptItem(folderId),
		{ label: 'New text file', icon: 'tabler:file-plus', onSelect: () => addTextFile(folderId) },
		{ label: 'New folder', icon: 'tabler:folder-plus', onSelect: () => addFolder(folderId) },
	]
	if (fileStore.projectId) items.push({ label: 'Upload file', icon: 'tabler:upload', onSelect: () => uploadFile(folderId) })
	return items
}

// Every row's actions collapsed into one dropdown behind one trigger button
// (see item-trailing below), rather than a row of separate buttons that used
// to fade in on hover — kind-specific entries (folder's add actions, image's
// copy-url) come first, delete last in its own group so it reads as the one
// destructive action instead of blending in with the rest.
function itemMenuItems(item: TreeItem): DropdownMenuItem[][] {
	const primary: DropdownMenuItem[] = []

	if (item.kind === 'script') {
		primary.push({ label: 'Run script', icon: 'tabler:player-play-filled', onSelect: () => emit('runScript', scriptName(item)) })
	}
	if (item.kind === 'folder') primary.push(...folderMenuItems(item.id))
	if (isSoundItem(item) && item.path) {
		primary.push(previewingAudioId.value === item.id
			? { label: 'Stop', icon: 'tabler:player-stop-filled', onSelect: () => toggleAudioPreview(item) }
			: { label: 'Play', icon: 'tabler:player-play-filled', onSelect: () => toggleAudioPreview(item) })
		primary.push({ label: 'Copy sound URL', icon: 'tabler:copy-filled', onSelect: () => copyFileUrl(item.path) })
	} else if ((item.kind === 'image' || item.kind === 'libraryImage') && item.path) {
		primary.push({ label: 'Copy image URL', icon: 'tabler:copy-filled', onSelect: () => copyFileUrl(item.path) })
	}
	if (item.kind === 'script') {
		const typeItem = scriptTypeItem(item)
		if (typeItem) primary.push(typeItem)
	}
	primary.push({ label: `Rename ${kindLabel(item)}`, icon: 'tabler:pencil-filled', onSelect: () => startRename(item) })

	const groups = [primary]

	// The canonical entry script can be renamed (that stays a legitimate
	// reorganization) but never deleted from here — nothing else guarantees
	// a project always has one, and Restart depends on it existing.
	//
	// A library image only ever loses its link (the asset stays in the
	// Library), so it reads as "Remove" rather than "Delete".
	if (item.kind === 'libraryImage') {
		groups.push([{ label: `Remove ${kindLabel(item)}`, icon: 'tabler:link-off', color: 'error', onSelect: () => deleteItem(item) }])
	} else if (!(item.kind === 'script' && isMainScript(scriptName(item)))) {
		groups.push([{ label: `Delete ${kindLabel(item)}`, icon: 'tabler:trash-filled', color: 'error', onSelect: () => deleteItem(item) }])
	}

	return groups
}

// Right-clicking anywhere on a row opens itemMenuItems at the cursor via the
// UContextMenu wrapped around .tree-row-dnd below (Reka's own trigger reads
// the native contextmenu event's coordinates to position it). Keyed off each
// row's own element so the actions button — see forwardRowContextMenu below —
// can look it up and re-target its own right-clicks there.
const rowDndRefs = new Map<string, HTMLElement>()

// The reverse direction: from a row's element back to the item it was
// rendered for, which is how drag-and-drop works out what's being hovered
// (see hoveredItem).
const rowItems = new WeakMap<Element, TreeItem>()

function rowKey(item: TreeItem): string | undefined {
	return item.id ?? item.label
}

function setRowDndRef(item: TreeItem, el: Element | ComponentPublicInstance | null) {
	const key = rowKey(item)
	if (!key) return
	if (el) {
		rowDndRefs.set(key, el as HTMLElement)
		rowItems.set(el as HTMLElement, item)
	} else {
		rowDndRefs.delete(key)
	}
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

// Bound to both the row's UContextMenu (right-click) and its UDropdownMenu
// ("..." button) via :content="{ onCloseAutoFocus: preventCloseAutoFocus }".
// Both close as part of selecting "Rename", and Reka's Menu primitive
// explicitly moves focus back to whatever triggered it as part of that close
// — which, since the rename <input> has almost always already claimed focus
// by then, *blurs* it and fires commitRename via its own @blur handler
// before the user can type a single character. Confirmed via the actual
// stack trace (FocusScope's focus() call landing in our onBlur) rather than
// assumed — this is the primitive's own designed-in behavior, not a bug in
// it, so preventing it here is the correct fix rather than trying to win a
// timing race against it.
function preventCloseAutoFocus(event: Event) {
	event.preventDefault()
}

// Not reactive — only ever read imperatively from onDocumentMouseDown below,
// which needs the actual item (commitRename's signature) and not just its id.
let renamingItem: TreeItem | null = null

// Backstop for "click outside closes the rename" on top of the existing
// blur/row-click handling above: blur alone isn't reliable here, since any
// *other* element's own mousedown handler calling preventDefault() (a
// legitimate technique elsewhere for its own unrelated reasons, e.g.
// preserving a selection) has the side effect of blocking the browser's
// default focus-shift too, which means this input never loses focus and
// blur never fires. A capture-phase document listener runs regardless of
// what any other handler does with the same event, so it can't be starved
// the same way.
function onDocumentMouseDown(event: MouseEvent) {
	if (!renamingItem) return
	const target = event.target
	if (target instanceof HTMLElement && target.closest('.rename-editing')) return
	commitRename(renamingItem)
}

onMounted(() => document.addEventListener('mousedown', onDocumentMouseDown, true))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocumentMouseDown, true))

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

// The tree root has its own roving-tabindex keyboard nav (arrow keys to
// move the active item, Home/End, type-ahead search, ...) bound at the
// tree/treeitem level — which the rename <input> sits *inside*, so every
// keystroke while typing a new name also bubbles up into it unless stopped
// here. Left unstopped, ordinary text editing (Home/End to jump within the
// typed name, arrow keys, letters) doubles as tree navigation underneath.
// One handler for the whole keydown, rather than @keydown.stop *and*
// separate @keydown.enter/.escape ones — a real DOM element can only carry
// one `keydown` listener from a template, so Enter/Escape have to be
// dispatched from in here too.
function onRenameKeydown(event: KeyboardEvent, item: TreeItem) {
	event.stopPropagation()
	if (event.key === 'Enter') commitRename(item)
	else if (event.key === 'Escape') cancelRename()
}

async function startRename(item: TreeItem) {
	// Belt-and-braces alongside preventCloseAutoFocus above: forces the
	// dropdown closed immediately rather than waiting on its own close, in
	// case anything else is watching actionsMenuOpenKey in the meantime.
	if (actionsMenuOpenKey.value === rowKey(item)) actionsMenuOpenKey.value = null

	renamingItemId.value = item.id
	renamingItem = item
	// The input only ever holds the base name — folders have no extension to
	// strip, scripts/images do (rejoined with it in commitRename below).
	renamingValue.value = item.kind === 'folder' ? scriptName(item) : splitFileName(scriptName(item)).base
	await nextTick()

	// preventCloseAutoFocus (above) stops the menu from actively stealing
	// focus back to a specific target, but the right-click ContextMenu's
	// FocusScope still unwinds itself on its own timing regardless —
	// observed landing focus on <body> afterward even with that prevented.
	// Deferring past it with a macrotask, same reasoning as the comment that
	// used to be here, is still needed on top of preventCloseAutoFocus, not
	// instead of it.
	setTimeout(() => {
		renameInputRef.value?.focus()
		renameInputRef.value?.select()
	}, 0)
}

function cancelRename() {
	renamingItemId.value = null
	renamingItem = null
}

async function renameScript(current: string, name: string) {
	if (!name || name === current) return

	// Excludes the script being renamed, so switching its own type (helper.js
	// -> helper.ts, same base) isn't mistaken for a clash with itself.
	const conflict = conflictingScript(name, current)
	if (conflict) {
		reportScriptConflict(name, conflict)
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

// Covers library links too — they share one namespace with uploads (see
// fileStore.isImageNameTaken), and only differ in which table gets written.
async function renameImage(item: TreeItem, name: string) {
	if (!name || name === scriptName(item)) return

	if (fileStore.isImageNameTaken(name, item.id)) {
		window.alert('A file with that name already exists in this project.')
		return
	}

	if (item.kind === 'libraryImage') await fileStore.renameLibraryImage(item.id, name)
	else await fileStore.renameImage(item.id, name)
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
	renamingItem = null
	if (!typed) return

	if (item.kind === 'folder') {
		if (!checkNameLength(typed)) return
		renameFolder(item.id, scriptName(item), item.parentId ?? null, typed)
		return
	}

	// Checked against the base (typed), before the extension is re-attached
	// below — the input's own :maxlength already keeps this under the limit
	// by construction, so this is a backstop, not the primary defense.
	if (!checkNameLength(typed)) return

	// The extension itself was never part of renamingValue (see startRename),
	// so it's re-attached here rather than trusted from what was typed.
	const name = joinFileName(typed, fileExtension(item))
	if (item.kind === 'image' || item.kind === 'audio' || item.kind === 'libraryImage') renameImage(item, name)
	else if (item.kind === 'text') renameTextFile(item.id, scriptName(item), name)
	else renameScript(scriptName(item), name)
}

// ---- Delete ----

async function deleteScript(name: string) {
	// Belt-and-braces: itemMenuItems already omits the Delete entry entirely
	// for the main script, so this only matters if some other path ever calls here.
	if (isMainScript(name)) {
		window.alert("The main script can't be deleted.")
		return
	}
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

// Guest sandbox only: back to exactly what a first-ever visit gets, files and
// sandbox settings both. A reload rather than reseeding in place — see
// fileStore.resetGuestProject for why.
function resetSandbox() {
	if (!window.confirm('Reset the sandbox? All files and settings go back to how they started. This can\'t be undone.')) return
	fileStore.resetGuestProject()
	projectSettingsStore.clearGuestStored()
	window.location.reload()
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

// No confirm, unlike every delete above: nothing is lost — the same asset can
// be added back from the Library in one click.
async function removeLibraryImage(id: string) {
	try {
		await fileStore.removeLibraryImage(id)
	} catch (err) {
		window.alert(err instanceof Error ? err.message : 'Failed to remove file')
	}
}

function deleteItem(item: TreeItem) {
	if (item.kind === 'folder') return deleteFolder(item.id, scriptName(item))
	if (item.kind === 'image' || item.kind === 'audio') {
		if (previewingAudioId.value === item.id) stopAudioPreview()
		return deleteImage(item.id, scriptName(item))
	}
	if (item.kind === 'libraryImage') {
		if (previewingAudioId.value === item.id) stopAudioPreview()
		return removeLibraryImage(item.id)
	}
	if (item.kind === 'text') return deleteTextFile(item.id, scriptName(item))
	return deleteScript(scriptName(item))
}

// ---- Drag and drop ----
//
// Native HTML5 DnD, modeled on VS Code's explorer. The tree is always sorted
// (see fileStore's compareTreeNodes), so a drop only ever chooses a *folder*,
// never a spot within one: hovering a folder's row targets that folder,
// hovering a file targets the folder it sits in, and hovering the empty space
// below the rows targets the project root. That folder's whole block — its
// own row and every row under it — is tinted (the whole tree, for the root),
// so the highlight reads as "into here" rather than "next to this row".
//
// Each row's drag handle is a div rendered into the item-label slot (the one
// bit of each row's markup this component fully controls; Nuxt UI's Tree
// renders the rest of the row itself), absolutely positioned to cover the
// whole row rather than just the label text. Only dragstart/dragend live on
// it — dragover and drop are handled once, on the tree's container, by
// resolving the hovered <li> (see hoveredItem). That gives the parts of a row
// the handle doesn't cover (the actions button, the indent gutter beside a
// folder's children) the same answer as the row itself, so sweeping the
// pointer across them never flickers the target off and back on.
//
// Dragging a row that's part of a multi-selection moves every selected file
// (see Multi-selection); dragging any other row moves just that row. The tree
// also takes Library assets dragged in from AssetLibrary.vue, adding a link
// to the asset in the target folder rather than moving anything.

type DraggedNode = {
	id: string
	kind: 'folder' | 'script' | 'image' | 'audio' | 'libraryImage' | 'text'
	name: string
	parentId: string | null
	// For a folder: itself plus everything under it, none of which it can be
	// moved into. Worked out once at dragstart rather than on every dragover.
	blockedFolderIds: Set<string>
}
// folderId is null for the project root.
type DropTarget = { folderId: string | null }

const draggedNodes = ref<DraggedNode[] | null>(null)
const dropTarget = ref<DropTarget | null>(null)

function isDraggable(item: TreeItem): boolean {
	return item.kind === 'folder' || item.kind === 'script' || item.kind === 'image' || item.kind === 'audio' || item.kind === 'libraryImage' || item.kind === 'text'
}

// The stored position is still written, but only so the column stays
// sensible — it no longer affects where anything is shown.
async function moveDraggedTo(dragged: DraggedNode, folderId: string | null) {
	const position = fileStore.nextPosition(folderId)
	if (dragged.kind === 'folder') await fileStore.moveFolder(dragged.id, folderId, position)
	else if (dragged.kind === 'image' || dragged.kind === 'audio') await fileStore.moveImage(dragged.id, folderId, position)
	else if (dragged.kind === 'libraryImage') await fileStore.moveLibraryImage(dragged.id, folderId, position)
	else if (dragged.kind === 'text') await fileStore.moveTextFile(dragged.id, folderId, position)
	else await fileStore.moveScript(dragged.id, folderId, position)
}

// Native `dragover` fires continuously — many times a second — even while
// the pointer sits still. `dropTarget` drives a class on every row, so a
// fresh object on each of those events would re-render the whole tree each
// time; only real changes are written.
function setDropTarget(next: DropTarget | null) {
	const current = dropTarget.value
	if (current === next || (current && next && current.folderId === next.folderId)) return
	dropTarget.value = next
}

// The row under the pointer, or null over the empty space below the last
// row. Nuxt UI wraps every row in an <li> holding the row's own link and, for
// an expanded folder, the nested list of its children — so the nearest <li>
// is either the hovered row, or (in the gutter beside a folder's children)
// that folder, which is the right drop target for that spot too.
function hoveredItem(event: DragEvent): TreeItem | null {
	const li = event.target instanceof Element ? event.target.closest('li') : null
	const handle = li?.querySelector(':scope > [data-slot="link"] .tree-row-dnd')
	return handle ? rowItems.get(handle) ?? null : null
}

function dropFolderFor(item: TreeItem | null): string | null {
	if (!item) return null
	return item.kind === 'folder' ? item.id : (item.parentId ?? null)
}

// Same rules as VS Code: nothing moves into the folder it's already in (with
// the order fixed, that would do nothing), and a folder can't move into
// itself or anything under it. moveFolder refuses the latter as well; this is
// what keeps the highlight from offering it in the first place. Several rows
// can go wherever at least one of them would actually move — the rest are
// left where they are (see onDropOnTree).
function canDropInto(dragged: DraggedNode[], folderId: string | null): boolean {
	if (!dragged.some((node) => node.parentId !== folderId)) return false
	return folderId === null || dragged.every((node) => !node.blockedFolderIds.has(folderId))
}

// A Library asset is never in the tree to begin with, so it can go anywhere.
function isLibraryDrag(event: DragEvent): boolean {
	return !draggedNodes.value && !!event.dataTransfer?.types.includes(LIBRARY_DRAG_MIME)
}

// VS Code opens a collapsed folder once the pointer rests on it for a moment,
// so a drag can reach somewhere deeper without letting go first.
const AUTO_EXPAND_DELAY_MS = 500
let autoExpandFolderId: string | null = null
let autoExpandTimer: ReturnType<typeof setTimeout> | null = null

function scheduleAutoExpand(folderId: string | null) {
	if (folderId === autoExpandFolderId) return
	cancelAutoExpand()
	if (folderId === null || expandedFolderIds.value.includes(folderId)) return
	autoExpandFolderId = folderId
	autoExpandTimer = setTimeout(() => {
		autoExpandTimer = null
		ensureFolderExpanded(folderId)
	}, AUTO_EXPAND_DELAY_MS)
}

function cancelAutoExpand() {
	if (autoExpandTimer !== null) clearTimeout(autoExpandTimer)
	autoExpandTimer = null
	autoExpandFolderId = null
}

function endDrag() {
	cancelAutoExpand()
	draggedNodes.value = null
	dropTarget.value = null
}

onBeforeUnmount(cancelAutoExpand)

function toDraggedNode(item: TreeItem): DraggedNode {
	return {
		id: item.id,
		kind: item.kind,
		name: scriptName(item),
		parentId: item.parentId ?? null,
		blockedFolderIds: new Set(item.kind === 'folder' ? fileStore.folderAndDescendantIds(item.id) : []),
	}
}

function onDragStart(event: DragEvent, item: TreeItem) {
	if (!isDraggable(item)) return
	const selected = isInSelection(item)
		? treeSelectionStore.selectedKeys('files').map((id) => itemsById.value.get(id)).filter((selectedItem) => selectedItem !== undefined)
		: []
	const dragging = selected.length > 1 ? selected : [item]
	draggedNodes.value = dragging.map(toDraggedNode)

	if (!event.dataTransfer) return
	// Read back by the code editor, which inserts them on drop (see
	// CodeEditor.vue's onEditorDrop) — one name per line.
	event.dataTransfer.setData(FILE_TREE_DRAG_MIME, dragging.map(scriptName).join('\n'))
	event.dataTransfer.effectAllowed = 'move'
	if (dragging.length > 1) setCountDragImage(event.dataTransfer, dragging.length)
}

function onDragOverTree(event: DragEvent) {
	const dragged = draggedNodes.value
	const fromLibrary = isLibraryDrag(event)
	// Only rows dragged from this tree, or assets from the Library, are
	// accepted — not files dragged in from the OS, or text from elsewhere on
	// the page. Leaving dragover un-prevented is what gives those the
	// browser's no-drop cursor.
	if (!dragged && !fromLibrary) return

	const item = hoveredItem(event)
	const folderId = dropFolderFor(item)
	const allowed = fromLibrary || canDropInto(dragged!, folderId)

	scheduleAutoExpand(allowed && item?.kind === 'folder' ? item.id : null)
	setDropTarget(allowed ? { folderId } : null)
	if (!allowed) return

	event.preventDefault()
	if (event.dataTransfer) event.dataTransfer.dropEffect = fromLibrary ? 'copy' : 'move'
}

// dragleave also fires each time the pointer crosses from one element to
// another *inside* the tree; only leaving the container outright clears the
// target. relatedTarget is the element the pointer moved onto.
function onDragLeaveTree(event: DragEvent) {
	const container = event.currentTarget as HTMLElement
	if (event.relatedTarget instanceof Node && container.contains(event.relatedTarget)) return
	cancelAutoExpand()
	setDropTarget(null)
}

async function onDropOnTree(event: DragEvent) {
	const dragged = draggedNodes.value
	const fromLibrary = isLibraryDrag(event)
	const target = dropTarget.value
	endDrag()
	if ((!dragged && !fromLibrary) || !target) return
	event.preventDefault()

	if (fromLibrary) await addLibraryDrop(event.dataTransfer?.getData(LIBRARY_DRAG_MIME) ?? '', target.folderId)
	else await moveDropped(dragged!, target.folderId)

	// So the moved or added item is visible where it landed, even if the drop
	// went onto a folder's row without waiting for it to auto-expand.
	if (target.folderId !== null) ensureFolderExpanded(target.folderId)
}

// One at a time, so each move's nextPosition sees the one before it. A row
// that can't move (already there, or a folder whose name is taken there)
// doesn't stop the rest.
async function moveDropped(dragged: DraggedNode[], folderId: string | null) {
	for (const node of dragged) {
		if (node.parentId === folderId) continue

		// Folder names only have to be unique among siblings (files are unique
		// project-wide already, so moving one can't collide).
		const nameTaken = node.kind === 'folder'
			&& fileStore.childNodes(folderId).some((sibling) => sibling.kind === 'folder' && sibling.name === node.name)
		if (nameTaken) {
			window.alert(`A folder named "${node.name}" already exists there.`)
			continue
		}

		try {
			await moveDraggedTo(node, folderId)
		} catch (err) {
			window.alert(err instanceof Error ? err.message : `Failed to move "${node.name}"`)
		}
	}
}

// Same link the Library's own "Add to project" button makes, just into the
// folder they were dropped on — including its numbered-suffix answer to a
// name that's already taken. `paths` is one per line (several selected assets
// dragged together); added one at a time, like moveDropped, so each name
// check sees the links added before it.
async function addLibraryDrop(paths: string, folderId: string | null) {
	for (const path of paths.split('\n').filter(Boolean)) {
		const fileName = path.slice(path.lastIndexOf('/') + 1)
		try {
			await fileStore.addLibraryImage(path, fileStore.uniqueImageName(fileName), folderId)
		} catch (err) {
			window.alert(err instanceof Error ? err.message : `Failed to add "${fileName}" to the project`)
		}
	}
}
</script>

<template>
	<CollapsiblePane label="Files" icon="tabler:folder-filled">
	<div class="panel-wrapper">
		<div class="panel-bar">
			<!-- The sandbox's reset button takes the spacer's place: both are
			     there to balance the add button, keeping "Files" centered. -->
			<UTooltip v-if="!fileStore.projectId" text="Reset sandbox">
				<UButton icon="tabler:restore" variant="ghost" color="neutral" size="xs" @click="resetSandbox" />
			</UTooltip>
			<div v-else class="spacer"></div>

			<div>Files</div>

			<UDropdownMenu :items="folderMenuItems(null)" style="flex: 0 1 auto;">
				<UTooltip text="Add..." ignore-non-keyboard-focus>
					<UButton icon="tabler:plus" variant="ghost" color="neutral" size="xs" />
				</UTooltip>
			</UDropdownMenu>
		</div>

		<UContextMenu :items="folderMenuItems(null)">
			<div
				class="file-tree"
				:class="{ 'drop-target-root': dropTarget?.folderId === null }"
				@dragover="onDragOverTree"
				@dragleave="onDragLeaveTree"
				@drop="onDropOnTree"
			>
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
					:expanded="expandedFolderIds"
					@update:expanded="onUpdateExpanded"
					class="file-tree"
				>
					<template #item-leading="{ item, expanded }">
						<img v-if="item.thumbnail" :src="item.thumbnail" :title="item.typeLabel" class="thumbnail-icon" alt="" />
						<UIcon v-else-if="item.icon" :name="item.icon" :title="item.typeLabel" class="leading-icon" :class="itemStateClass(item)" />
						<UIcon v-else-if="item.kind === 'folder' || item.children?.length" :name="expanded ? 'tabler:folder-open-filled' : 'tabler:folder-filled'" class="leading-icon" />
					</template>

					<template #item-label="{ item }">
						<UContextMenu :items="itemMenuItems(item)" :content="{ onCloseAutoFocus: preventCloseAutoFocus }">
							<div
								class="tree-row-dnd"
								:ref="(el) => setRowDndRef(item, el)"
								:class="{
									'drop-target': dropTarget?.folderId === item.id,
									'renaming': renamingItemId === item.id,
									'in-selection': isInSelection(item),
									'viewing': viewedId === item.id,
								}"
								:draggable="isDraggable(item) && renamingItemId !== item.id"
								@dragstart="onDragStart($event, item)"
								@dragend="endDrag"
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
								:maxlength="MAX_FILE_NAME_LENGTH"
								@click.stop
								@mousedown.stop
								@keydown="onRenameKeydown($event, item)"
								@blur="commitRename(item)"
							/>
							<!-- Static, not part of renamingValue — the whole point is that
							     it can't be typed over or cleared, only re-derived from the
							     item's current name in commitRename. -->
							<span v-if="fileExtension(item)" class="rename-extension">.{{ fileExtension(item) }}</span>
						</div>
						<template v-else>
							<span :class="itemStateClass(item)">{{ item.label }}<span v-if="fileStore.isDirty(scriptName(item))" class="dirty-marker">*</span></span>
						</template>
					</template>

					<template #item-trailing="{ item }">
						<template v-if="renamingItemId !== item.id">
							<!-- A folder's own size is an aggregate over its
							     contents (see buildNode/folderSizeBytes), not
							     something intrinsic to the folder row itself —
							     shown the same way regardless, since the
							     distinction doesn't matter for what this column
							     is answering ("where is my space going"). -->
							<!-- Same Play/Stop as the Library's rows (and this row's
							     own menu), shown on hover — and for as long as it's
							     playing, so there's always a way to stop it. -->
							<div v-if="isSoundItem(item) && item.path" class="item-play" :class="{ playing: previewingAudioId === item.id }">
								<UTooltip :text="previewingAudioId === item.id ? 'Stop' : 'Play'">
									<UButton
										:icon="previewingAudioId === item.id ? 'tabler:player-stop-filled' : 'tabler:player-play-filled'"
										variant="soft"
										color="neutral"
										size="xs"
										@click.stop="toggleAudioPreview(item)"
									/>
								</UTooltip>
							</div>
							<span v-if="isSoundItem(item) && item.path && audioDuration(item.path) !== undefined" class="item-duration">{{ formatDuration(audioDuration(item.path)!) }}</span>
							<!-- A library link has no size of its own (it stores
							     nothing — see buildNode), so its chip takes the
							     size column's place instead of a meaningless "0 B".
							     Clicking it shows where the link points and who
							     made the asset. -->
							<UPopover v-if="item.kind === 'libraryImage'" :content="{ align: 'end' }">
								<button type="button" class="library-chip" :title="libraryChipTitle(item)" @click.stop>
									<UIcon name="tabler:link" class="library-chip-icon" />
								</button>

								<template #content>
									<LibraryCredit :attribution="item.attribution" :path="item.path" />
								</template>
							</UPopover>
							<span v-else class="item-size" :title="`${(item.size ?? 0).toLocaleString()} bytes`">{{ formatBytes(item.size ?? 0) }}</span>
							<div class="item-actions" @contextmenu="forwardRowContextMenu($event, item)">
								<UDropdownMenu
									:items="itemMenuItems(item)"
									:open="actionsMenuOpenKey === rowKey(item)"
									:content="{ onCloseAutoFocus: preventCloseAutoFocus }"
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
					</template>
				</UTree>
			</div>
		</UContextMenu>

		<!-- No project (guest sandbox) means no real quota to speak of at all
		     — everything's a localStorage blob, nothing ever gets uploaded to
		     Supabase/R2, so a "X / 10MB used" readout would just be showing a
		     number that doesn't apply here. -->
		<StorageIndicator v-if="fileStore.projectId" />
	</div>
	</CollapsiblePane>
</template>

<style scoped>
.file-tree {
	flex: 1 1 auto;
	min-height: 0;
	overflow-y: auto;
	background-color: var(--theme-bg-elevated);
	--drop-highlight: color-mix(in srgb, var(--theme-primary) 18%, transparent);
}

/* The UTree itself (it also carries .file-tree) — reached through :deep()
   because its root element doesn't get this component's scope attribute. A
   nested row's fill starts a small gap past its folder's guide line — Nuxt
   UI's `ps-1.5 -ms-px` on itemWithChildren — but a top-level row's would
   otherwise run right to the panel's edge. The same gap here lines the two
   up, and the matching one on the right stops every row's fill short of the
   panel's right edge by as much. */
.file-tree :deep(.file-tree[data-slot="root"]) {
	padding-inline: calc(0.375rem - 1px);
}

.spacer {
	width: 1.5em;
	flex: 0 1 auto;
}

.dirty-marker {
	/* Inherits from whichever of .item-state-error/.item-state-dirty is on
	   the wrapping span below — the marker only ever renders alongside one
	   of those two, so it always ends up the same color as the name next to it. */
	color: inherit;
	margin-left: 0.15em;
}

.item-state-dirty {
	color: var(--theme-warning);
}

.item-state-error {
	color: var(--theme-error);
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
   relative` rather than sized to the label text, so the drag handle covers
   the whole row — icon, whitespace, and trailing-button area
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

/* The drop highlight (see the Drag and drop section of the script). A folder
   target tints its <li>, which Nuxt UI renders around both the folder's own
   row and the nested list of everything under it, so the whole block lights
   up as one piece. The child combinators matter: every ancestor folder's <li>
   also contains the target row somewhere inside it, and would otherwise be
   tinted too. Translucent, so a selected row stays visible underneath. */
.file-tree :deep(li:has(> [data-slot="link"] .tree-row-dnd.drop-target)) {
	background-color: var(--drop-highlight);
	border-radius: 0.25rem;
}

/* Row highlights: a neutral fill for every selected file (see Multi-selection
   in the script), and a theme-colored one for the file open in the center
   panel (viewedId), which wins when a row is both. Drawn on the same ::before
   Nuxt UI paints its own selected fill on (bg-elevated — the same color as
   this tree's background, so it never shows here).

   Selection doesn't recolor the name: Nuxt UI's text-primary on the row Reka
   selects is undone, leaving it the same color as any other row, hover
   included. Unsaved/error colors are on the label itself, so they still show. */
.file-tree :deep([data-slot="link"]:has(.tree-row-dnd.in-selection))::before {
	background-color: var(--theme-bg-accented);
}

.file-tree :deep([data-slot="link"]:has(.tree-row-dnd.viewing))::before {
	background-color: color-mix(in srgb, var(--theme-primary) 25%, transparent);
}

.file-tree :deep([data-slot="link"][data-selected]) {
	color: inherit;
}

.file-tree :deep([data-slot="link"][data-selected]:hover) {
	color: var(--ui-text-highlighted);
}

/* The project root has no row of its own, so the whole tree is tinted. Both
   the outer container and the UTree inside it carry .file-tree, and the
   UTree's own opaque background would hide a tint on the outer one alone —
   so both get it, layered over (not replacing) their background color. */
.file-tree.drop-target-root,
.drop-target-root .file-tree {
	background-image: linear-gradient(var(--drop-highlight), var(--drop-highlight));
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

/* Deliberately the opposite priority from .item-actions beside it: this
   should give up space *before* the file name does, truncating and
   eventually vanishing at 0 width, while the name (data-slot="linkLabel",
   min-width: 0 below) stays fully visible until this has nothing left to
   give. flex-shrink: 999 against the label's default (1) is what creates
   that ordering — not a literal 999:1 split, but skewed enough that this
   absorbs essentially all of the available shrinkage first; the label only
   starts losing width once this is already at its own min-width: 0 floor
   and flexbox has nowhere else to take space from. flex-basis (rather than
   width) is what "vanishing" needs: a shrinking flex-basis heading toward 0
   naturally clips this element's own box to nothing, not just its text —
   width would only affect the text's rendering box, not how much of the
   overall shrinkage this item actually absorbs. text-overflow: ellipsis
   (not the default clip) gives the truncate-before-vanish step its own
   visual — a "12…" moment — before it disappears entirely, rather than
   jumping straight from full text to gone. Not right-aligned any more:
   that only made sense back when this had a fixed, protected width — a
   right-aligned ellipsis truncates from the wrong (left) edge, which isn't
   reliably supported the way trailing-edge truncation is. */
.item-size {
	flex-shrink: 999;
	flex-basis: 3.5em;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	font-size: 0.75em;
	color: var(--theme-text-toned);
	white-space: nowrap;
}

/* Shown on hover, or while its sound plays. In flow like .item-actions, and
   raised above .tree-row-dnd for the same reason. */
.item-play {
	position: relative;
	z-index: 1;
	flex-shrink: 0;
	display: none;
}

:deep([data-slot="link"]:hover) .item-play,
:deep([data-slot="link"]:focus-within) .item-play,
.item-play.playing {
	display: block;
}

/* Fixed width so durations line up down the list; 4ch fits "0:00"–"9:59". */
.item-duration {
	flex-shrink: 0;
	min-width: 4ch;
	text-align: right;
	font-size: 0.75em;
	font-variant-numeric: tabular-nums;
	color: var(--theme-text-toned);
	white-space: nowrap;
}

/* Marks a library link. Unlike .item-size it doesn't shrink away as the row
   narrows — it's the only thing distinguishing the row from an upload. A
   button, opening the link's credit, so it's raised above .tree-row-dnd like
   .item-actions. */
.library-chip {
	position: relative;
	z-index: 1;
	display: inline-flex;
	align-items: center;
	gap: 0.25em;
	flex-shrink: 0;
	padding: 0.1em 0.45em;
	font-size: 0.7em;
	white-space: nowrap;
	color: var(--theme-primary);
	background: none;
	border: 1px solid var(--theme-primary);
	border-radius: 0.4em;
	cursor: pointer;
}

.library-chip:hover,
.library-chip[data-state="open"] {
	background-color: color-mix(in srgb, var(--theme-primary) 15%, transparent);
}

.library-chip-icon {
	width: 1em;
	height: 1.15em;
	color: var(--theme-primary);
}

.library-label {
	transform: translateY(-1px);
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

/* The missing piece that made .item-size's own flex-shrink: 999 above a
   no-op: .item-size and .item-actions aren't siblings of linkLabel in one
   shared flex row — per Tree.vue (node_modules/@nuxt/ui), the #item-trailing
   slot they're rendered into is itself wrapped in a Nuxt UI-owned
   `<span data-slot="linkTrailing">`, which is what's actually adjacent to
   linkLabel in the outer .link row. That wrapper ships with no min-width or
   flex-shrink override of its own (just `ms-auto inline-flex gap-1.5
   items-center`), so at the *outer* level it sat at browser defaults —
   min-width: auto, flex-shrink: 1 — refusing to shrink below the natural
   width of its own contents no matter how tight the row got. With nothing
   ever asking linkTrailing to shrink, the inner item-size/item-actions
   priority split never had a chance to run, and 100% of the outer row's
   shrink pressure fell on linkLabel by default instead — the exact opposite
   of the intended order. min-width: 0 unblocks shrinking at all; flex-shrink:
   999 (matching .item-size's own value, same "absorb essentially all the
   shrinkage first" approximation) makes linkTrailing — and therefore
   item-size within it — give up space before linkLabel does, not
   simultaneously with it. */
/* :deep([data-slot="linkTrailing"]) {
	flex-shrink: 999;
	min-width: 0;
} */
</style>
