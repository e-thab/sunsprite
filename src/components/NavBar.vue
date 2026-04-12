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
        <img src="/src/assets/images/game-icons/home.png"
            @click="print('Home click')" 
        />

        <img src="/src/assets/sun.svg"
            id="logo"
            @click="print('Logo click')"
        />

        <img src="/src/assets/images/game-icons/multiplayer.png"
            @click="print('Account click')"
        />
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
    filter: brightness(0.8);
}
img:hover {
    filter: brightness(1);
}

#logo {
    filter: brightness(1);
}
</style>