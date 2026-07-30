import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TreeItem } from '@nuxt/ui'

// Shared by FileTree and AssetLibrary: both bind their UTree's v-model
// directly to `current`, so only one row is ever selected between the two
// trees combined — Reka UI's own selection/toggle logic (matching items by
// label) naturally becomes cross-tree-aware once they're reading and
// writing the same ref, with no manual "clear the other tree" plumbing
// needed. EditorView watches `current` to drive the image preview: any
// selection with a `thumbnail`/`path` opens it, anything else (a script, or
// nothing) closes it.
export const useTreeSelectionStore = defineStore('treeSelection', () => {
	const current = ref<TreeItem | undefined>({
		label: 'main.js',
	})

	return { current }
})
