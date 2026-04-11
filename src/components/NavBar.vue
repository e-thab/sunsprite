<script setup lang="ts">
import { useFullscreenStore } from '@/stores/fullscreen';
const fsStore = useFullscreenStore()
</script>

<template>
    <div v-if="!fsStore.fullscreen" id="nav-header" class="bar">
        <span>Header</span>
        <!-- <span>Span two</span> -->
        <!-- <span>Span three</span> -->
    </div>
</template>

<style scoped>
.bar {
    height: 2em;
    /* min-height: 2em; */
    display: flex;
    justify-content: space-evenly;
}
</style>