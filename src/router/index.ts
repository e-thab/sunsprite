import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: LandingView,
    },
    {
      // A faux-project accessible without signing in — same EditorView as a
      // real project, just never given a projectId, so fileStore's guest
      // mode (see getLocalCode/saveCode) reads and writes localStorage
      // instead of Supabase.
      path: '/sandbox',
      name: 'sandbox',
      component: () => import('../views/EditorView.vue'),
    },
    {
      path: '/account',
      name: 'account',
      component: () => import('../views/AccountView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('../views/ProjectsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/edit/:slug',
      name: 'edit',
      component: () => import('../views/ProjectEditorView.vue'),
      meta: { requiresAuth: true },
      props: true,
    },
    {
      // Old individual-project URL — kept as a redirect rather than a dead
      // link for anything already bookmarked/shared before the /edit rename.
      path: '/projects/:slug',
      redirect: (to) => `/edit/${to.params.slug}`,
    },
    {
      // Fullscreen, editor-free player for a single project — no requiresAuth,
      // since a public project must be playable by a signed-out guest. Access
      // is enforced by RLS instead (see the is_public policies in
      // supabase/migrations): a private project's row simply doesn't resolve
      // for anyone but its owner, the same way a nonexistent slug wouldn't.
      path: '/play/:slug',
      name: 'play',
      component: () => import('../views/PlayView.vue'),
      props: true,
    },
    {
      // Must come before the docs catch-all below, or it swallows "search"
      // as a doc path segment instead.
      path: '/docs/search',
      name: 'docs-search',
      component: () => import('../views/DocsSearchResultsView.vue'),
    },
    {
      // There's no doc node at the docs root itself, so land on the first page instead
      // of the 404 the catch-all below would otherwise show.
      path: '/docs',
      redirect: '/docs/getting-started',
    },
    {
      path: '/docs/:pathMatch(.*)*',
      name: 'docs',
      component: () => import('../views/DocsView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/ErrorView.vue'),
    },
  ],
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true

  const authStore = useAuthStore()
  await authStore.ready

  if (!authStore.isAuthenticated) {
    authStore.openSignIn()
    return { name: 'home' }
  }

  return true
})

export default router
