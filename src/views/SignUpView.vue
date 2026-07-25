<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const router = useRouter()

const displayName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const loading = ref(false)
const awaitingConfirmation = ref(false)

async function onSubmit() {
  errorMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  loading.value = true
  try {
    const { needsEmailConfirmation } = await authStore.signUp(
      email.value,
      password.value,
      displayName.value || undefined,
    )

    if (needsEmailConfirmation) {
      awaitingConfirmation.value = true
    } else {
      router.push('/account')
    }
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to sign up'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="signup-view">
    <div class="signup-card">
      <h1>Create an account</h1>

      <div v-if="awaitingConfirmation" class="confirmation-message">
        <p>Almost there! Check <strong>{{ email }}</strong> for a confirmation link to finish signing up.</p>
        <UButton variant="ghost" @click="router.push('/')">Back to Sunsprite</UButton>
      </div>

      <form v-else class="signup-form" @submit.prevent="onSubmit">
        <UFormField label="Display name (optional)">
          <UInput v-model="displayName" autocomplete="nickname" class="full-width" />
        </UFormField>
        <UFormField label="Email">
          <UInput v-model="email" type="email" autocomplete="email" required class="full-width" />
        </UFormField>
        <UFormField label="Password">
          <UInput v-model="password" type="password" autocomplete="new-password" required class="full-width" />
        </UFormField>
        <UFormField label="Confirm password">
          <UInput v-model="confirmPassword" type="password" autocomplete="new-password" required class="full-width" />
        </UFormField>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <UButton type="submit" block :loading="loading">Sign up</UButton>
        <button type="button" class="signin-link" @click="router.push('/')">
          Already have an account? Sign in
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.signup-view {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--nord-background-neutral);
  color: var(--nord-text-bright);
}

.signup-card {
  width: 100%;
  max-width: 360px;
  padding: 2em;
  border-radius: 8px;
  background-color: var(--nord-background-dark);
}

.signup-card h1 {
  font-size: 1.3em;
  margin-bottom: 1em;
  text-align: center;
}

.signup-form,
.confirmation-message {
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

.signin-link {
  background: none;
  border: none;
  color: var(--nord-text-bright);
  cursor: pointer;
  font-size: 0.85em;
  text-align: center;
}

.signin-link:hover {
  color: white;
}
</style>
