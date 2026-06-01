import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import ui from '@nuxt/ui/vite'

// const prefix = `monaco-editor/esm/vs`

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  return {
    plugins: [
      vue(),
      vueDevTools(),
      ui()
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    base: '/',
    // optimizeDeps: {
    //   include: [
    //     `${prefix}/language/json/json.worker`,
    //     `${prefix}/language/css/css.worker`,
    //     `${prefix}/language/html/html.worker`,
    //     `${prefix}/language/typescript/ts.worker`,
    //     `${prefix}/editor/editor.worker`
    //   ]
    // },
  }
})
