import { defineStore } from 'pinia'
import { ref } from 'vue'

// Which permanent API version (see src/assets/api/versions/) the editor and
// the sandboxed game should use — 'latest' means the live, unversioned engine.
// This ref itself is still session-local (no localStorage) — but it's no
// longer disconnected from persistence: ProjectEditorView.vue/PlayView.vue
// hydrate it from the loaded project's saved `api_version` column the moment
// the row resolves, and CodeEditor.vue's dropdown writes any *real* selection
// straight through to that same column (projectStore.ts's setApiVersion) —
// picking 'latest' is the one exception, deliberately left unpersisted, since
// it names the live/moving source rather than a canonical pinned tier.
// hostBridge.ts reads this ref directly (the same way it already reads
// fileStore/watchPanelStore) to build the sandbox iframe's URL and to decide
// whether a reload is needed before the next run. EditorView.vue and
// PlayView.vue both reset it to 'latest' on unmount, so a version
// loaded/picked for one project never leaks into whatever opens next.
export const useApiVersionStore = defineStore('apiVersion', () => {
    const selectedVersion = ref<string>('latest')

    function reset() {
        selectedVersion.value = 'latest'
    }

    return { selectedVersion, reset }
})
