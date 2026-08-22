import { defineStore } from "pinia";
import { ref } from "vue";
import { supabase } from "@/assets/utils/supabase";
import { useAuthStore } from "./authStore";
import { generateSlug } from "@/assets/utils/slugWords";

export type ProjectRecord = {
    id: string
    name: string
    slug: string
    isPublic: boolean
    createdAt: string
    updatedAt: string
}

const MAX_SLUG_ATTEMPTS = 5

// A generous cap, not a technical constraint — see MAX_FILE_NAME_LENGTH in
// fileTypes.ts for the equivalent on scripts/folders/images/text files.
// Kept as its own constant rather than shared with that one: same current
// value, but an unrelated data model (Supabase `projects`, not the file
// tree), free to diverge later.
export const MAX_PROJECT_NAME_LENGTH = 40

export const useProjectStore = defineStore('projects', () => {
    const projects = ref<ProjectRecord[]>([])
    const loading = ref(false)

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
                .select('id, name, slug, is_public, created_at, updated_at')
                .eq('owner_id', authStore.user.id)
                .order('updated_at', { ascending: false })
            if (error) throw error

            projects.value = (data ?? []).map((row) => ({
                id: row.id,
                name: row.name,
                slug: row.slug,
                isPublic: row.is_public,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
            }))
        } finally {
            loading.value = false
        }
    }

    async function createProject(name: string): Promise<ProjectRecord> {
        const authStore = useAuthStore()
        if (!authStore.user) throw new Error('Must be signed in to create a project')
        if (name.length > MAX_PROJECT_NAME_LENGTH) throw new Error(`Project names can't be longer than ${MAX_PROJECT_NAME_LENGTH} characters.`)

        for (let attempt = 1; attempt <= MAX_SLUG_ATTEMPTS; attempt++) {
            const { data, error } = await supabase
                .from('projects')
                .insert({ name, owner_id: authStore.user.id, slug: generateSlug() })
                .select('id, name, slug, is_public, created_at, updated_at')
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

    return { projects, loading, fetchProjects, createProject, renameProject, deleteProject, setPublic }
})
