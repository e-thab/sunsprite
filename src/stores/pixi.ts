import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as Pixi from 'pixi.js';

export const usePixiAppStore = defineStore('pixiApp', () => {
    const pixiApp = ref<Pixi.Application>(new Pixi.Application())
})