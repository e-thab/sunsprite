import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { supabase } from "@/assets/utils/supabase";
import { getExampleCode } from "@/assets/api/examples";

type codeSaveData = {
    fileName: string
    content: string
    saveTime: string
}

type ScriptRecord = {
    id: string
    name: string
    content: string
    saveTime: string
    folderId: string | null
    position: number
}

type FolderRecord = {
    id: string
    name: string
    parentId: string | null
    position: number
}

// A folder/script blended and sorted by position, for rendering one ordered
// list per tree level regardless of which kind each row is.
export type TreeNode =
    | { kind: 'folder', id: string, name: string, position: number }
    | { kind: 'script', id: string, name: string, position: number }

export const useFileStore = defineStore('files', () => {
    const activeFileName = ref('main.js')
    const filesSavedThisSession = ref<string[]>([])

    // Files are only persisted (localStorage/Supabase) on an explicit save —
    // navigating between scripts just keeps editing the in-memory Monaco
    // model. This tracks which script names currently differ from their
    // last-saved content, purely by name (CodeEditor.vue is the one that
    // actually knows the live content, via markDirty/markClean).
    const dirtyFiles = ref<Set<string>>(new Set())
    const activeFileIsSaved = computed(() => !dirtyFiles.value.has(activeFileName.value))
    const hasUnsavedChanges = computed(() => dirtyFiles.value.size > 0)

    function isDirty(fileName: string): boolean {
        return dirtyFiles.value.has(fileName)
    }

    function markDirty(fileName: string) {
        if (dirtyFiles.value.has(fileName)) return
        dirtyFiles.value = new Set(dirtyFiles.value).add(fileName)
    }

    function markClean(fileName: string) {
        if (!dirtyFiles.value.has(fileName)) return
        const next = new Set(dirtyFiles.value)
        next.delete(fileName)
        dirtyFiles.value = next
    }

    // CodeEditor.vue owns the live Monaco models (fileStore doesn't know
    // script content beyond what's already saved), so "save everything" has
    // to be delegated to whichever CodeEditor instance is currently mounted.
    // NavBar's save-all button lives outside the editor route entirely, so a
    // store-level handoff is the only way for it to reach the editor.
    let saveAllHandler: (() => Promise<void>) | null = null

    function registerSaveAllHandler(handler: (() => Promise<void>) | null) {
        saveAllHandler = handler
    }

    async function saveAll() {
        await saveAllHandler?.()
    }

    // Project (cloud) mode: when projectId is set, getLocalCode/saveCode/etc.
    // read and write `scripts` (backed by Supabase) instead of localStorage.
    // Folders are purely an organizational layer for the tree UI — a
    // script's `name` stays the single, project-wide-unique identifier used
    // everywhere else (imports, Monaco models, activeFileName); folder_id
    // only determines where it's shown.
    const projectId = ref<string | null>(null)
    const projectName = ref<string | null>(null)
    const scripts = ref<ScriptRecord[]>([])
    const folders = ref<FolderRecord[]>([])

    function clear() {
        // Debugging
        // localStorage.removeItem('main.js')
        // localStorage.removeItem('sprites.js')
        // localStorage.removeItem('rectangles.js')
        // localStorage.removeItem('lines.js')
        // localStorage.removeItem('labels.js')
    }

    function activate(fileName: string) {
        activeFileName.value = fileName
    }

    function savedThisSession(fileName: string): boolean {
        return filesSavedThisSession.value.includes(fileName)
    }

    function getSaveData(fileName: string): codeSaveData | undefined {
        const localData = localStorage.getItem(fileName)
        return localData ? JSON.parse(localData) : undefined //{ fileName: '', content: '', saveTime: '' }
    }

    function findScript(fileName: string): ScriptRecord | undefined {
        return scripts.value.find((script) => script.name === fileName)
    }

    function getLocalCode(fileName: string): string | undefined {
        if (projectId.value) return findScript(fileName)?.content
        return getSaveData(fileName)?.content
    }

    function getTimeSaved(fileName: string): string | undefined {
        if (projectId.value) return findScript(fileName)?.saveTime
        return getSaveData(fileName)?.saveTime
    }

    // function getTimeSinceSaved(fileName: string): string | undefined {
    //     const saveData = getSaveData(fileName)?.saveTime
    // }

    function saveCode(fileName: string, content: string) {
        if (getLocalCode(fileName) === content) {
            markClean(fileName)
            return
        }

        const saveTime = new Date().toLocaleTimeString()

        if (projectId.value) {
            const script = findScript(fileName)
            if (!script) return

            script.content = content
            script.saveTime = saveTime
            supabase.from('scripts').update({ content }).eq('id', script.id).then(({ error }) => {
                if (error) console.error(`Failed to save script "${fileName}"`, error)
            })
        } else {
            const saveData: codeSaveData = { fileName, content, saveTime }
            localStorage.setItem(fileName, JSON.stringify(saveData))
        }

        if (!savedThisSession(fileName)) filesSavedThisSession.value.push(fileName)
        markClean(fileName)
    }

    // ---- Folders ----

    function childNodes(folderId: string | null): TreeNode[] {
        const subfolders: TreeNode[] = folders.value
            .filter((f) => f.parentId === folderId)
            .map((f) => ({ kind: 'folder' as const, id: f.id, name: f.name, position: f.position }))
        const containedScripts: TreeNode[] = scripts.value
            .filter((s) => s.folderId === folderId)
            .map((s) => ({ kind: 'script' as const, id: s.id, name: s.name, position: s.position }))
        return [...subfolders, ...containedScripts].sort((a, b) => a.position - b.position)
    }

    // Appends after the current last sibling (folders and scripts share one
    // position sequence per parent, so newly added items — whichever kind —
    // land at the end of what's already there).
    function nextPosition(folderId: string | null): number {
        const siblings = childNodes(folderId)
        if (siblings.length === 0) return 0
        return Math.max(...siblings.map((s) => s.position)) + 1
    }

    // A folder's id plus every descendant folder's id — used both to prune
    // in-memory state on delete (the DB already cascades) and to guard
    // against dropping a folder into its own subtree.
    function folderAndDescendantIds(id: string): string[] {
        const ids = [id]
        for (const child of folders.value.filter((f) => f.parentId === id)) {
            ids.push(...folderAndDescendantIds(child.id))
        }
        return ids
    }

    // Exposed so components can warn/guard before deleting a folder (e.g.
    // "can't delete the last script in a project") without duplicating the
    // descendant-walk here.
    function scriptsUnderFolder(id: string): ScriptRecord[] {
        const ids = new Set(folderAndDescendantIds(id))
        return scripts.value.filter((s) => s.folderId !== null && ids.has(s.folderId))
    }

    async function createFolder(name: string, parentId: string | null = null): Promise<string> {
        if (!projectId.value) throw new Error('No active project')

        const position = nextPosition(parentId)
        const { data, error } = await supabase
            .from('folders')
            .insert({ project_id: projectId.value, parent_id: parentId, name, position })
            .select('id, name, parent_id, position')
            .single()
        if (error) throw error

        folders.value.push({ id: data.id, name: data.name, parentId: data.parent_id, position: data.position })
        return data.id
    }

    async function renameFolder(id: string, newName: string) {
        const folder = folders.value.find((f) => f.id === id)
        if (!folder) throw new Error('Folder not found')

        const { error } = await supabase.from('folders').update({ name: newName }).eq('id', id)
        if (error) throw error

        folder.name = newName
    }

    async function deleteFolder(id: string) {
        const removedFolderIds = new Set(folderAndDescendantIds(id))

        const { error } = await supabase.from('folders').delete().eq('id', id)
        if (error) throw error

        folders.value = folders.value.filter((f) => !removedFolderIds.has(f.id))
        scripts.value = scripts.value.filter((s) => !(s.folderId !== null && removedFolderIds.has(s.folderId)))
    }

    // Reparent/reorder a script — the drag-drop target's folder (null for
    // project root) and its new position among that folder's other items.
    async function moveScript(id: string, folderId: string | null, position: number) {
        const script = scripts.value.find((s) => s.id === id)
        if (!script) return

        const { error } = await supabase.from('scripts').update({ folder_id: folderId, position }).eq('id', id)
        if (error) throw error

        script.folderId = folderId
        script.position = position
    }

    async function moveFolder(id: string, parentId: string | null, position: number) {
        const folder = folders.value.find((f) => f.id === id)
        if (!folder) return
        // Refuse to drop a folder into itself or one of its own descendants
        // — the DB's FK doesn't prevent that cycle, so it has to be caught
        // here before the update round-trips.
        if (parentId !== null && (id === parentId || folderAndDescendantIds(id).includes(parentId))) return

        const { error } = await supabase.from('folders').update({ parent_id: parentId, position }).eq('id', id)
        if (error) throw error

        folder.parentId = parentId
        folder.position = position
    }

    // ---- Project (cloud) mode ----

    async function loadProject(id: string) {
        projectId.value = id
        scripts.value = []
        folders.value = []
        filesSavedThisSession.value = []
        dirtyFiles.value = new Set()

        const [{ data: folderRows, error: folderError }, { data: scriptRows, error: scriptError }] = await Promise.all([
            supabase.from('folders').select('id, name, parent_id, position').eq('project_id', id).order('position'),
            supabase.from('scripts').select('id, name, content, folder_id, position, updated_at').eq('project_id', id).order('position'),
        ])
        if (folderError) throw folderError
        if (scriptError) throw scriptError

        if (folderRows.length === 0 && scriptRows.length === 0) {
            const scriptsFolderId = await createFolder('scripts')
            await createScript('main.js', getExampleCode(), scriptsFolderId)
        } else {
            folders.value = folderRows.map((row) => ({
                id: row.id,
                name: row.name,
                parentId: row.parent_id,
                position: row.position,
            }))
            scripts.value = scriptRows.map((row) => ({
                id: row.id,
                name: row.name,
                content: row.content,
                folderId: row.folder_id,
                position: row.position,
                saveTime: new Date(row.updated_at).toLocaleTimeString(),
            }))
        }
    }

    function exitProject() {
        projectId.value = null
        projectName.value = null
        scripts.value = []
        folders.value = []
        dirtyFiles.value = new Set()
    }

    function setProjectName(name: string) {
        projectName.value = name
    }

    async function createScript(name: string, content: string = '', folderId: string | null = null) {
        if (!projectId.value) throw new Error('No active project')

        const position = nextPosition(folderId)
        const { data, error } = await supabase
            .from('scripts')
            .insert({ project_id: projectId.value, name, content, folder_id: folderId, position })
            .select('id, name, content, folder_id, position, updated_at')
            .single()
        if (error) throw error

        scripts.value.push({
            id: data.id,
            name: data.name,
            content: data.content,
            folderId: data.folder_id,
            position: data.position,
            saveTime: new Date(data.updated_at).toLocaleTimeString(),
        })
    }

    async function renameScript(oldName: string, newName: string) {
        const script = findScript(oldName)
        if (!script) throw new Error(`Script "${oldName}" not found`)

        const { error } = await supabase.from('scripts').update({ name: newName }).eq('id', script.id)
        if (error) throw error

        script.name = newName
        if (activeFileName.value === oldName) activeFileName.value = newName
        if (isDirty(oldName)) {
            markClean(oldName)
            markDirty(newName)
        }
    }

    async function deleteScript(name: string) {
        const script = findScript(name)
        if (!script) return

        const { error } = await supabase.from('scripts').delete().eq('id', script.id)
        if (error) throw error

        scripts.value = scripts.value.filter((s) => s.id !== script.id)
        markClean(name)
    }

    return {
        activeFileName,
        activeFileIsSaved,
        hasUnsavedChanges,
        projectId,
        projectName,
        scripts,
        folders,
        activate,
        savedThisSession,
        getLocalCode,
        getTimeSaved,
        saveCode,
        isDirty,
        markDirty,
        markClean,
        registerSaveAllHandler,
        saveAll,
        loadProject,
        setProjectName,
        exitProject,
        createScript,
        renameScript,
        deleteScript,
        childNodes,
        nextPosition,
        folderAndDescendantIds,
        scriptsUnderFolder,
        createFolder,
        renameFolder,
        deleteFolder,
        moveScript,
        moveFolder,
    }
})
