<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@nuxt/ui/composables'
import { useProjectStore, MAX_PROJECT_NAME_LENGTH, PROJECT_STORAGE_QUOTA_BYTES, ACCOUNT_STORAGE_QUOTA_BYTES, type StorageUsage } from '@/stores/projectStore'
import { useNamePromptStore } from '@/stores/namePromptStore'
import { formatDate } from '@/assets/utils/timeAgo'
import { formatBytes } from '@/assets/utils/formatBytes'

const projectStore = useProjectStore()
const namePromptStore = useNamePromptStore()
const router = useRouter()
const toast = useToast()

const EMPTY_USAGE: StorageUsage = { textBytes: 0, imageBytes: 0, soundBytes: 0 }

// Just the running total here — no per-category (text/images/audio)
// breakdown on this page anymore; that detail lives in the editor's own
// StorageIndicator.vue instead (its expanded state), which reuses
// UProgressGroup for it. This list view only ever needs "how full."
function usedBytesFor(projectId: string): number {
  const usage = projectStore.storageByProject.get(projectId) ?? EMPTY_USAGE
  return usage.textBytes + usage.imageBytes + usage.soundBytes
}

// Summed from the same per-project figures fetchStorageUsage() already
// fetches for the rows below — no separate request. Mirrors the account-wide
// total the edge functions actually enforce (see ACCOUNT_STORAGE_QUOTA_BYTES's
// own comment), not just a client-side approximation of it.
const accountUsedBytes = computed(() => {
  let total = 0
  for (const usage of projectStore.storageByProject.values()) {
    total += usage.textBytes + usage.imageBytes + usage.soundBytes
  }
  return total
})

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

onMounted(async () => {
  // Sequenced, not parallel: fetchStorageUsage() needs this user's own
  // project ids, which only fetchProjects() knows.
  await projectStore.fetchProjects()
  await projectStore.fetchStorageUsage()
})
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

      <!-- Account-wide, not per-project — every project's usage summed
           together against ACCOUNT_STORAGE_QUOTA_BYTES, a separate, higher
           cap actually enforced server-side alongside each project's own
           10MB one (see that constant's own comment). -->
      <UProgress
        :model-value="accountUsedBytes"
        :max="ACCOUNT_STORAGE_QUOTA_BYTES"
        :color="accountUsedBytes > ACCOUNT_STORAGE_QUOTA_BYTES ? 'error' : 'primary'"
        size="sm"
        class="account-storage spaced"
      >
        <template #status>
          <span :class="{ 'storage-status-over': accountUsedBytes > ACCOUNT_STORAGE_QUOTA_BYTES }">
            {{ formatBytes(accountUsedBytes) }} / {{ formatBytes(ACCOUNT_STORAGE_QUOTA_BYTES) }} used across all projects
          </span>
        </template>
      </UProgress>

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

          <div class="project-row-info">
            <UButton variant="soft" @click="() => { router.push(`/edit/${project.slug}`) }" style="font-weight: bold;">
              {{ project.name }}
            </UButton>

            <div class="project-details-row">
              <span class="project-updated">Last edited {{ formatDate(project.updatedAt) }}</span>
              <!-- <span class="project-updated">&middot;</span> -->
              <span class="project-updated">v{{ project.apiVersion }}</span>
              <!-- <span class="project-updated">&middot;</span> -->
              <span class="project-updated">{{ project.slug }}</span>
            </div>

            <div class="project-visibility-row">
              <UTooltip :text="project.isPublic ? 'Public (anyone with the link can play)' : 'Private (only you can access this)'" ignore-non-keyboard-focus>
                <USwitch
                  :model-value="project.isPublic"
                  :label="project.isPublic ? 'Public' : 'Private'"
                  color="success"
                  aria-label="Toggle privacy"
                  unchecked-icon="tabler:lock"
                  checked-icon="tabler:world"
                  @update:model-value="(value: boolean) => onTogglePublic(project, value)"
                />
              </UTooltip>
              <UTooltip text="Copy play link" ignore-non-keyboard-focus>
                <UButton icon="tabler:link" label="Copy Play Link" variant="soft" color="neutral" size="sm" @click="onCopyPlayLink(project.slug)" />
              </UTooltip>
            </div>
          </div>

          <!-- <UProgress
            :model-value="usedBytesFor(project.id)"
            :max="PROJECT_STORAGE_QUOTA_BYTES"
            :color="usedBytesFor(project.id) > PROJECT_STORAGE_QUOTA_BYTES ? 'error' : 'primary'"
            size="sm"
            class="project-storage"
          >
            <template #status>
              <span :class="{ 'storage-status-over': usedBytesFor(project.id) > PROJECT_STORAGE_QUOTA_BYTES }">
                {{ formatBytes(usedBytesFor(project.id)) }} / {{ formatBytes(PROJECT_STORAGE_QUOTA_BYTES) }}
              </span>
            </template>
          </UProgress> -->

          <div class="project-row-actions">
            <UButton icon="streamline-plump:controller-1-solid" label="Play" variant="soft" color="neutral" size="sm" :to="`/play/${project.slug}`" target="_blank" />
            <UButton icon="tabler:pencil" label="Rename" variant="soft" color="neutral" size="sm" @click="onRename(project.id, project.name)" />
            <UButton icon="tabler:trash" label="Delete" variant="ghost" color="error" size="sm" @click="onDelete(project.id, project.name)" />
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
  max-width: 600px;
  min-width: 600px;
}

.projects-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.projects-header h1 {
  font-size: 1.3em;
  font-weight: 500;
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
  border-radius: var(--panel-border-radius);
  background-color: var(--ui-bg-elevated);
}

.project-thumbnail {
  flex-shrink: 0;
  width: 128px;
  aspect-ratio: 16 / 9;
  border-radius: var(--panel-border-radius);
  border: 1px dashed var(--theme-border);
  background-color: var(--theme-bg-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--theme-text-toned);
  font-size: 1.75em;
}

/* Fixed width, not shrink-to-content — same reason project-row-info has
   min-width: 0 above: without this, a longer "X / Y" status readout would
   change this column's own footprint and push project-row-actions beside it
   out of alignment with every other row. */
.project-storage {
  align-self: flex-end;
  flex-shrink: 0;
  width: 7em;
}

/* Default (horizontal) root is already the shape wanted here — status on
   top, bar underneath (theme: "flex flex-col") — no grid override needed
   this time, unlike ProgressGroup's vertical orientation. Only status needs
   correcting: its own theme class ties its *width* to the fill percentage
   (w-(--percent)) — built for a percentage label that trails the fill edge,
   which reads fine at high percentages but leaves a "10.2 MB / 10.0 MB"
   string almost no room at a low one. Forced to the row's full width instead
   so the label is always fully legible regardless of how full the bar is. */
.project-storage :deep([data-slot="status"]) {
  width: 100% !important;
  justify-content: flex-start;
  font-weight: bold;
  color: var(--theme-text);
}

.storage-status-over {
  color: var(--theme-error);
}

/* Same status-width fix as .project-storage above — see its own comment for
   why (the theme ties status's width to the fill percent by default). */
.account-storage :deep([data-slot="status"]) {
  width: 100% !important;
  justify-content: flex-start;
  font-weight: bold;
  color: var(--theme-text);
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
  /* Stretched to the row's full height (project-row's own align-items is
     center, for the thumbnail's sake — this opts out) so space-between above
     has room to work with, and flex-grow:1 is what absorbs whatever width
     project-storage/project-row-actions don't need, now that there's no
     project-row-main wrapper claiming that role. */
  align-self: stretch;
  flex: 1 1 auto;
  /* Lets this column actually shrink below its content's natural width
     instead of forcing the whole row wider — flex items default to
     min-width: auto, so without this, a long project name or a wide
     project-details-row (nowrap, below) would push project-row-actions
     right off the edge of the card instead of staying put. Confirmed via
     Playwright: removing this let a merely medium-length name/slug combo
     push .project-row-actions 13px past .projects-card's own right edge —
     "never wrap" and "every row stays aligned" conflict once content is
     wide enough, and alignment is the one that has to win here. */
  min-width: 0;
}

.project-details-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  gap: 0.35em;
}

/* Same align-self: stretch reasoning as project-details-row above — this is
   what makes space-between actually separate the switch from the copy-link
   button across the column's full width, replacing the old fixed-width
   hack on the switch itself (used elsewhere in this repo's history; removed
   here since space-between makes it unnecessary). */
.project-visibility-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  align-self: stretch;
  gap: 0.5em;
  margin-top: 0.15em;
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
