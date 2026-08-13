import { defineStore } from "pinia";
import { ref } from "vue";

const STORAGE_KEY = 'sunsprite-docs-open'

export const useDocsStore = defineStore('docs', () => {
    const isOpen = ref(localStorage.getItem(STORAGE_KEY) === 'true')

    function persist() {
        localStorage.setItem(STORAGE_KEY, String(isOpen.value))
    }

    function open() {
        isOpen.value = true
        persist()
    }

    function close() {
        isOpen.value = false
        persist()
    }

    function toggle() {
        isOpen.value = !isOpen.value
        persist()
    }

    return { isOpen, open, close, toggle }
})
