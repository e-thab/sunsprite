<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/assets/utils/supabase'
import { useFileStore } from '@/stores/fileStore'
import { useFullscreenStore } from '@/stores/fullscreen'
import { useThemeStore } from '@/stores/themeStore'
import { runUserCode, resizeStage } from '@/sandbox/hostBridge'
import PhaserCanvas from '@/components/PhaserCanvas.vue'
import ErrorView from './ErrorView.vue'

// Matches the literal name every other run entry point uses (fileStore.ts,
// CodeEditor.vue, FileTree.vue) — a project's entry script isn't a stored
// field anywhere, just this fixed name by convention.
const MAIN_SCRIPT_NAME = 'main.js'

const props = defineProps<{
  slug: string
}>()

const router = useRouter()
const fileStore = useFileStore()
const fullscreenStore = useFullscreenStore()
const themeStore = useThemeStore()

const status = ref<'loading' | 'ready' | 'not-found' | 'error'>('loading')
const errorMessage = ref('')

async function load(slug: string) {
  status.value = 'loading'

  // No ownership/is_public check needed here, unlike ProjectEditorView.vue:
  // RLS (see supabase/migrations' is_public policies) already returns no row
  // at all for a private project unless the requester is its owner, so a
  // guest or non-owner hitting a private slug lands on 'not-found' exactly
  // like a nonexistent one would.
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

  fileStore.setProjectName(data.name)

  try {
    await fileStore.loadProject(data.id)
    runGame()
    status.value = 'ready'
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load project scripts'
    status.value = 'error'
  }
}

function runGame() {
  runUserCode(fileStore.getLocalCode(MAIN_SCRIPT_NAME) ?? '', MAIN_SCRIPT_NAME, themeStore.current)
}

function onCanvasReady() {
  resizeStage()
}

// PhaserCanvas's own toolbar toggle: elsewhere (EditorView.vue) this
// maximizes the canvas pane within a splitpanes layout, which doesn't exist
// here — the canvas already fills the whole page. Reusing the same store
// still does something useful on this route, though: it's the flag NavBar.vue
// itself checks to decide whether to render at all, so toggling it here
// shows/hides the site nav on top of the fullscreen player instead.
function toggleFullscreen() {
  fullscreenStore.toggle()
  resizeStage()
}

onMounted(() => {
  fullscreenStore.fullscreen = true
  load(props.slug)
})

watch(() => props.slug, (slug) => load(slug))

onUnmounted(() => {
  // Global singleton — leaving it true would hide NavBar on every other
  // route too.
  fullscreenStore.fullscreen = false
  fileStore.exitProject()
})
</script>

<template>
  <div class="play-view">
    <PhaserCanvas
      v-if="status === 'ready'"
      class="content"
      @ready="onCanvasReady"
      @run-game="runGame"
      @fullscreen="toggleFullscreen"
    />

    <ErrorView
      v-else-if="status === 'not-found'"
      :status-code="404"
      status-message="Project not found"
      message="This project doesn't exist, isn't public, or you don't have access to it."
      back-label="Back to Sunsprite"
      back-to="/"
      class="content"
    />

    <div v-else class="status-pane">
      <p v-if="status === 'loading'">Loading project&hellip;</p>
      <template v-else>
        <UAlert color="error" variant="subtle" :description="errorMessage" />
        <UButton variant="ghost" @click="() => { router.push('/') }">Back to Sunsprite</UButton>
      </template>
    </div>
  </div>
</template>

<style scoped>
.play-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
