import { defineStore } from "pinia"
import { ref } from "vue"

export interface NamePromptOptions {
    title: string
    /** Shown above the input — e.g. explaining an extension gets appended automatically. */
    description?: string
    initialValue?: string
    maxLength: number
    confirmLabel?: string
}

const DEFAULT_OPTIONS: NamePromptOptions = { title: '', maxLength: 40 }

// A promise-based, single-instance replacement for window.prompt(): one
// <NamePromptModal> is mounted globally (see App.vue) and reads this store's
// state, so any component can just `await namePromptStore.prompt({...})`
// without owning a modal instance (or open-state juggling) of its own —
// same shape as how useToast()'s single toast host works.
export const useNamePromptStore = defineStore('namePrompt', () => {
    const open = ref(false)
    const options = ref<NamePromptOptions>(DEFAULT_OPTIONS)
    const value = ref('')

    // Not a ref: a pending Promise's resolver is never read reactively,
    // only ever called once.
    let resolvePrompt: ((result: string | null) => void) | null = null

    function settle(result: string | null) {
        open.value = false
        resolvePrompt?.(result)
        resolvePrompt = null
    }

    function prompt(promptOptions: NamePromptOptions): Promise<string | null> {
        // A second prompt() while one's already pending resolves the first
        // as cancelled rather than leaving that caller's await hanging
        // forever — shouldn't happen in practice (one modal, one caller at a
        // time) but costs nothing to guard.
        settle(null)

        options.value = promptOptions
        value.value = promptOptions.initialValue ?? ''
        open.value = true

        return new Promise((resolve) => {
            resolvePrompt = resolve
        })
    }

    function confirm() {
        const typed = value.value.trim()
        settle(typed || null)
    }

    function cancel() {
        settle(null)
    }

    return { open, options, value, prompt, confirm, cancel }
})
