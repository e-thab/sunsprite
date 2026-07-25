<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useFullscreenStore } from '@/stores/fullscreen';
import { useAuthStore } from '@/stores/authStore';
import SignInModal from './SignInModal.vue';

const fsStore = useFullscreenStore()
const authStore = useAuthStore()
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
        <!-- <span>Header</span> -->
        <!-- <span>Span two</span> -->
        <!-- <span>Span three</span> -->
        <img class="img-button" @click="router.push('/')" title="Home" src="/src/assets/images/game-icons/home.png" />
        <img class="img-button" @click="router.push('/')" id="logo" title="Sunsprite" src="/src/assets/sun.svg" />
        <img v-if="authStore.isAuthenticated" class="img-button" @click="router.push('/projects')" title="My Projects" src="/src/assets/images/game-icons/menuList.png" />
        <img class="img-button" @click="onProfileClick" title="Profile" src="/src/assets/images/game-icons/multiplayer.png" />
    </div>
    <SignInModal />
</template>

<style scoped>
.bar {
    min-height: 2em;
    display: flex;
    padding: 0 0.5em 0 0.5em;
    justify-content: space-between;
    user-select: none;
}

img {
    height: 2em;
}

#logo {
    filter: brightness(1);
}
</style>