import { defineStore } from 'pinia'
import type * as monaco from 'monaco-editor'

// Where the user was in a project, so reopening it (or refreshing the page)
// lands them back there: which file was open, where each file was scrolled
// to (cursor and folds come along with Monaco's view state for free), and
// which folders were collapsed. Per project, with the guest sandbox as one
// more scope of its own, and per machine — localStorage only, never the
// project row, the same way an editor's open tabs aren't part of the code.
//
// Files and folders are keyed by record id rather than name, so a rename
// keeps its place. Undo history deliberately isn't here: it lives on the
// Monaco models themselves (see CodeEditor.vue) and only lasts the session.

const STORAGE_KEY_PREFIX = 'sunsprite-editor-state:'
const SANDBOX_SCOPE = 'sandbox'

// Scrolling fires a view-state change every frame, so writes wait for a pause.
// Anything still pending when the page goes away is flushed on pagehide.
const WRITE_DELAY_MS = 300

interface EditorState {
    activeFileId?: string
    // Collapsed rather than expanded: folders start open (see FileTree.vue), so
    // this way one that's new since the last visit opens the same as always.
    collapsedFolderIds: string[]
    viewStates: Record<string, monaco.editor.ICodeEditorViewState>
}

function storageKey(scope: string): string {
    return STORAGE_KEY_PREFIX + scope
}

function emptyState(): EditorState {
    return { collapsedFolderIds: [], viewStates: {} }
}

function loadStored(scope: string): EditorState {
    try {
        const raw = localStorage.getItem(storageKey(scope))
        if (!raw) return emptyState()
        const stored = JSON.parse(raw) as Partial<EditorState> | null
        if (typeof stored !== 'object' || stored === null) return emptyState()
        return {
            activeFileId: typeof stored.activeFileId === 'string' ? stored.activeFileId : undefined,
            collapsedFolderIds: Array.isArray(stored.collapsedFolderIds) ? stored.collapsedFolderIds : [],
            viewStates: typeof stored.viewStates === 'object' && stored.viewStates !== null ? stored.viewStates : {},
        }
    } catch {
        // Unparseable, or localStorage unavailable — starting from the top of
        // main is a fine fallback, and the next write replaces whatever's there.
        return emptyState()
    }
}

/** Drops a project's saved editor state — for when the project itself is deleted. */
export function forgetEditorState(projectId: string) {
    localStorage.removeItem(storageKey(projectId))
}

export const useEditorStateStore = defineStore('editorState', () => {
    // Set by open(), not read off fileStore.projectId as each call comes in:
    // leaving a project clears projectId before the editor finishes tearing
    // down, and a last scroll event in that gap would otherwise land in the
    // sandbox's state.
    let scope: string | null = null
    let state: EditorState = emptyState()
    let writeTimer: ReturnType<typeof setTimeout> | null = null

    function flush() {
        if (writeTimer) clearTimeout(writeTimer)
        writeTimer = null
        if (scope === null) return
        try {
            localStorage.setItem(storageKey(scope), JSON.stringify(state))
        } catch (err) {
            console.error('Failed to save editor state', err)
        }
    }

    function schedulePersist() {
        if (scope === null) return
        if (writeTimer) clearTimeout(writeTimer)
        writeTimer = setTimeout(flush, WRITE_DELAY_MS)
    }

    window.addEventListener('pagehide', () => {
        if (writeTimer) flush()
    })

    /** Switches to a project's state (null for the guest sandbox), saving whatever the last one had pending. */
    function open(projectId: string | null) {
        const next = projectId ?? SANDBOX_SCOPE
        if (next === scope) return
        if (writeTimer) flush()
        scope = next
        state = loadStored(next)
    }

    /**
     * Forgets everything saved for files and folders that no longer exist —
     * deleted here, or in another tab or on another machine since the last
     * visit. Only called with a fully loaded file list: pruning against a
     * project mid-load (or mid-exit) would throw away everything.
     */
    function prune(liveIds: Set<string>) {
        let changed = false
        for (const id of Object.keys(state.viewStates)) {
            if (liveIds.has(id)) continue
            delete state.viewStates[id]
            changed = true
        }
        const collapsed = state.collapsedFolderIds.filter((id) => liveIds.has(id))
        if (collapsed.length !== state.collapsedFolderIds.length) {
            state.collapsedFolderIds = collapsed
            changed = true
        }
        if (state.activeFileId && !liveIds.has(state.activeFileId)) {
            state.activeFileId = undefined
            changed = true
        }
        if (changed) schedulePersist()
    }

    function activeFileId(): string | undefined {
        return state.activeFileId
    }

    function setActiveFileId(id: string) {
        if (state.activeFileId === id) return
        state.activeFileId = id
        schedulePersist()
    }

    function viewState(fileId: string): monaco.editor.ICodeEditorViewState | undefined {
        return state.viewStates[fileId]
    }

    function setViewState(fileId: string, viewState: monaco.editor.ICodeEditorViewState) {
        state.viewStates[fileId] = viewState
        schedulePersist()
    }

    function collapsedFolderIds(): readonly string[] {
        return state.collapsedFolderIds
    }

    function setCollapsedFolderIds(ids: string[]) {
        state.collapsedFolderIds = ids
        schedulePersist()
    }

    /**
     * Guest sandbox only — wipes its saved state, for the sandbox reset. Stops
     * writing too, since the page reloads right after and nothing from the old
     * files should be put back in the meantime.
     */
    function clearGuestStored() {
        if (scope !== SANDBOX_SCOPE) return
        if (writeTimer) clearTimeout(writeTimer)
        writeTimer = null
        localStorage.removeItem(storageKey(SANDBOX_SCOPE))
        scope = null
        state = emptyState()
    }

    return { open, prune, activeFileId, setActiveFileId, viewState, setViewState, collapsedFolderIds, setCollapsedFolderIds, clearGuestStored }
})
