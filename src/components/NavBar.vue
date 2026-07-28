<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useFullscreenStore } from '@/stores/fullscreen';
import { useAuthStore } from '@/stores/authStore';
import { useFileStore } from '@/stores/fileStore';
import { useThemeStore } from '@/stores/themeStore';
import SignInModal from './SignInModal.vue';
import SignUpModal from './SignUpModal.vue';

const fsStore = useFullscreenStore()
const authStore = useAuthStore()
const fileStore = useFileStore()
const themeStore = useThemeStore()
const router = useRouter()

async function onSignOut() {
    await authStore.signOut()
    await themeStore.init()
    router.push('/')
}

const themeMenuItems = computed(() => [
    themeStore.themes.map((t) => ({
        label: t.label,
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

const accountMenuItems = [
    [
        {
            label: 'My Account',
            icon: 'material-symbols:person',
            onSelect: () => router.push('/account')
        },
        {
            label: 'My Projects',
            icon: 'material-symbols:shapes',
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
            <UButton variant="ghost" color="neutral" class="logo-button" @click="() => { router.push('/') }">
                <img id="logo" title="Sunsprite" src="/src/assets/sun.svg" />
            </UButton>
        </div>

        <div v-if="fileStore.projectId && fileStore.projectName" class="project-header">
            <span class="project-name">{{ fileStore.projectName }}</span>
        </div>

        <div class="right-group">
            <UDropdownMenu :items="themeMenuItems">
                <UTooltip text="Theme" ignore-non-keyboard-focus>
                    <UButton icon="tabler:palette" variant="ghost" color="neutral" />
                </UTooltip>
            </UDropdownMenu>
            
            <UTooltip v-if="authStore.isAuthenticated" text="My Projects">
                <UButton icon="tabler:folder" variant="ghost" color="neutral" @click="() => { router.push('/projects') }" />
            </UTooltip>
            <UButton v-else variant="ghost" color="neutral" @click="authStore.openSignIn">Sign In</UButton>

            <!-- @vue-expect-error -->
            <UDropdownMenu v-if="authStore.isAuthenticated" :items="accountMenuItems">
                <UButton variant="ghost" color="neutral">{{ authStore.displayName || authStore.user?.email }}</UButton>
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
    background-color: var(--theme-bg-light);
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
    color: var(--theme-text-bright);
}

.project-name {
    font-weight: bold;
    font-size: 0.9em;
}
</style>