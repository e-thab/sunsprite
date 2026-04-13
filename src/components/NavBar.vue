<script setup lang="ts">
import { useFullscreenStore } from '@/stores/fullscreen';
import { print } from '@/assets/api/core';
const fsStore = useFullscreenStore()
</script>

<template>
    <div v-if="!fsStore.fullscreen" id="nav-header" class="bar">
        <!-- <span>Header</span> -->
        <!-- <span>Span two</span> -->
        <!-- <span>Span three</span> -->
        <img @click="print('home')" class="img-button" src="/src/assets/images/game-icons/home.png" />
        <img @click="print('logo')" class="img-button" id="logo" src="/src/assets/sun.svg" />
        <img @click="print('account')" class="img-button" src="/src/assets/images/game-icons/multiplayer.png" />
    </div>
</template>

<style scoped>
.bar {
    min-height: 2em;
    display: flex;
    padding: 0 0.5em 0 0.5em;
    justify-content: space-between;
}

img {
    height: 2em;
}

#logo {
    filter: brightness(1);
}
</style>