import { defineStore } from "pinia";
import { ref } from "vue";
import { supabase } from "@/assets/utils/supabase";
import { useAuthStore } from "./authStore";

export type ProjectRecord = {
    id: string
    name: string
    createdAt: string
    updatedAt: string
}

export const useProjectStore = defineStore('projects', () => {
    const projects = ref<ProjectRecord[]>([])
    const loading = ref(false)

    async function fetchProjects() {
        loading.value = true
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('id, name, created_at, updated_at')
                .order('updated_at', { ascending: false })
            if (error) throw error

            projects.value = (data ?? []).map((row) => ({
                id: row.id,
                name: row.name,
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

        const { data, error } = await supabase
            .from('projects')
            .insert({ name, owner_id: authStore.user.id })
            .select('id, name, created_at, updated_at')
            .single()
        if (error) throw error

        const project: ProjectRecord = {
            id: data.id,
            name: data.name,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
        }
        projects.value.unshift(project)
        return project
    }

    async function renameProject(id: string, name: string) {
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

    return { projects, loading, fetchProjects, createProject, renameProject, deleteProject }
})
