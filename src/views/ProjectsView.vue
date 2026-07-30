<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/projectStore'
import { formatDate } from '@/assets/utils/timeAgo'

const projectStore = useProjectStore()
const router = useRouter()

const creating = ref(false)
const errorMessage = ref('')

async function onCreate() {
  const name = window.prompt('Project name:')
  if (!name) return

  creating.value = true
  errorMessage.value = ''
  try {
    const project = await projectStore.createProject(name)
    router.push(`/projects/${project.slug}`)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to create project'
  } finally {
    creating.value = false
  }
}

async function onRename(id: string, currentName: string) {
  const name = window.prompt('Rename project:', currentName)
  if (!name || name === currentName) return

  try {
    await projectStore.renameProject(id, name)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to rename project'
  }
}

async function onDelete(id: string, name: string) {
  if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return

  try {
    await projectStore.deleteProject(id)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to delete project'
  }
}

onMounted(() => projectStore.fetchProjects())
</script>

<template>
  <div class="projects-view">
    <UCard class="projects-card">
      <template #header>
        <div class="projects-header">
          <h1>My Projects</h1>
          <UButton :loading="creating" @click="onCreate">New Project</UButton>
        </div>
      </template>

      <UAlert v-if="errorMessage" color="error" variant="subtle" :description="errorMessage" class="spaced" />

      <UAlert
        v-if="!projectStore.loading && projectStore.projects.length === 0"
        color="neutral"
        variant="subtle"
        description="No projects yet. Create one now to get started!"
        class="spaced"
      />

      <ul class="project-list">
        <li v-for="project in projectStore.projects" :key="project.id" class="project-row">
          <div class="project-row-info">
            <UButton variant="link" @click="() => { router.push(`/projects/${project.slug}`) }">
              {{ project.name }}
            </UButton>
            <span class="project-updated">Last edited {{ formatDate(project.updatedAt) }}</span>
          </div>
          <div class="project-row-actions">
            <UTooltip text="Rename">
              <UButton icon="tabler:pencil" variant="ghost" color="neutral" size="sm" @click="onRename(project.id, project.name)" />
            </UTooltip>
            <UTooltip text="Delete">
              <UButton icon="tabler:trash" variant="ghost" color="error" size="sm" @click="onDelete(project.id, project.name)" />
            </UTooltip>
          </div>
        </li>
      </ul>
    </UCard>
  </div>
</template>

<style scoped>
.projects-view {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background-color: var(--theme-bg-neutral);
  padding-top: 4em;
}

.projects-card {
  width: 100%;
  max-width: 480px;
}

.projects-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.projects-header h1 {
  font-size: 1.3em;
}

.spaced {
  margin-bottom: 1em;
}

.project-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}

.project-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25em 0.75em;
  border-radius: 6px;
  background-color: var(--ui-bg-elevated);
}

.project-row-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}

.project-updated {
  font-size: 0.75em;
  color: var(--theme-text-dim);
}

.project-row-actions {
  display: flex;
  gap: 0.25em;
}
</style>
