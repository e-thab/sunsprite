<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/assets/utils/supabase'
import { useFileStore } from '@/stores/fileStore'
import { useFullscreenStore } from '@/stores/fullscreen'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'
import { runUserCode, resizeStage } from '@/sandbox/hostBridge'
import { formatDate } from '@/assets/utils/timeAgo'
import GameFrame from '@/components/GameFrame.vue'
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
const authStore = useAuthStore()

const status = ref<'loading' | 'ready' | 'not-found' | 'error'>('loading')
const errorMessage = ref('')
const creatorUsername = ref<string | null>(null)
const updatedAt = ref<string | null>(null)

async function load(slug: string) {
  status.value = 'loading'
  creatorUsername.value = null
  updatedAt.value = null

  // Needed before the owner-vs-everyone-else branch below can trust
  // authStore.user — this route has no requiresAuth (guests must reach it),
  // so unlike ProjectEditorView.vue nothing upstream already awaited this.
  await authStore.ready

  // No ownership/is_public check needed here, unlike ProjectEditorView.vue:
  // RLS (see supabase/migrations' is_public policies) already returns no row
  // at all for a private project unless the requester is its owner, so a
  // guest or non-owner hitting a private slug lands on 'not-found' exactly
  // like a nonexistent one would.
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, owner_id, updated_at')
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
  updatedAt.value = data.updated_at

  // The owner already has their own username client-side (authStore.username)
  // — no need to round-trip for it. Anyone else only ever reaches this line
  // for a project that's public (a private one already hit 'not-found'
  // above), which is exactly the case get_public_creator_username permits.
  if (authStore.user?.id === data.owner_id) {
    creatorUsername.value = authStore.username
  } else {
    const { data: username } = await supabase.rpc('get_public_creator_username', { creator_id: data.owner_id })
    creatorUsername.value = username ?? null
  }

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

function onFrameReady() {
  resizeStage()
}

// Unlike the editor's canvas panel, there's no resizable pane layout to
// maximize into here — the canvas starts embedded in the normal page. This
// just reuses fullscreenStore for what it already means to NavBar.vue (hide
// the site chrome), so toggling it also expands the canvas to fill the page.
function toggleFullscreen() {
  fullscreenStore.toggle()
  resizeStage()
}

onMounted(() => {
  load(props.slug)
})

watch(() => props.slug, (slug) => load(slug))

onUnmounted(() => {
  // Global singleton — leaving it true would hide NavBar on every other
  // route too, if the visitor toggled fullscreen before navigating away.
  fullscreenStore.fullscreen = false
  fileStore.exitProject()
})
</script>

<template>
  <div class="play-view" :class="{ 'play-view--fullscreen': fullscreenStore.fullscreen }">
    <template v-if="status === 'ready'">
      <div v-if="!fullscreenStore.fullscreen" class="play-info">
        <h1 class="play-title">{{ fileStore.projectName }}</h1>
        <div class="play-meta">
          <span v-if="creatorUsername">by {{ creatorUsername }}</span>
          <span v-if="updatedAt">Last updated {{ formatDate(updatedAt) }}</span>
        </div>
      </div>

      <div class="canvas-frame" :class="{ 'canvas-frame--fullscreen': fullscreenStore.fullscreen }">
        <div class="panel-wrapper">
          <div class="panel-bar">
            <UTooltip text="Restart" ignore-non-keyboard-focus>
              <UButton icon="tabler:refresh" variant="ghost" color="neutral" label="Restart" size="xs" @click="runGame" />
            </UTooltip>

            <UTooltip text="Volume — coming soon" ignore-non-keyboard-focus>
              <UButton icon="tabler:volume" variant="ghost" color="neutral" label="Volume" size="xs" disabled />
            </UTooltip>

            <UTooltip :text="fullscreenStore.fullscreen ? 'Exit fullscreen' : 'Fullscreen'" ignore-non-keyboard-focus>
              <UButton
                :icon="fullscreenStore.fullscreen ? 'tabler:minimize' : 'tabler:maximize'"
                variant="ghost"
                color="neutral"
                :label="fullscreenStore.fullscreen ? 'Exit fullscreen' : 'Fullscreen'"
                size="xs"
                @click="toggleFullscreen"
              />
            </UTooltip>
          </div>

          <GameFrame @ready="onFrameReady" />
        </div>
      </div>
    </template>

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
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--theme-bg-elevated);
}

.play-view--fullscreen {
  overflow: hidden;
  align-items: stretch;
}

.play-info {
  width: 100%;
  max-width: 960px;
  padding: 2em 1.5em 0;
  color: var(--theme-text);
}

.play-title {
  margin: 0;
  font-size: 1.5em;
}

.play-meta {
  display: flex;
  gap: 1em;
  margin-top: 0.35em;
  color: var(--theme-text-toned);
  font-size: 0.85em;
}

.canvas-frame {
  width: 100%;
  max-width: 960px;
  aspect-ratio: 16 / 9;
  flex-shrink: 0;
  margin: 1em 0 2em;
  border-radius: 8px;
  overflow: hidden;
}

.canvas-frame--fullscreen {
  max-width: none;
  aspect-ratio: auto;
  flex: 1 1 auto;
  margin: 0;
  border-radius: 0;
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
