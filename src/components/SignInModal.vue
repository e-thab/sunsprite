<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'

const authStore = useAuthStore()
const themeStore = useThemeStore()

const identifier = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

function reset() {
  identifier.value = ''
  password.value = ''
  errorMessage.value = ''
  loading.value = false
}

async function onSubmit() {
  errorMessage.value = ''
  loading.value = true
  try {
    await authStore.signIn(identifier.value, password.value)
    await themeStore.init()
    reset()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to sign in'
  } finally {
    loading.value = false
  }
}

function goToSignUp() {
  authStore.closeSignIn()
  reset()
  authStore.openSignUp()
}

function onUpdateOpen(open: boolean) {
  if (!open) {
    authStore.closeSignIn()
    reset()
  }
}
</script>

<template>
  <UModal :open="authStore.showSignInModal" title="Sign in" @update:open="onUpdateOpen">
    <template #body>
      <form class="signin-form" @submit.prevent="onSubmit">
        <UFormField label="Email or username">
          <UInput v-model="identifier" type="text" autocomplete="username" required class="full-width" />
        </UFormField>
        <UFormField label="Password">
          <UInput v-model="password" type="password" autocomplete="current-password" required class="full-width" />
        </UFormField>
        <UAlert v-if="errorMessage" color="error" variant="subtle" :description="errorMessage" />
        <UButton type="submit" block :loading="loading">Sign in</UButton>
        <UButton type="button" variant="link" block @click="goToSignUp">
          Don't have an account? Sign up
        </UButton>
      </form>
    </template>
  </UModal>
</template>

<style scoped>
.signin-form {
  display: flex;
  flex-direction: column;
  gap: 1em;
}

.full-width {
  width: 100%;
}
</style>
