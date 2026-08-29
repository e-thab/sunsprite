import { defineStore } from 'pinia'
import { ref } from 'vue'
import { DEV_VERSION_AVAILABLE, latestApiVersion } from '@/assets/api/versions'
import { DEV_VERSION } from '@/assets/api/versions/constants'

// Which API version (see src/assets/api/versions/) the editor and the
// sandboxed game should use — DEV_VERSION ('dev') means the live source as it
// stands right now rather than a permanent snapshot; anything else names a
// permanent folder there. See DEFAULT_VERSION below for what a session starts
// on, which differs between dev and production builds.
// This ref itself is still session-local (no localStorage) — but it's no
// longer disconnected from persistence: ProjectEditorView.vue/PlayView.vue
// hydrate it from the loaded project's saved `api_version` column the moment
// the row resolves, and CodeEditor.vue's dropdown writes any *snapshot*
// selection straight through to that same column (projectStore.ts's
// setApiVersion) — picking 'dev' is the one exception, deliberately left
// unpersisted, since it names the live/moving source rather than a canonical
// pinned tier (and the projects_api_version_format check constraint only
// accepts numeric labels anyway).
// hostBridge.ts reads this ref directly (the same way it already reads
// fileStore/watchPanelStore) to build the sandbox iframe's URL and to decide
// whether a reload is needed before the next run. EditorView.vue and
// PlayView.vue both reset it on unmount, so a version loaded/picked for one
// project never leaks into whatever opens next.

// What a session starts on, and what reset() returns to. Production has no
// 'dev' row in the dropdown at all (see DEV_VERSION_AVAILABLE), so defaulting
// to it there would strand the guest sandbox on a version the UI can't show as
// selected or switch back to — it'd sit on a developer-facing label with
// nothing checked. Pinning it to the newest cut snapshot instead is the same
// thing every real project gets at creation (latestApiVersion(), see
// projectStore.ts's createProject), so the guest sandbox and a fresh project
// behave identically out of the box.
//
// Dev builds keep starting on 'dev': the whole reason that entry exists is
// that an API change in the working tree should be runnable without ceremony,
// and this ref is session-local — a snapshot default would mean re-picking
// 'dev' from the dropdown after every single reload.
//
// Evaluated once at module load rather than per call: latestApiVersion() reads
// import.meta.glob's key set, which is fixed at build time.
const DEFAULT_VERSION = DEV_VERSION_AVAILABLE ? DEV_VERSION : latestApiVersion()

export const useApiVersionStore = defineStore('apiVersion', () => {
    const selectedVersion = ref<string>(DEFAULT_VERSION)

    /**
     * What a just-loaded project runs on, given the tier it's pinned to in its
     * own `api_version` column. Called by ProjectEditorView.vue and
     * PlayView.vue the moment their row resolves, before anything downstream
     * mounts.
     *
     * Production honors the pin exactly — that's the whole point of the
     * column. A dev build deliberately overrides it and runs the live source
     * instead: while the API itself is what's being worked on, opening a
     * project to check a change should exercise the working tree, not a frozen
     * copy of it, and requiring a dropdown pick on every project open (and
     * every reload — this ref is session-local) would make that ceremony the
     * default path.
     *
     * Nothing is written back either way: the pin is only ever persisted by an
     * explicit dropdown selection (CodeEditor.vue's selectApiVersion), so
     * running a project on dev locally can't quietly re-pin it. Its real
     * version is still visible in ProjectsView's project list, and picking it
     * from the dropdown gets this session back onto it.
     */
    function hydrateFromProject(savedVersion: string) {
        selectedVersion.value = DEV_VERSION_AVAILABLE ? DEV_VERSION : savedVersion
    }

    function reset() {
        selectedVersion.value = DEFAULT_VERSION
    }

    return { selectedVersion, hydrateFromProject, reset }
})
