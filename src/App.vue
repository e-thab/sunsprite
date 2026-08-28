<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue';
import { RouterView, useRoute } from 'vue-router'
import NavBar from './components/NavBar.vue';
import NamePromptModal from './components/NamePromptModal.vue';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { usePageTitle } from './composables/usePageTitle';

const authStore = useAuthStore()
const themeStore = useThemeStore()
const route = useRoute()

// Browser tab title — reuses NavBar's own center-bar label (see
// usePageTitle) rather than computing a separate one, so the two can never
// show something different for the same page. index.html's static <title>
// (this same site name, alone) is what's visible before this first runs and
// is what a titleless route (the brief window before a loaded project has a
// name yet) falls back to.
const SITE_NAME = 'Sunsprite'
const pageTitle = usePageTitle()

// A standalone docs page's own pageTitle is just its own title ("Sprite",
// "Getting Started", ...) — nothing there says "docs" the way the navbar's
// surrounding UI does (the highlighted Docs button, the breadcrumb), so the
// tab title adds it back as its own segment. Scoped to the 'docs' route
// specifically, not 'docs-search': that page's title is already "Search
// Docs", which reads fine on its own — repeating "Docs" as a second segment
// right after it would just look redundant.
const isDocsPage = computed(() => route.name === 'docs')

watch([pageTitle, isDocsPage], ([title, isDocs]) => {
  // const segments = [title, isDocs ? 'Docs' : null, SITE_NAME].filter((segment): segment is string => !!segment)
  // document.title = segments.join(' | ')
  if (!title) {
    document.title = SITE_NAME
    return
  }
  
  let docTitle = title
  docTitle += ' | ' + SITE_NAME
  if (isDocs) {
    docTitle += ' Docs'
  }

  document.title = docTitle
}, { immediate: true })

// Nuxt UI's components read the `dark`/`light` class off <html> for all
// their color tokens (including teleported ones, like modals, that render
// outside this component's own DOM). Something in the mount pipeline clears
// that class shortly after initial load, so pin it back with an observer
// rather than a one-shot assignment. Reads the *current* theme rather than
// hardcoding `dark` so this stays correct once a light theme exists.
let classObserver: MutationObserver | undefined

function ensureThemeClass() {
  const html = document.documentElement
  const wantDark = !themeStore.current.isLight
  if (html.classList.contains('dark') !== wantDark) {
    html.classList.toggle('dark', wantDark)
    html.classList.toggle('light', !wantDark)
  }
}

onMounted(() => {
  authStore.init()
  themeStore.init()

  ensureThemeClass()
  classObserver = new MutationObserver(ensureThemeClass)
  classObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})

onBeforeUnmount(() => classObserver?.disconnect())
</script>

<template>
  <UApp>
    <div class="wrapper">
      <NavBar class="navbar-header"/>
      <RouterView class="content"/>
      <!-- <NavBar class="navbar-footer"/> -->
    </div>
    <NamePromptModal />
  </UApp>
</template>

<style scoped>
.wrapper {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}
/* Sizing only — no `overflow` here. This class lands on whatever the
   current route's root element is (RouterView forwards `class` the same way
   any other attr falls through), and different views want opposite
   overflow behavior on that same element: DocsView/LandingView/
   DocsSearchResultsView each make their own root the scrollable region
   (`overflow-y: auto` + `height: 100%`), while EditorView wants its root
   clipped (`overflow: hidden`) since its panes each own their own internal
   scroll instead. A shared `overflow-y: hidden` here used to fight whichever
   of those a view declared for itself, with the winner decided by
   unrelated CSS load order rather than either declaration actually meaning
   anything — each view sets its own now. */
.content {
  flex: 1 1 100%;
}
.navbar-header {
  color: var(--theme-text);
  background-color: var(--theme-bg-accented);
  flex: 1;
}
</style>
