import { DEFAULT_SCRIPT_FILE_TYPE, joinFileName, MAIN_SCRIPT_BASE } from '@/assets/utils/fileTypes'
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
	// Only the pre-load placeholder — the first real tree render replaces it
	// with an actual node. Named off the registry rather than as a literal so
	// it can't claim a .js entry script in a project that has a .ts one.
	const current = ref<TreeItem | undefined>({
		label: joinFileName(MAIN_SCRIPT_BASE, DEFAULT_SCRIPT_FILE_TYPE.extension),
	})

	return { current }
})
