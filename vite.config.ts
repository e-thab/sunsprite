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
      // Inject the devtools client only into the editor app's entry. Left to
      // itself the plugin appends to every HTML page, including sandbox.html —
      // where it immediately throws reading localStorage, because a document
      // without allow-same-origin isn't allowed to have any.
      vueDevTools({ appendTo: 'src/main.ts' }),
      ui()
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    base: '/',
    build: {
      rollupOptions: {
        // Two entry points: the editor app, and the sandbox document that runs
        // user code (see sandbox.html). They must be separate HTML files so the
        // sandbox can be loaded into an opaque-origin iframe.
        input: {
          main: fileURLToPath(new URL('./index.html', import.meta.url)),
          sandbox: fileURLToPath(new URL('./sandbox.html', import.meta.url)),
        },
      },
    },
    server: {
      // The sandbox iframe has an opaque origin, so *every* request it makes —
      // its own module scripts, and the game images under public/ — is
      // cross-origin and sends `Origin: null`. Without a wildcard ACAO the
      // sandbox can't boot at all in dev, and Phaser's WebGL renderer can't
      // upload textures from images it didn't fetch CORS-clean.
      //
      // Production (GitHub Pages) already returns `access-control-allow-origin: *`
      // on every response, so no deploy-side change is needed. If this ever moves
      // to a host that doesn't, that header has to be configured there.
      cors: { origin: '*' },
      headers: {
        'Access-Control-Allow-Origin': '*',
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
