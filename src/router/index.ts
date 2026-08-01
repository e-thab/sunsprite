import { createRouter, createWebHistory } from 'vue-router'
import EditorView from '../views/EditorView.vue'
import { useAuthStore } from '@/stores/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: EditorView,
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
