<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/assets/utils/supabase'
import { useFileStore } from '@/stores/fileStore'
import EditorView from './EditorView.vue'

const props = defineProps<{
  id: string
}>()

const router = useRouter()
const fileStore = useFileStore()

const status = ref<'loading' | 'ready' | 'not-found' | 'error'>('loading')
const projectName = ref('')
const errorMessage = ref('')

async function load(id: string) {
  status.value = 'loading'

  const { data, error } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    errorMessage.value = error.message
    status.value = 'error'
    return
  }

  if (!data) {
    status.value = 'not-found'
    return
  }

  projectName.value = data.name

  try {
    await fileStore.loadProject(id)
    status.value = 'ready'
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load project scripts'
    status.value = 'error'
  }
}

onMounted(() => load(props.id))
watch(() => props.id, (id) => load(id))
onUnmounted(() => fileStore.exitProject())
</script>

<template>
  <div class="project-view">
    <div v-if="status === 'ready'" class="project-header">
      <button class="back-link" @click="router.push('/projects')">&larr; Projects</button>
      <span class="project-name">{{ projectName }}</span>
    </div>

    <EditorView v-if="status === 'ready'" :project-id="props.id" class="content" />

    <div v-else class="status-pane">
      <p v-if="status === 'loading'">Loading project&hellip;</p>
      <p v-else-if="status === 'not-found'">This project doesn't exist, or you don't have access to it.</p>
      <p v-else>{{ errorMessage }}</p>
      <button v-if="status !== 'loading'" @click="router.push('/projects')">Back to Projects</button>
    </div>
  </div>
</template>

<style scoped>
.project-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.project-header {
  display: flex;
  align-items: center;
  gap: 1em;
  padding: 0.4em 0.75em;
  color: var(--nord-text-bright);
  background-color: var(--nord-background-dark);
  flex-shrink: 0;
}

.back-link {
  background: none;
  border: none;
  color: var(--nord-text-bright);
  cursor: pointer;
  font-size: 0.9em;
}

.back-link:hover {
  color: white;
}

.project-name {
  font-weight: bold;
}

.content {
  flex: 1 1 auto;
  overflow: hidden;
}

.status-pane {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1em;
  color: var(--nord-text-bright);
}
</style>
