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
      path: '/projects/:slug',
      name: 'project',
      component: () => import('../views/ProjectEditorView.vue'),
      meta: { requiresAuth: true },
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
