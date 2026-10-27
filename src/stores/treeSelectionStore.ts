import { DEFAULT_SCRIPT_FILE_TYPE, joinFileName, MAIN_SCRIPT_BASE } from '@/utils/fileTypes'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { TreeItem } from '@nuxt/ui'

// Which tree a multi-selection belongs to. FileTree's rows are identified by
// `id` (the record's), AssetLibrary's by `key` (the asset's path) — see
// ownerOf, the one place that relies on that.
export type SelectionOwner = 'files' | 'library'

export type TreeSelection = {
	owner: SelectionOwner
	keys: string[]
	// The last row clicked without Shift — where a Shift-click's range starts.
	anchor: string | null
}

// What a select event's own click (or key press) asks for: Shift extends a
// range, Ctrl/Cmd adds or removes one row, anything else is a plain select.
export function selectModifier(event: CustomEvent<{ originalEvent?: Event }>): 'range' | 'toggle' | null {
	const original = event.detail?.originalEvent
	if (!(original instanceof MouseEvent || original instanceof KeyboardEvent)) return null
	if (original.shiftKey) return 'range'
	if (original.ctrlKey || original.metaKey) return 'toggle'
	return null
}

// Takes the row's id and key rather than the row: passing `current.value`
// (an unwrapped TreeItem) as a TreeItem is too deep a comparison for tsc.
function ownerOf(id: string | undefined, key: string | undefined): SelectionOwner | null {
	if (id) return 'files'
	if (key) return 'library'
	return null
}

// Shared by FileTree and AssetLibrary: both bind their UTree's v-model
// directly to `current`, so only one row is ever selected between the two
// trees combined — Reka UI's own selection/toggle logic (matching items by
// label) naturally becomes cross-tree-aware once they're reading and
// writing the same ref, with no manual "clear the other tree" plumbing
// needed. EditorView watches `current` to drive the image preview: any
// selection with a `thumbnail`/`path` opens it, anything else (a script, or
// nothing) closes it.
//
// ---- Multi-selection ----
//
// Explorer-style, in either tree: Ctrl/Cmd-click adds or removes one row,
// Shift-click selects every row shown between the anchor and this one. The
// selected rows drag together (see each tree's onDragStart). `selection` is
// one tree's at a time, which is what makes the two mutually exclusive: a
// Ctrl- or Shift-click in the other tree starts that tree's selection over
// from the row clicked, leaving nothing selected in this one.
//
// The UTrees stay single-select. Reka's own `multiple` mode would turn
// `current` into an array — which the editor follows — and has no Shift/Ctrl
// click handling anyway. So `current` stays the one row a plain click
// selected, and `selection` layers the rest on top.
//
// Any change to `current` made outside this store — a plain click in either
// tree, the editor switching scripts — collapses the selection back to just
// that row.
export const useTreeSelectionStore = defineStore('treeSelection', () => {
	// Only the pre-load placeholder — the first real tree render replaces it
	// with an actual node. Named off the registry rather than as a literal so
	// it can't claim a .js entry script in a project that has a .ts one.
	const current = ref<TreeItem | undefined>({
		label: joinFileName(MAIN_SCRIPT_BASE, DEFAULT_SCRIPT_FILE_TYPE.extension),
	})

	const selection = ref<TreeSelection>({ owner: 'files', keys: [], anchor: null })

	let clearingCurrent = false

	// Sync, so it runs inside clearCurrent below while clearingCurrent is still set.
	watch(current, (item) => {
		if (clearingCurrent) return
		const owner = ownerOf(item?.id, item?.key)
		const key = item?.id ?? item?.key ?? null
		selection.value = owner && key
			? { owner, keys: [key], anchor: key }
			: { owner: 'files', keys: [], anchor: null }
	}, { immediate: true, flush: 'sync' })

	function clearCurrent() {
		clearingCurrent = true
		current.value = undefined
		clearingCurrent = false
	}

	// `current` only stays while it's one of the selected rows; anything else
	// (a row just deselected, or one in the other tree) would leave a row
	// highlighted that a drag wouldn't take.
	function dropCurrentUnlessSelected() {
		const item = current.value
		if (!item) return
		const key = item.id ?? item.key
		if (ownerOf(item.id, item.key) !== selection.value.owner || !selection.value.keys.includes(key)) clearCurrent()
	}

	function selectedKeys(owner: SelectionOwner): string[] {
		return selection.value.owner === owner ? selection.value.keys : []
	}

	function isSelected(owner: SelectionOwner, key: string): boolean {
		return selectedKeys(owner).includes(key)
	}

	function toggle(owner: SelectionOwner, key: string) {
		const keys = selectedKeys(owner)
		selection.value = {
			owner,
			keys: keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key],
			anchor: key,
		}
		dropCurrentUnlessSelected()
	}

	// `order` is the tree's selectable rows as they're shown, skipping the
	// contents of closed folders — a range is what's visibly between the two
	// rows, nothing hidden.
	function selectRange(owner: SelectionOwner, key: string, order: string[]) {
		const end = order.indexOf(key)
		const anchor = selection.value.owner === owner && selection.value.anchor !== null
			? order.indexOf(selection.value.anchor)
			: -1
		// No anchor in this tree (or it's since been hidden or deleted): the
		// range is just this row, which then anchors the next one.
		selection.value = anchor === -1
			? { owner, keys: [key], anchor: key }
			: { owner, keys: order.slice(Math.min(anchor, end), Math.max(anchor, end) + 1), anchor: selection.value.anchor }
		dropCurrentUnlessSelected()
	}

	return { current, selection, selectedKeys, isSelected, toggle, selectRange }
})
