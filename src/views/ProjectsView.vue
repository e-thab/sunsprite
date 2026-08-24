<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'
import type { ProgressGroupItem } from '@nuxt/ui'
import { useProjectStore, MAX_PROJECT_NAME_LENGTH } from '@/stores/projectStore'
import { useNamePromptStore } from '@/stores/namePromptStore'
import { formatDate } from '@/assets/utils/timeAgo'

const projectStore = useProjectStore()
const namePromptStore = useNamePromptStore()
const router = useRouter()
const toast = useToast()

// Mock only — no per-project storage tracking exists yet. Just a visual
// draft of what a usage breakdown might look like on this card; every
// project shows the same placeholder numbers for now.
const MOCK_STORAGE_QUOTA_BYTES = 50 * 1024 * 1024
const MOCK_STORAGE_ITEMS: ProgressGroupItem[] = [
  { label: 'Text', icon: 'tabler:file-text', value: 6.5 * 1024 * 1024, color: 'var(--theme-text)' },
  { label: 'Images', icon: 'tabler:photo', value: 11.3 * 1024 * 1024, color: 'var(--theme-primary)' },
]
const MOCK_STORAGE_USED_BYTES = MOCK_STORAGE_ITEMS.reduce((sum, item) => sum + (item.value ?? 0), 0)

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const creating = ref(false)
const errorMessage = ref('')

async function onCreate() {
  const name = await namePromptStore.prompt({
    title: 'New project',
    maxLength: MAX_PROJECT_NAME_LENGTH,
    confirmLabel: 'Create',
  })
  if (!name) return

  creating.value = true
  errorMessage.value = ''
  try {
    const project = await projectStore.createProject(name)
    router.push(`/edit/${project.slug}`)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to create project'
  } finally {
    creating.value = false
  }
}

async function onTogglePublic(project: { id: string, isPublic: boolean }, isPublic: boolean) {
  try {
    await projectStore.setPublic(project.id, isPublic)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to update visibility'
  }
}

async function onCopyPlayLink(slug: string) {
  const url = `${window.location.origin}/play/${slug}`
  await navigator.clipboard.writeText(url)
  toast.add({
    title: 'Play link copied to clipboard',
    description: url,
    icon: 'tabler:copy-filled',
  })
}

async function onRename(id: string, currentName: string) {
  const name = await namePromptStore.prompt({
    title: 'Rename project',
    initialValue: currentName,
    maxLength: MAX_PROJECT_NAME_LENGTH,
    confirmLabel: 'Rename',
  })
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
          <UButton trailing-icon="tabler:plus" :loading="creating" @click="onCreate">New Project</UButton>
        </div>
      </template>

      <UAlert v-if="errorMessage" color="error" variant="subtle" :description="errorMessage" class="spaced" />

      <UAlert
        v-if="!projectStore.loading && projectStore.projects.length === 0"
        color="neutral"
        variant="subtle"
        description="No projects yet. Click 'New Project' to make one now!"
        class="spaced"
      />

      <ul class="project-list">
        <li v-for="project in projectStore.projects" :key="project.id" class="project-row">
          <!-- Placeholder — no real thumbnails exist yet, just staking out
               the space and shape (matches the 16:9 game canvas). -->
          <div class="project-thumbnail" aria-hidden="true">
            <UIcon name="tabler:photo" />
          </div>

          <div class="project-row-main">
            <div class="project-row-top">
              <div class="project-row-info">
                <UButton variant="soft" @click="() => { router.push(`/edit/${project.slug}`) }" style="font-weight: bold;">
                  {{ project.name }}
                </UButton>
                <span class="project-updated">{{ project.slug }} &middot; Last edited {{ formatDate(project.updatedAt) }}</span>
                <div class="project-visibility-row">
                  <UTooltip :text="project.isPublic ? 'Public (anyone with the link can play)' : 'Private (only you can access this)'" ignore-non-keyboard-focus>
                    <USwitch
                      :model-value="project.isPublic"
                      :label="project.isPublic ? 'Public' : 'Private'"
                      color="success"
                      aria-label="Toggle privacy"
                      unchecked-icon="tabler:lock"
                      checked-icon="tabler:world"
                      class="project-visibility-switch"
                      @update:model-value="(value: boolean) => onTogglePublic(project, value)"
                    />
                  </UTooltip>
                  <UTooltip text="Copy play link" ignore-non-keyboard-focus>
                    <UButton icon="tabler:link" label="Copy Play Link" variant="soft" color="neutral" size="sm" @click="onCopyPlayLink(project.slug)" />
                  </UTooltip>
                </div>
              </div>

              <!-- Mock only — see MOCK_STORAGE_ITEMS above. -->
              <!-- <UProgressGroup
                :items="MOCK_STORAGE_ITEMS"
                :max="MOCK_STORAGE_QUOTA_BYTES"
                orientation="vertical"
                size="sm"
                class="project-storage"
              > -->
                <!-- <template #status>
                  {{ formatBytes(MOCK_STORAGE_USED_BYTES) }} / {{ formatBytes(MOCK_STORAGE_QUOTA_BYTES) }}
                </template>
                <template #item-trailing="{ item }">
                  {{ formatBytes(item.value ?? 0) }}
                </template> -->
              <!-- </UProgressGroup> -->
              <div>Storage</div>

              <div class="project-row-actions">
                <UButton icon="streamline-plump:controller-1-solid" label="Play" variant="soft" color="neutral" size="sm" :to="`/play/${project.slug}`" target="_blank" />
                <UButton icon="tabler:pencil" label="Rename" variant="soft" color="neutral" size="sm" @click="onRename(project.id, project.name)" />
                <UButton icon="tabler:trash" label="Delete" variant="ghost" color="error" size="sm" @click="onDelete(project.id, project.name)" />
              </div>
            </div>
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
  /* .project-list below is unbounded — enough projects (or a short/zoomed
     viewport) can make this taller than the screen. App.vue's `.content`
     used to force `overflow-y: hidden` on every route's root regardless,
     which would've silently clipped that case with no way to reach the
     rest. Now that each view owns its own overflow (see App.vue), this
     needs to actually handle it. */
  overflow-y: auto;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background-color: var(--theme-bg-elevated);
  padding-top: 4em;
}

.projects-card {
  width: 100%;
  /* Widened from 480px to make room for the thumbnail alongside everything
     else a row now carries — name/slug/date, visibility + copy link,
     play/rename/delete, and the storage bar. */
  max-width: 680px;
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
  /* Thumbnail keeps its own aspect-ratio-driven height rather than
     stretching to match whatever the text content needs — center it
     alongside instead. */
  align-items: center;
  gap: 0.75em;
  padding: 0.5em 0.75em;
  border-radius: 6px;
  background-color: var(--ui-bg-elevated);
}

.project-thumbnail {
  flex-shrink: 0;
  width: 128px;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  border: 1px dashed var(--theme-border);
  background-color: var(--theme-bg-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--theme-text-toned);
  font-size: 1.75em;
}

.project-row-main {
  display: flex;
  flex-direction: column;
  gap: 0.4em;
  min-width: 0;
  flex: 1 1 auto;
}

.project-row-top {
  display: flex;
  /* stretch (the default, but named here for clarity) so project-row-info
     can size itself to the row's full height — driven by whichever of it or
     project-row-actions is naturally taller — and push its own bottom row
     down to match, rather than both columns just top-aligning independently. */
  align-items: stretch;
  justify-content: space-between;
  gap: 0.75em;
}

.project-storage {
  padding-top: 0.15em;
  /* border-top: 1px solid var(--theme-border); */
}

/* Segments get an inline height:X% from the component itself in vertical
   orientation — that only resolves against a track (data-slot="base") that
   actually has a real height, which block elements don't get for free the
   way width:100% happens by default. Narrower width too, so it actually
   reads as a vertical bar instead of collapsing to nothing. */
.project-storage :deep([data-slot="base"]) {
  height: 100%;
  min-height: 4em;
  width: 1.5em;
}

.project-row-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  /* gap is a floor, not the only spacing: once this column is stretched
     taller than its three children need (see project-row above),
     space-between grows the two gaps between them — title/stamp/bottom-row
     stay pinned to their natural ends regardless of how tall the title
     wraps or the actions column gets. */
  justify-content: space-between;
  gap: 0.35em;
  /* Lets this flex item actually shrink below its name's unwrapped width
     instead of pushing the row wider — flex items default to min-width:
     auto, so without this a long name would never be forced to wrap. */
  min-width: 0;
}

.project-visibility-row {
  display: flex;
  align-items: center;
  gap: 0.5em;
  margin-top: 0.15em;
}

/* Fixed width sized for "Private" (the longer of the two label states) so
   toggling doesn't shift the Copy Link button beside it — without this the
   switch+label only takes as much space as whichever word is currently
   showing. */
.project-visibility-switch {
  width: 7em;
}

/* Targets the name UButton's root element — it renders {{ project.name }}
   as plain slot content (no wrapping `truncate`-classed span of its own,
   confirmed by reading Button.vue), so it inherits white-space: normal
   already, but still needs the same min-width fix as its parent above
   (it's a flex row internally too) and overflow-wrap as a backstop for a
   single unbroken run of characters longer than the row is wide. */
.project-row-info :deep(button) {
  min-width: 0;
  overflow-wrap: anywhere;
  text-align: left;
}

.project-updated {
  font-size: 0.75em;
  color: var(--theme-text-toned);
}

.project-row-actions {
  display: flex;
  flex-direction: column;
  align-self: center;
  align-items: flex-start;
  gap: 0.35em;
  flex-shrink: 0;
  border-left: 1px solid var(--theme-border);
  padding-left: 0.5em;
  padding-right: 0.2em;
  margin-right: -0.5em;
}
</style>
