<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import type { DropdownMenuItem } from '@nuxt/ui';
import { useRoute, useRouter } from 'vue-router';
import { useFullscreenStore } from '@/stores/fullscreen';
import { useAuthStore } from '@/stores/authStore';
import { useFileStore } from '@/stores/fileStore';
import { useThemeStore } from '@/stores/themeStore';
import { useProjectStore } from '@/stores/projectStore';
import { useDocsStore } from '@/stores/docsStore';
import { timeAgo } from '@/assets/utils/timeAgo';
import SignInModal from './SignInModal.vue';
import SignUpModal from './SignUpModal.vue';

const fsStore = useFullscreenStore()
const authStore = useAuthStore()
const fileStore = useFileStore()
const themeStore = useThemeStore()
const projectStore = useProjectStore()
const docsStore = useDocsStore()
const router = useRouter()
const route = useRoute()

// Docs toggles a pane inside EditorView (rendered on the home/guest route
// and the loaded-project route) — showing it elsewhere would just flip
// unused state with nothing on screen to reflect it.
const isEditorRoute = computed(() => route.name === 'home' || route.name === 'project')

// projectStore.projects is already ordered by updated_at desc (see
// fetchProjects); NavBar is mounted once at the app root, so this needs its
// own fetch/refresh rather than relying on ProjectsView having run it.
onMounted(() => {
    if (authStore.isAuthenticated) projectStore.fetchProjects()
})
watch(() => authStore.isAuthenticated, (isAuthenticated) => {
    if (isAuthenticated) projectStore.fetchProjects()
})

// Refetch whenever the dropdown opens rather than trusting the one-time
// mount fetch to still be current — a script saved (or a project
// renamed/deleted) anywhere else in the app since then won't have touched
// this store otherwise, since NavBar has no other way to hear about it.
function onProjectMenuOpenChange(open: boolean) {
    if (open) projectStore.fetchProjects()
}

async function onSignOut() {
    await authStore.signOut()
    await themeStore.init()
    router.push('/')
}

async function onCreateProject() {
    const name = window.prompt('Project name:')
    if (!name) return

    try {
        const project = await projectStore.createProject(name)
        router.push(`/projects/${project.slug}`)
    } catch (err) {
        window.alert(err instanceof Error ? err.message : 'Failed to create project')
    }
}

const recentProjects = computed(() => projectStore.projects.slice(0, 6))

const projectMenuItems = computed(() => [
    recentProjects.value.length > 0
        ? recentProjects.value.map((p) => ({
            label: p.name,
            description: timeAgo(p.updatedAt),
            icon: 'material-symbols:shapes',
            onSelect: () => router.push(`/projects/${p.slug}`),
        }))
        : [{ label: 'No projects yet', disabled: true }],
    [
        {
            label: 'New Project',
            icon: 'tabler:plus',
            onSelect: onCreateProject,
        },
        {
            label: 'My Projects',
            icon: 'tabler:folder-filled',
            onSelect: () => router.push('/projects'),
        },
    ],
])

const themeMenuItems = computed(() => [
    themeStore.themes.map((t) => ({
        label: t.label,
        // color: t.id === themeStore.currentId ? 'primary' : 'neutral',
        icon: (() => {
            if (t.id === themeStore.currentId) {
                return 'tabler:check'
            } else {
                return t.isLight ? 'tabler:sun-filled' : 'tabler:moon-filled'
            }
        })(),
        onSelect: () => themeStore.setTheme(t.id),
    })),
])

const accountMenuItems: DropdownMenuItem[][] = [
    [
        {
            label: 'My Account',
            icon: 'material-symbols:person',
            onSelect: () => router.push('/account')
        },
        {
            label: 'My Projects',
            // icon: 'material-symbols:shapes',
            icon: 'tabler:folder-filled',
            onSelect: () => router.push('/projects')
        },
    ],
    [
        {
            label: 'Sign Out',
            icon: 'material-symbols:logout',
            color: 'error',
            onSelect: onSignOut
        },
    ],
]
</script>

<template>
    <div v-if="!fsStore.fullscreen" id="nav-header" class="bar">
        <div class="left-group">
            <!-- Sunsprite home button -->
            <UButton icon="sunsprite:sun" variant="ghost" color="neutral" @click="() => { router.push('/') }">
                Sunsprite
            </UButton>

            <!-- Docs button -->
            <UTooltip v-if="isEditorRoute" text="Docs">
                <UButton icon="tabler:book-filled" variant="ghost" :color="docsStore.isOpen ? 'primary' : 'neutral'" @click="docsStore.toggle">Docs</UButton>
            </UTooltip>
        </div>

        <!-- Try a fieldgroup here -->
        <div v-if="fileStore.projectId && fileStore.projectName" class="project-header">
            <span class="project-name">{{ fileStore.projectName }}</span>
            
            <UTooltip text="Save all files">
                <UButton
                    icon="tabler:device-floppy-filled"
                    variant="ghost"
                    size="xs"
                    :color="fileStore.hasUnsavedChanges ? 'warning' : 'neutral'"
                    @click="fileStore.saveAll"
                >{{ fileStore.hasUnsavedChanges ? 'Save All' : 'Saved' }}</UButton>
            </UTooltip>
        </div>

        <div class="right-group">
            <UDropdownMenu :items="themeMenuItems">
                <UTooltip text="Theme" ignore-non-keyboard-focus>
                    <UButton icon="tabler:palette-filled" variant="ghost" color="neutral">Theme</UButton>
                </UTooltip>
            </UDropdownMenu>
            
            <UDropdownMenu v-if="authStore.isAuthenticated" :items="projectMenuItems" @update:open="onProjectMenuOpenChange">
                <UTooltip text="My Projects" ignore-non-keyboard-focus>
                    <UButton icon="tabler:folder-filled" variant="ghost" color="neutral">Projects</UButton>
                </UTooltip>
            </UDropdownMenu>
            <UButton v-else variant="ghost" color="neutral" @click="authStore.openSignIn">Sign In</UButton>

            <UDropdownMenu v-if="authStore.isAuthenticated" :items="accountMenuItems">
                <UButton icon="tabler:user-filled" variant="ghost" color="neutral">{{ authStore.username || authStore.user?.email }}</UButton>
            </UDropdownMenu>
            </div>
    </div>
    <SignInModal />
    <SignUpModal />
</template>

<style scoped>
.bar {
    min-height: 2em;
    display: flex;
    padding: 0 0.5em 0 0.5em;
    justify-content: space-between;
    user-select: none;
    background-color: var(--theme-bg-accented);
}

.center-group,
.left-group,
.right-group {
    display: flex;
    align-items: center;
    gap: 0.5em;
}

.logo-button {
    padding: 0.2em;
}

#logo {
    height: 1.6em;
}

.project-header {
    display: flex;
    align-items: center;
    gap: 0.6em;
    margin-left: 0.5em;
    color: var(--theme-text);
}

.project-name {
    font-weight: bold;
    font-size: 0.9em;
}
</style>