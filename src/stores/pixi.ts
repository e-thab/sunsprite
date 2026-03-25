import { ref } from 'vue';
import { defineStore } from 'pinia';
import { Application } from 'pixi.js';

export const usePixiAppStore = defineStore('pixiApp', () => {
    const pixiApp = ref<Application>(new Application())
    return { pixiApp }
})