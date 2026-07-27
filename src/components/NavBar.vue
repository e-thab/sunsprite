<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useFullscreenStore } from '@/stores/fullscreen';
import { useAuthStore } from '@/stores/authStore';
import { useFileStore } from '@/stores/fileStore';
import SignInModal from './SignInModal.vue';
import SignUpModal from './SignUpModal.vue';

const fsStore = useFullscreenStore()
const authStore = useAuthStore()
const fileStore = useFileStore()
const router = useRouter()

async function onSignOut() {
    await authStore.signOut()
    router.push('/')
}

const accountMenuItems = [
    [
        { label: 'My Account', onSelect: () => router.push('/account') },
        { label: 'My Projects', onSelect: () => router.push('/projects') },
    ],
    [
        { label: 'Sign Out', onSelect: onSignOut },
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
            <UTooltip v-if="authStore.isAuthenticated" text="My Projects">
                <UButton icon="tabler:folder" variant="ghost" color="neutral" @click="() => { router.push('/projects') }" />
            </UTooltip>

            <UDropdownMenu v-if="authStore.isAuthenticated" :items="accountMenuItems">
                <UButton variant="link" color="neutral">{{ authStore.displayName || authStore.user?.email }}</UButton>
            </UDropdownMenu>
            <UButton v-else variant="link" color="neutral" @click="authStore.openSignIn">Sign In</UButton>
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
    background-color: var(--nord-background-light);
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
    color: var(--nord-text-bright);
}

.project-name {
    font-weight: bold;
    font-size: 0.9em;
}
</style>