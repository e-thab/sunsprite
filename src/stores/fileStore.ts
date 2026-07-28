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
}

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
    const projectId = ref<string | null>(null)
    const projectName = ref<string | null>(null)
    const scripts = ref<ScriptRecord[]>([])

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

    // ---- Project (cloud) mode ----

    async function loadProject(id: string) {
        projectId.value = id
        scripts.value = []
        filesSavedThisSession.value = []
        dirtyFiles.value = new Set()

        const { data, error } = await supabase
            .from('scripts')
            .select('id, name, content, updated_at')
            .eq('project_id', id)
            .order('name')
        if (error) throw error

        if (data.length === 0) {
            await createScript('main.js', getExampleCode())
        } else {
            scripts.value = data.map((row) => ({
                id: row.id,
                name: row.name,
                content: row.content,
                saveTime: new Date(row.updated_at).toLocaleTimeString(),
            }))
        }
    }

    function exitProject() {
        projectId.value = null
        projectName.value = null
        scripts.value = []
        dirtyFiles.value = new Set()
    }

    function setProjectName(name: string) {
        projectName.value = name
    }

    async function createScript(name: string, content: string = '') {
        if (!projectId.value) throw new Error('No active project')

        const { data, error } = await supabase
            .from('scripts')
            .insert({ project_id: projectId.value, name, content })
            .select('id, name, content, updated_at')
            .single()
        if (error) throw error

        scripts.value.push({
            id: data.id,
            name: data.name,
            content: data.content,
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
    }
})