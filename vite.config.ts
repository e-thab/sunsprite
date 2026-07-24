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
    server: {
      // The sandboxed game iframe (sandbox.html) runs with an opaque "null" origin
      // (sandbox="allow-scripts" without allow-same-origin), so its module-script
      // fetches are cross-origin even though they're served from this same dev
      // server. Without this, the browser blocks them with a CORS error.
      cors: true,
    },
    preview: {
      cors: true,
    },
    build: {
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL('./index.html', import.meta.url)),
          sandbox: fileURLToPath(new URL('./sandbox.html', import.meta.url)),
        },
      },
    },
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
