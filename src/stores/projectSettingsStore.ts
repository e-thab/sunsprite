import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'
import { supabase } from '@/assets/utils/supabase'
import type { Json } from '@/assets/utils/database.types'

// The object half of Json (see database.types.ts) — what a jsonb column
// actually round-trips. Deliberately this rather than Record<string, unknown>:
// `unknown` values aren't assignable to Json, so the blob would have to be
// cast on its way into the update, which is exactly the check worth keeping.
type JsonObject = { [key: string]: Json | undefined }

// Per-project preferences that travel with the project rather than the
// machine: autosave, auto-run, and the output panel's limits. Stored in
// projects.settings (a jsonb blob — see
// supabase/migrations/20260907000000_add_project_settings.sql) so opening the
// same project from another machine brings them along, unlike the editor's
// own chrome settings (see editorSettingsStore.ts, localStorage only).
//
// The guest sandbox has no project row to write to, so it falls back to
// localStorage under its own key. That keeps every one of these settings
// functional there rather than silently inert, which matters because the
// sandbox is the first thing a signed-out visitor sees.

const GUEST_STORAGE_KEY = 'sunsprite-guest-project-settings'

// How long to sit on a change before writing it. Every one of these settings
// is driven by a control the user can sweep continuously (a slider, a spinner's
// held-down arrow), and a write per intermediate value would be a request per
// frame. Long enough to collapse a sweep into one write, short enough that a
// deliberate change followed immediately by closing the tab still lands.
const WRITE_DEBOUNCE_MS = 500

export interface ProjectSettings {
    /** Save every dirty script automatically, on the interval below. */
    autosave: boolean
    /** Minutes between autosave passes. Only meaningful while `autosave` is on. */
    autosaveIntervalMinutes: number
    /** Re-run the game a moment after any script edit. */
    autoRun: boolean
    /** How many lines the output panel keeps before the oldest scroll off. */
    outputMaxLines: number
    /** Keep the output panel pinned to the newest line as messages arrive. */
    outputAutoScroll: boolean
}

export const PROJECT_SETTINGS_DEFAULTS: Readonly<ProjectSettings> = Object.freeze({
    autosave: true,
    autosaveIntervalMinutes: 5,
    autoRun: true,
    // Matches the item-pool size output.ts used to hardcode, so an untouched
    // project's output panel behaves exactly as it did before this was settable.
    outputMaxLines: 100,
    outputAutoScroll: true,
})

/** Fills in defaults for anything absent or the wrong type — see editorSettingsStore's own loadStored for why per-key. */
function coerce(stored: unknown): ProjectSettings {
    const settings = { ...PROJECT_SETTINGS_DEFAULTS }
    if (typeof stored !== 'object' || stored === null) return settings
    const raw = stored as Record<string, unknown>

    if (typeof raw.autosave === 'boolean') settings.autosave = raw.autosave
    if (typeof raw.autosaveIntervalMinutes === 'number' && Number.isFinite(raw.autosaveIntervalMinutes)) {
        settings.autosaveIntervalMinutes = raw.autosaveIntervalMinutes
    }
    if (typeof raw.autoRun === 'boolean') settings.autoRun = raw.autoRun
    if (typeof raw.outputMaxLines === 'number' && Number.isFinite(raw.outputMaxLines)) {
        settings.outputMaxLines = raw.outputMaxLines
    }
    if (typeof raw.outputAutoScroll === 'boolean') settings.outputAutoScroll = raw.outputAutoScroll

    return settings
}

export const useProjectSettingsStore = defineStore('projectSettings', () => {
    const settings = reactive<ProjectSettings>({ ...PROJECT_SETTINGS_DEFAULTS })

    // Which project these settings belong to, or null for the guest sandbox.
    // Also the guard that keeps a write from landing on the wrong row: a
    // debounced write checks this is still the project it was queued for.
    const projectId = ref<string | null>(null)

    // Everything the stored blob contained, including keys this build doesn't
    // know about. Writes merge onto this rather than replacing it, so a
    // setting added by a newer client (the game settings, for instance) isn't
    // destroyed by an older one saving something unrelated.
    let storedRaw: JsonObject = {}

    let writeTimer: ReturnType<typeof setTimeout> | null = null

    /**
     * Loads a project's saved settings — or the guest sandbox's, when `id` is
     * null. Called before the editor mounts (ProjectEditorView.vue for a real
     * project, EditorView.vue for the sandbox), so nothing downstream ever
     * sees the defaults flash past on the way to the real values.
     *
     * `raw` lets the caller hand over a `settings` blob it already fetched as
     * part of the row it needed anyway, rather than making this issue a second
     * round trip for a column that came back with the first one.
     */
    function hydrate(id: string | null, raw?: unknown) {
        cancelPendingWrite()
        projectId.value = id

        const source = id ? raw : readGuestStored()
        storedRaw = (typeof source === 'object' && source !== null) ? { ...source as JsonObject } : {}
        Object.assign(settings, coerce(storedRaw))
    }

    /**
     * Updates one setting and persists it. Write-through, matching how every
     * other per-project setting behaves (projectStore's setPublic/
     * setApiVersion) — there's no separate save step for settings.
     */
    function set<K extends keyof ProjectSettings>(key: K, value: ProjectSettings[K]) {
        if (settings[key] === value) return
        settings[key] = value
        storedRaw[key] = value
        schedulePersist()
    }

    function reset() {
        cancelPendingWrite()
        projectId.value = null
        storedRaw = {}
        Object.assign(settings, PROJECT_SETTINGS_DEFAULTS)
    }

    function schedulePersist() {
        cancelPendingWrite()
        const target = projectId.value
        const snapshot = { ...storedRaw }
        writeTimer = setTimeout(() => {
            writeTimer = null
            // The project may have been closed (or swapped) during the
            // debounce — writing then would either hit the wrong row or
            // resurrect settings for a project no longer open.
            if (projectId.value !== target) return
            void persist(target, snapshot)
        }, WRITE_DEBOUNCE_MS)
    }

    function cancelPendingWrite() {
        if (writeTimer) clearTimeout(writeTimer)
        writeTimer = null
    }

    async function persist(id: string | null, blob: JsonObject) {
        if (!id) {
            try {
                localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(blob))
            } catch (err) {
                console.error('Failed to save sandbox settings', err)
            }
            return
        }

        const { error } = await supabase.from('projects').update({ settings: blob }).eq('id', id)
        // Logged rather than surfaced: a settings write failing is worth
        // knowing about in the console, but it isn't worth interrupting what
        // the user was doing — the setting is already applied in this session
        // either way, and the next change retries the whole blob anyway.
        if (error) console.error('Failed to save project settings', error)
    }

    function readGuestStored(): unknown {
        try {
            const raw = localStorage.getItem(GUEST_STORAGE_KEY)
            return raw ? JSON.parse(raw) : null
        } catch {
            return null
        }
    }

    return { settings, projectId, hydrate, set, reset }
})
