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

function onProfileClick() {
    if (authStore.isAuthenticated) {
        router.push('/account')
    } else {
        authStore.openSignIn()
    }
}
</script>

<template>
    <div v-if="!fsStore.fullscreen" id="nav-header" class="bar">
        <div class="left-group">
            <img class="img-button" @click="router.push('/')" title="Home" src="/src/assets/images/game-icons/home.png" />
            <img class="img-button" @click="router.push('/')" id="logo" title="Sunsprite" src="/src/assets/sun.svg" />
            <div v-if="fileStore.projectId && fileStore.projectName" class="project-header">
                <button class="back-link" @click="router.push('/projects')">&larr; Projects</button>
                <span class="project-name">{{ fileStore.projectName }}</span>
            </div>
        </div>
        <div class="right-group">
            <img v-if="authStore.isAuthenticated" class="img-button" @click="router.push('/projects')" title="My Projects" src="/src/assets/images/game-icons/menuList.png" />
            <img class="img-button" @click="onProfileClick" title="Profile" src="/src/assets/images/game-icons/multiplayer.png" />
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
}

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
</style>