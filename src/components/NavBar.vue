<script setup lang="ts">
import { useFullscreenStore } from '@/stores/fullscreen';
import Output from '@/assets/api/output';
const fsStore = useFullscreenStore()
</script>

<template>
    <div v-if="!fsStore.fullscreen" id="nav-header" class="bar">
        <!-- <span>Header</span> -->
        <!-- <span>Span two</span> -->
        <!-- <span>Span three</span> -->
        <img class="img-button" @click="Output.print('home')" title="Home" src="/src/assets/images/game-icons/home.png" />
        <img class="img-button" @click="Output.print('logo')" id="logo" title="Sunsprite" src="/src/assets/sun.svg" />
        <img class="img-button" @click="Output.print('profile')" title="Profile" src="/src/assets/images/game-icons/multiplayer.png" />
    </div>
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