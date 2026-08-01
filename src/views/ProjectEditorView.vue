<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/assets/utils/supabase'
import { useFileStore } from '@/stores/fileStore'
import EditorView from './EditorView.vue'

const props = defineProps<{
  slug: string
}>()

const router = useRouter()
const fileStore = useFileStore()

const status = ref<'loading' | 'ready' | 'not-found' | 'error'>('loading')
const errorMessage = ref('')
const resolvedProjectId = ref('')

async function load(slug: string) {
  status.value = 'loading'

  const { data, error } = await supabase
    .from('projects')
    .select('id, name')
    .eq('slug', slug)
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

  resolvedProjectId.value = data.id
  fileStore.setProjectName(data.name)

  try {
    await fileStore.loadProject(data.id)
    status.value = 'ready'
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load project scripts'
    status.value = 'error'
  }
}

onMounted(() => load(props.slug))
watch(() => props.slug, (slug) => load(slug))
onUnmounted(() => fileStore.exitProject())
</script>

<template>
  <div class="project-view">
    <EditorView v-if="status === 'ready'" :project-id="resolvedProjectId" class="content" />

    <div v-else class="status-pane">
      <p v-if="status === 'loading'">Loading project&hellip;</p>
      <UAlert v-else-if="status === 'not-found'" color="warning" variant="subtle" description="This project doesn't exist, or you don't have access to it." />
      <UAlert v-else color="error" variant="subtle" :description="errorMessage" />
      <UButton v-if="status !== 'loading'" variant="ghost" @click="() => { router.push('/projects') }">Back to Projects</UButton>
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
  color: var(--theme-text-bright);
}
</style>
