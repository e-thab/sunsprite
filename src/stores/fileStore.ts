import { defineStore } from "pinia";
import { ref } from "vue";

type codeSaveData = {
    fileName: string
    content: string
    saveTime: string
}

export const useFileStore = defineStore('files', () => {
    const activeFileName = ref('main.js')
    const filesSavedThisSession = ref<string[]>([])

    function activate(fileName: string) {
        activeFileName.value = fileName

        // localStorage.removeItem('main.js')
        // localStorage.removeItem('sprites.js')
        // localStorage.removeItem('rectangles.js')
        // localStorage.removeItem('lines.js')
        // localStorage.removeItem('labels.js')
    }

    function savedThisSession(fileName: string): boolean {
        return filesSavedThisSession.value.includes(fileName)
    }

    function getSaveData(fileName: string): codeSaveData | undefined {
        const localData = localStorage.getItem(fileName)
        return localData ? JSON.parse(localData) : undefined //{ fileName: '', content: '', saveTime: '' }
    }

    function getLocalCode(fileName: string): string | undefined {
        return getSaveData(fileName)?.content
    }

    function getTimeSaved(fileName: string): string | undefined {
        console.log(getSaveData(fileName)?.saveTime)
        return getSaveData(fileName)?.saveTime
    }

    function saveCode(fileName: string, content: string) {
        const saveTime = new Date().toLocaleTimeString()
        const saveData: codeSaveData = { fileName, content, saveTime }
        if (getLocalCode(fileName) === content) return

        localStorage.setItem(fileName, JSON.stringify(saveData))
        if (!savedThisSession(fileName)) filesSavedThisSession.value.push(fileName)
    }

    return { activeFileName, activate, savedThisSession, getLocalCode, getTimeSaved, saveCode }
})