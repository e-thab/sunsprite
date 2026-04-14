import './assets/main.css'
import 'primeicons/primeicons.css';

// import vue from '@vitejs/plugin-vue'
// import { defineConfig } from 'vite'
// import { compilerOptions } from 'vue3-pixi/compiler'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ui from '@nuxt/ui/vue-plugin'

import App from './App.vue'
import router from './router'

export const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(PrimeVue)
app.use(ui)
app.mount('#app')
