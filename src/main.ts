import './assets/main.css'

// import vue from '@vitejs/plugin-vue'
// import { defineConfig } from 'vite'
// import { compilerOptions } from 'vue3-pixi/compiler'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// export default defineConfig({
//     plugins: [
//         vue({
//             template: {
//                 // support for custom elements & remove unknown warnings
//                 compilerOptions,
//             }
//         })
//     ]
// })

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
