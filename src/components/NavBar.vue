<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { DropdownMenuItem } from '@nuxt/ui';
import { defineShortcuts } from '@nuxt/ui/composables';
import { useRoute, useRouter } from 'vue-router';
import { useFullscreenStore } from '@/stores/fullscreen';
import { useAuthStore } from '@/stores/authStore';
import { useFileStore } from '@/stores/fileStore';
import { useThemeStore } from '@/stores/themeStore';
import { useProjectStore, MAX_PROJECT_NAME_LENGTH } from '@/stores/projectStore';
import { useNamePromptStore } from '@/stores/namePromptStore';
import { useDocsStore } from '@/stores/docsStore';
import { useDocsSearchStore } from '@/stores/docsSearchStore';
import { usePageTitle } from '@/composables/usePageTitle';
import { timeAgo } from '@/assets/utils/timeAgo';
import SignInModal from './SignInModal.vue';
import SignUpModal from './SignUpModal.vue';
import DocsSearchModal from './docs/DocsSearchModal.vue';
import Random from '@/assets/api/Random.ts';

// This template has multiple root nodes (.bar plus the modals below), so
// Vue can't auto-target passthrough attrs (App.vue's `class="navbar-header"`)
// onto a single element and just drops them with a dev warning instead —
// forwarding `class` onto .bar explicitly is what the docs call for here.
defineOptions({ inheritAttrs: false })

const fsStore = useFullscreenStore()
const authStore = useAuthStore()
const fileStore = useFileStore()
const themeStore = useThemeStore()
const projectStore = useProjectStore()
const namePromptStore = useNamePromptStore()
const docsStore = useDocsStore()
const docsSearchStore = useDocsSearchStore()
const router = useRouter()
const route = useRoute()

// The keyboard shortcut still works everywhere (editor route, standalone
// docs pages, or neither) — only the nav bar button itself is limited to the
// full-page docs view below, since that's the one place browsing the docs
// isn't already available some other way (the panel has its own search box;
// everywhere else there's nothing docs-related on screen).
defineShortcuts({
    meta_k: () => docsSearchStore.toggle(),
})

// Whether EditorView is the current route component (the sandbox/guest
// route, or a loaded project) — it's the only place with a docs pane to
// toggle, so the Docs nav button (below) branches its click behavior on this.
const isEditorRoute = computed(() => route.name === 'sandbox' || route.name === 'project')

// The standalone full-page docs view (DocsView.vue) — as opposed to the
// panel embedded in the editor, or anywhere else in the app.
const isDocsRoute = computed(() => route.name === 'docs')

// The Docs nav button is dual-purpose: inside the editor it toggles the
// embedded panel (nothing to navigate to — the panel is right there), but
// everywhere else there's no panel on screen, so it instead navigates to
// the full-page docs view.
function onDocsClick() {
    if (isEditorRoute.value) {
        docsStore.toggle()
    } else {
        router.push('/docs')
    }
}

// Center-bar label for whichever page is current — also what the browser
// tab title is built from (see App.vue), so the two stay in sync by
// construction. The 'project' route is deliberately absent from the
// composable's own switch — that's the one page with something better to
// show instead (a loaded project's name takes priority there), and left
// blank falls through to nothing during the brief window before a loaded
// project has a name yet.
const pageTitle = usePageTitle()

// Keeps --nav-height (base.css) in sync with the bar's real rendered height,
// so anything elsewhere that needs to size/position itself around the
// navbar (e.g. DocsView.vue's sticky tree) can read the actual value
// instead of guessing it. The bar itself (not just this component) mounts
// and unmounts via v-if on fullscreen, so this watches the template ref
// rather than measuring once in onMounted — a plain onMounted measurement
// would go stale/never re-attach across those toggles.
const navBarEl = ref<HTMLElement | null>(null)
let navBarObserver: ResizeObserver | undefined

function setNavHeight(px: number) {
    document.documentElement.style.setProperty('--nav-height', `${px}px`)
}

watch(navBarEl, (el) => {
    navBarObserver?.disconnect()
    if (el) {
        setNavHeight(el.offsetHeight)
        navBarObserver = new ResizeObserver(() => setNavHeight(el.offsetHeight))
        navBarObserver.observe(el)
    } else {
        setNavHeight(0)
    }
}, { immediate: true })

onBeforeUnmount(() => navBarObserver?.disconnect())

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
    const name = await namePromptStore.prompt({
        title: 'New project',
        maxLength: MAX_PROJECT_NAME_LENGTH,
        confirmLabel: 'Create',
    })
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
            } else if (t.id === 'random') {
                return `tabler:dice-${Random.range(1, 6)}-filled`
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
    <div v-if="!fsStore.fullscreen" id="nav-header" ref="navBarEl" class="bar" :class="$attrs.class">
        <div class="left-group">
            <!-- Sunsprite home button -->
            <UButton icon="sunsprite:sun" variant="ghost" color="neutral" @click="() => { router.push('/') }">
                Sunsprite
            </UButton>

            <!-- Sandbox button: a faux-project, accessible without signing in,
            that saves to localStorage. Not to be confused with the code
            sandboxing (runner.html/src/sandbox) used internally to run user
            code from its own origin. Hidden while already in the sandbox —
            nothing to navigate to from there. -->
            <UTooltip v-if="route.name !== 'sandbox'" text="Sandbox">
                <UButton icon="tabler:sandbox" variant="ghost" color="neutral" @click="() => { router.push('/sandbox') }">Sandbox</UButton>
            </UTooltip>

            <!-- Docs button: toggles the embedded panel in the editor, or
            navigates to the full-page docs view everywhere else. Hidden only
            on the full-page docs view itself, which has no more-docs place
            left to send you. -->
            <UTooltip v-if="!isDocsRoute" text="Docs">
                <UButton icon="tabler:book-filled" variant="ghost" :color="isEditorRoute && docsStore.isOpen ? 'primary' : 'neutral'" @click="onDocsClick">Docs</UButton>
            </UTooltip>

            <!-- Docs search: only shown in the full-page docs view — the
            panel has its own search box, and everywhere else there's no
            docs UI on screen for it to relate to. The Ctrl/Cmd+K shortcut
            itself still works everywhere regardless. -->
            <UTooltip v-if="isDocsRoute" text="Search docs (Ctrl/Cmd+K)" ignore-non-keyboard-focus>
                <UButton icon="fa7-solid:magnifying-glass" variant="ghost" color="neutral" @click="docsSearchStore.toggle">Search Docs</UButton>
            </UTooltip>
        </div>

        <!-- Try a fieldgroup here -->
        <div v-if="fileStore.projectId && fileStore.projectName" class="project-header">
            <span class="project-name" :title="pageTitle">{{ pageTitle }}</span>

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
        <span v-else-if="pageTitle" class="page-title">{{ pageTitle }}</span>

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
    <DocsSearchModal />
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
    /* The project name (.project-header, below) is the one thing in this
       bar that should give up space first — these hold the actual nav
       controls (home, docs, theme, account) and should never get squeezed
       to make room for a long name. */
    flex-shrink: 0;
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
    /* Lets this flex item actually shrink below the name's unwrapped width
       instead of pushing .right-group's nav controls out — flex items
       default to min-width: auto, which would otherwise block that. */
    min-width: 0;
}

.project-name {
    font-weight: bold;
    font-size: 0.9em;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Same slot as .project-header above (mutually exclusive with it), so it
   gets the same treatment: the flex/align-items/margin/color/min-width here
   match .project-header exactly — without display:flex + align-items:center
   of its own, a bare span just stretches to the bar's full height (.bar's
   own align-items defaults to stretch) and its text sits at the top instead
   of centering. It also shrinks before the nav controls do, and ellipses
   rather than wrapping/overflowing if it ever runs out of room. */
.page-title {
    display: flex;
    align-items: center;
    margin-left: 0.5em;
    color: var(--theme-text);
    font-weight: bold;
    font-size: 0.9em;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>