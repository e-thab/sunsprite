import { defineStore } from "pinia";
import { ref } from "vue";
import { supabase } from "@/assets/utils/supabase";
import { useAuthStore } from "./authStore";
import { generateSlug } from "@/assets/utils/slugWords";
import { latestApiVersion } from "@/assets/api/versions";
export type ProjectRecord = {
    id: string
    name: string
    slug: string
    isPublic: boolean
    apiVersion: string
    createdAt: string
    updatedAt: string
}

export type StorageUsage = {
    textBytes: number
    imageBytes: number
    /** Always 0 today — no sound-file storage exists in the data model yet. Kept as its own field so a real one slots in later without reshaping every caller. */
    soundBytes: number
}

// The single source of truth lives on the server side deliberately, not
// here: r2-sign-upload/r2-confirm-upload actually *enforce* this cap (see
// their own currentTotal checks there), so a client-side copy of the number
// would just be a second, driftable value that happens to agree with the
// real one today — exactly the "conflicting references" problem this
// re-export replaces (this file used to hardcode its own 10MB, independent
// of the edge functions' then-100MB, images-only figure). Reaching into
// supabase/functions/ from src/ is a one-directional, Vite-only import —
// nothing about how the edge functions themselves resolve imports changes,
// so this can't affect their deployment.
export { MAX_PROJECT_SIZE as PROJECT_STORAGE_QUOTA_BYTES } from "../../supabase/functions/_shared/uploadLimits.ts"

// Same reasoning as PROJECT_STORAGE_QUOTA_BYTES above, one tier up — the
// account-wide cap across every project a user owns, actually enforced
// server-side alongside the per-project one (see r2-sign-upload/
// r2-confirm-upload's own accountTotal checks), not just a client-side
// number. ProjectsView.vue sums storageByProject's own values (already
// fetched for the per-project bars) to compare against this.
export { MAX_ACCOUNT_SIZE as ACCOUNT_STORAGE_QUOTA_BYTES } from "../../supabase/functions/_shared/uploadLimits.ts"

const MAX_SLUG_ATTEMPTS = 32

// A generous cap, not a technical constraint — see MAX_FILE_NAME_LENGTH in
// fileTypes.ts for the equivalent on scripts/folders/images/text files.
// Kept as its own constant rather than shared with that one: same current
// value, but an unrelated data model (Supabase `projects`, not the file
// tree), free to diverge later.
export const MAX_PROJECT_NAME_LENGTH = 40

export const useProjectStore = defineStore('projects', () => {
    const projects = ref<ProjectRecord[]>([])
    const loading = ref(false)
    const storageByProject = ref<Map<string, StorageUsage>>(new Map())

    async function fetchProjects() {
        const authStore = useAuthStore()
        if (!authStore.user) {
            projects.value = []
            return
        }

        loading.value = true
        try {
            // Explicit owner filter, not just an RLS-shaped assumption: since
            // the is_public policies (see supabase/migrations) additionally
            // let this user read *anyone's* public project rows — required
            // for /play/:slug — a bare select() here would return this
            // user's own projects unioned with every public project on the
            // site, not "my projects."
            const { data, error } = await supabase
                .from('projects')
                .select('id, name, slug, is_public, api_version, created_at, updated_at')
                .eq('owner_id', authStore.user.id)
                .order('updated_at', { ascending: false })
            if (error) throw error

            projects.value = (data ?? []).map((row) => ({
                id: row.id,
                name: row.name,
                slug: row.slug,
                isPublic: row.is_public,
                apiVersion: row.api_version,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            }))
        } finally {
            loading.value = false
        }
    }

    /**
     * Real byte usage per project (scripts + text_files content, images'
     * stored `size`), for ProjectsView.vue's storage donut. Called after
     * fetchProjects() — needs this user's own project ids up front and
     * explicitly filters on them, the same reason fetchProjects() itself
     * doesn't do a bare select(): scripts/text_files/images all carry the
     * same "anyone can view rows in a *public* project" policies projects
     * itself does (see supabase/migrations), so an unfiltered select() here
     * would pull in every public project's rows site-wide, not just this
     * user's own.
     *
     * Text content is measured in real bytes (TextEncoder), not JS string
     * length (UTF-16 code units) or Postgres char_length — none of those
     * agree once content has any non-ASCII character, and images' own `size`
     * column is already a real byte count, so text needs to match that unit
     * for the combined total to mean anything.
     *
     * No new migration/RPC for this first pass: it fetches full script/text
     * content just to measure it, which is real but currently small waste —
     * scripts are typically tiny game code and this product's actual data
     * volume today is small. Worth revisiting (a view exposing octet_length
     * directly, or an RPC) if projects start carrying near the 1MB-per-file
     * text cap for real.
     */
    async function fetchStorageUsage() {
        if (projects.value.length === 0) {
            storageByProject.value = new Map()
            return
        }

        const projectIds = projects.value.map((p) => p.id)

        const [scriptsRes, textFilesRes, imagesRes] = await Promise.all([
            supabase.from('scripts').select('project_id, content').in('project_id', projectIds),
            supabase.from('text_files').select('project_id, content').in('project_id', projectIds),
            supabase.from('images').select('project_id, size').in('project_id', projectIds),
        ])
        if (scriptsRes.error) throw scriptsRes.error
        if (textFilesRes.error) throw textFilesRes.error
        if (imagesRes.error) throw imagesRes.error

        const usage = new Map<string, StorageUsage>()
        function entryFor(projectId: string): StorageUsage {
            let entry = usage.get(projectId)
            if (!entry) {
                entry = { textBytes: 0, imageBytes: 0, soundBytes: 0 }
                usage.set(projectId, entry)
            }
            return entry
        }

        const encoder = new TextEncoder()
        for (const row of scriptsRes.data ?? []) entryFor(row.project_id).textBytes += encoder.encode(row.content).length
        for (const row of textFilesRes.data ?? []) entryFor(row.project_id).textBytes += encoder.encode(row.content).length
        for (const row of imagesRes.data ?? []) entryFor(row.project_id).imageBytes += row.size

        storageByProject.value = usage
    }

    async function createProject(name: string): Promise<ProjectRecord> {
        const authStore = useAuthStore()
        if (!authStore.user) throw new Error('Must be signed in to create a project')
        if (name.length > MAX_PROJECT_NAME_LENGTH) throw new Error(`Project names can't be longer than ${MAX_PROJECT_NAME_LENGTH} characters.`)

        for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
            const { data, error } = await supabase
                .from('projects')
                .insert({ name, owner_id: authStore.user.id, slug: generateSlug(), api_version: latestApiVersion() })
                .select('id, name, slug, is_public, api_version, created_at, updated_at')
                .single()

            if (error) {
                if (error.code === '23505' && attempt < MAX_SLUG_ATTEMPTS) continue
                throw error
            }

            const project: ProjectRecord = {
                id: data.id,
                name: data.name,
                slug: data.slug,
                isPublic: data.is_public,
                apiVersion: data.api_version,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
            }
            projects.value.unshift(project)
            return project
        }

        throw new Error('Failed to generate a unique project URL. Please try again.')
    }

    async function renameProject(id: string, name: string) {
        if (name.length > MAX_PROJECT_NAME_LENGTH) throw new Error(`Project names can't be longer than ${MAX_PROJECT_NAME_LENGTH} characters.`)

        const { error } = await supabase.from('projects').update({ name }).eq('id', id)
        if (error) throw error

        const project = projects.value.find((p) => p.id === id)
        if (project) project.name = name
    }

    async function deleteProject(id: string) {
        const { error } = await supabase.from('projects').delete().eq('id', id)
        if (error) throw error

        projects.value = projects.value.filter((p) => p.id !== id)
    }

    async function setPublic(id: string, isPublic: boolean) {
        const { error } = await supabase.from('projects').update({ is_public: isPublic }).eq('id', id)
        if (error) throw error

        const project = projects.value.find((p) => p.id === id)
        if (project) project.isPublic = isPublic
    }

    async function setApiVersion(id: string, version: string) {
        const { error } = await supabase.from('projects').update({ api_version: version }).eq('id', id)
        if (error) throw error

        const project = projects.value.find((p) => p.id === id)
        if (project) project.apiVersion = version
    }

    return { projects, loading, storageByProject, fetchProjects, fetchStorageUsage, createProject, renameProject, deleteProject, setPublic, setApiVersion }
})
