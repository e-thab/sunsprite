<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/projectStore'

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
    router.push(`/projects/${project.id}`)
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
    <div class="projects-card">
      <div class="projects-header">
        <h1>My Projects</h1>
        <UButton :loading="creating" @click="onCreate">New Project</UButton>
      </div>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

      <p v-if="!projectStore.loading && projectStore.projects.length === 0" class="empty-message">
        No projects yet — create one to get started.
      </p>

      <ul class="project-list">
        <li v-for="project in projectStore.projects" :key="project.id" class="project-row">
          <button class="project-link" @click="router.push(`/projects/${project.id}`)">
            {{ project.name }}
          </button>
          <div class="project-row-actions">
            <button class="row-action" title="Rename" @click="onRename(project.id, project.name)">Rename</button>
            <button class="row-action" title="Delete" @click="onDelete(project.id, project.name)">Delete</button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.projects-view {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background-color: var(--nord-background-neutral);
  color: var(--nord-text-bright);
  padding-top: 4em;
}

.projects-card {
  width: 100%;
  max-width: 480px;
  padding: 2em;
  border-radius: 8px;
  background-color: var(--nord-background-dark);
}

.projects-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1em;
}

.projects-header h1 {
  font-size: 1.3em;
}

.error-message {
  color: #bf616a;
  font-size: 0.9em;
  margin-bottom: 1em;
}

.empty-message {
  color: var(--nord-text-dim);
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
  padding: 0.5em 0.75em;
  border-radius: 6px;
  background-color: var(--nord-background-light);
}

.project-link {
  background: none;
  border: none;
  color: var(--nord-text-bright);
  cursor: pointer;
  font-size: 1em;
  text-align: left;
}

.project-link:hover {
  color: white;
}

.project-row-actions {
  display: flex;
  gap: 0.75em;
}

.row-action {
  background: none;
  border: none;
  color: var(--nord-text-dim);
  cursor: pointer;
  font-size: 0.85em;
}

.row-action:hover {
  color: var(--nord-text-bright);
}
</style>
