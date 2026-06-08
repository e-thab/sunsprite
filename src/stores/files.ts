import { defineStore } from "pinia";
import { ref } from "vue";

export const useFilesStore = defineStore('files', () => {
    const activeFileName = ref('main.js')

    function activate(fileName: string) {
        activeFileName.value = fileName
    }

    return { activeFileName, activate }
})