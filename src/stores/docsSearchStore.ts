import { defineStore } from "pinia";
import { ref } from "vue";

export const useDocsSearchStore = defineStore('docsSearch', () => {
    const isOpen = ref(false)

    function open() {
        isOpen.value = true
    }

    function close() {
        isOpen.value = false
    }

    function toggle() {
        isOpen.value = !isOpen.value
    }

    return { isOpen, open, close, toggle }
})
