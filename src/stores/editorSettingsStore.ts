import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'

// Editor-chrome preferences: how the code editor itself looks and behaves,
// independent of which project is open. Persisted to localStorage only —
// unlike the per-project settings (see projectSettingsStore.ts) these follow
// the machine rather than the project, the same way an editor's own
// preferences do everywhere else. That also means they work identically in
// the guest sandbox and in a signed-in project, with no account required.
//
// Applied live by CodeEditor.vue, which watches this store and pushes each
// change straight into the Monaco instance (and, for tab size, into every
// open model) rather than waiting for a remount.

const STORAGE_KEY = 'sunsprite-editor-settings'

export interface EditorSettings {
    /** Monaco's own fontSize, in px. */
    fontSize: number
    /** Wrap long lines rather than scrolling horizontally. */
    wordWrap: boolean
    /** Show the line-number gutter. */
    lineNumbers: boolean
    /** Width of a tab stop, in spaces. */
    tabSize: number
}

export const EDITOR_SETTINGS_DEFAULTS: Readonly<EditorSettings> = Object.freeze({
    // Matches what CodeEditor.vue's editorOptions used to hardcode, so the
    // out-of-the-box editor looks exactly as it did before this was settable.
    fontSize: 14,
    wordWrap: false,
    lineNumbers: true,
    tabSize: 4,
})

/**
 * Whatever was last saved, with anything missing or malformed falling back to
 * its default. Per-key rather than all-or-nothing: a stored blob written by
 * an older build (or hand-edited) is missing keys added since, and dropping
 * every setting because one is absent would be a worse failure than filling
 * that one in.
 */
function loadStored(): EditorSettings {
    const settings = { ...EDITOR_SETTINGS_DEFAULTS }

    let stored: unknown
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return settings
        stored = JSON.parse(raw)
    } catch {
        // Unparseable (or localStorage unavailable, e.g. a locked-down
        // browser context) — defaults are a perfectly good answer here, and
        // the next write will overwrite whatever's there.
        return settings
    }

    if (typeof stored !== 'object' || stored === null) return settings
    const raw = stored as Record<string, unknown>

    if (typeof raw.fontSize === 'number' && Number.isFinite(raw.fontSize)) settings.fontSize = raw.fontSize
    if (typeof raw.wordWrap === 'boolean') settings.wordWrap = raw.wordWrap
    if (typeof raw.lineNumbers === 'boolean') settings.lineNumbers = raw.lineNumbers
    if (typeof raw.tabSize === 'number' && Number.isFinite(raw.tabSize)) settings.tabSize = raw.tabSize

    return settings
}

export const useEditorSettingsStore = defineStore('editorSettings', () => {
    const settings = reactive<EditorSettings>(loadStored())

    // One deep watcher rather than a save call in every setter: every write
    // goes through the same reactive object, so there's no path that can
    // change a setting and forget to persist it.
    watch(settings, (current) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
        } catch (err) {
            console.error('Failed to save editor settings', err)
        }
    }, { deep: true })

    function reset() {
        Object.assign(settings, EDITOR_SETTINGS_DEFAULTS)
    }

    return { settings, reset }
})
