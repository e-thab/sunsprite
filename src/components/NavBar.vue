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
            <!-- <img class="img-button" @click="router.push('/')" title="Home" src="/src/assets/images/game-icons/home.png" /> -->
            <img class="img-button" @click="router.push('/')" id="logo" title="Sunsprite" src="/src/assets/sun.svg" />
        </div>

        <div v-if="fileStore.projectId && fileStore.projectName" class="project-header">
            <!-- <button class="back-link" @click="router.push('/projects')">&larr; Projects</button> -->
            <span class="project-name">{{ fileStore.projectName }}</span>
        </div>

        <div class="right-group">
            <img v-if="authStore.isAuthenticated" class="img-button" @click="router.push('/projects')" title="My Projects" src="/src/assets/images/game-icons/menuList.png" />

            <UDropdownMenu v-if="authStore.isAuthenticated" :items="accountMenuItems">
                <button class="account-button">{{ authStore.displayName || authStore.user?.email }}</button>
            </UDropdownMenu>
            <button v-else class="account-button" @click="authStore.openSignIn">Sign In</button>
            <!-- <UButton v-else ></UButton> -->
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

img {
    height: 2em;
}

#logo {
    filter: brightness(1);
}

.project-header {
    display: flex;
    align-items: center;
    gap: 0.6em;
    margin-left: 0.5em;
    color: var(--nord-text-bright);
}

.back-link {
    background: none;
    border: none;
    color: var(--nord-text-bright);
    cursor: pointer;
    font-size: 0.85em;
    padding: 0;
}

.back-link:hover {
    color: white;
}

.project-name {
    font-weight: bold;
    font-size: 0.9em;
}

.account-button {
    background: none;
    border: none;
    color: var(--nord-text-bright);
    cursor: pointer;
    font-size: 0.9em;
    padding: 0;
}

.account-button:hover {
    color: white;
}
</style>