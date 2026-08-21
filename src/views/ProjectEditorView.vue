<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/assets/utils/supabase'
import { useFileStore } from '@/stores/fileStore'
import { useAuthStore } from '@/stores/authStore'
import EditorView from './EditorView.vue'
import ErrorView from './ErrorView.vue'

const props = defineProps<{
  slug: string
}>()

const router = useRouter()
const fileStore = useFileStore()
const authStore = useAuthStore()

const status = ref<'loading' | 'ready' | 'not-found' | 'error'>('loading')
const errorMessage = ref('')
const resolvedProjectId = ref('')

async function load(slug: string) {
  status.value = 'loading'

  const { data, error } = await supabase
    .from('projects')
    .select('id, name, owner_id')
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

  // RLS already hides a private project from anyone but its owner (the
  // .maybeSingle() above would have returned null), but a *public* project's
  // row is readable by any signed-in user — the edit route still isn't
  // theirs to open, only the play route is. That distinction only exists at
  // the application layer, since RLS can't tell "read to edit" apart from
  // "read to play" the same row.
  await authStore.ready
  if (data.owner_id !== authStore.user?.id) {
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

    <ErrorView
      v-else-if="status === 'not-found'"
      :status-code="404"
      status-message="Project not found"
      message="This project doesn't exist, or you don't have access to it."
      back-label="Back to Projects"
      back-to="/projects"
      class="content"
    />

    <div v-else class="status-pane">
      <p v-if="status === 'loading'">Loading project&hellip;</p>
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
  color: var(--theme-text);
}
</style>
