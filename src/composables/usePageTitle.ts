import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useFileStore } from '@/stores/fileStore'
import { nodesByPath } from '@/assets/docs/docsIndex'

/**
 * The contextual title for whichever page is current — a loaded project's
 * name takes priority (there's nothing more specific to show), otherwise
 * each route maps to its own short, human label. Shared by NavBar.vue's
 * center-bar label and the browser tab title (see App.vue) so the two can
 * never drift apart.
 */
export function usePageTitle() {
    const route = useRoute()
    const fileStore = useFileStore()

    return computed(() => {
        if (fileStore.projectId && fileStore.projectName) return fileStore.projectName

        switch (route.name) {
            case 'home': return 'Home'
            case 'sandbox': return 'Sandbox'
            case 'account': return 'Account'
            case 'projects': return 'My Projects'
            case 'docs': {
                const raw = route.params.pathMatch
                const path = Array.isArray(raw) ? raw.join('/') : (raw ?? '')
                return nodesByPath.get(path)?.title ?? 'Docs'
            }
            case 'docs-search': return 'Search Docs'
            case 'not-found': return 'Page Not Found'
            default: return ''
        }
    })
}
