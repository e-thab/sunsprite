<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

function reset() {
  email.value = ''
  password.value = ''
  errorMessage.value = ''
  loading.value = false
}

async function onSubmit() {
  errorMessage.value = ''
  loading.value = true
  try {
    await authStore.signIn(email.value, password.value)
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
        <UFormField label="Email">
          <UInput v-model="email" type="email" autocomplete="email" required class="full-width" />
        </UFormField>
        <UFormField label="Password">
          <UInput v-model="password" type="password" autocomplete="current-password" required class="full-width" />
        </UFormField>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <UButton type="submit" block :loading="loading">Sign in</UButton>
        <button type="button" class="signup-link" @click="goToSignUp">
          Don't have an account? Sign up
        </button>
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

.error-message {
  color: #bf616a;
  font-size: 0.9em;
}

.signup-link {
  background: none;
  border: none;
  color: var(--nord-text-bright);
  cursor: pointer;
  font-size: 0.85em;
  text-align: center;
}

.signup-link:hover {
  color: white;
}
</style>
