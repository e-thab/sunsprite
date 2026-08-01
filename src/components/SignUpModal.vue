<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/assets/utils/supabase'

const authStore = useAuthStore()
const router = useRouter()

const usernamePattern = /^[a-z0-9_]{3,20}$/

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const usernameError = ref<string | undefined>(undefined)
const loading = ref(false)
const checkingUsername = ref(false)
const awaitingConfirmation = ref(false)

function reset() {
  username.value = ''
  email.value = ''
  password.value = ''
  confirmPassword.value = ''
  errorMessage.value = ''
  usernameError.value = undefined
  loading.value = false
  checkingUsername.value = false
  awaitingConfirmation.value = false
}

async function checkUsername() {
  usernameError.value = undefined
  if (!username.value) return

  if (!usernamePattern.test(username.value)) {
    usernameError.value = 'Lowercase letters, numbers, and underscores only (3-20 characters)'
    return
  }

  checkingUsername.value = true
  const { data, error } = await supabase.rpc('is_username_taken', { check_username: username.value })
  checkingUsername.value = false

  if (!error && data) usernameError.value = 'That username is taken'
}

async function onSubmit() {
  errorMessage.value = ''

  if (!usernamePattern.test(username.value)) {
    usernameError.value = 'Lowercase letters, numbers, and underscores only (3-20 characters)'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match'
    return
  }

  loading.value = true
  try {
    const { needsEmailConfirmation } = await authStore.signUp(
      email.value,
      password.value,
      username.value,
    )

    if (needsEmailConfirmation) {
      awaitingConfirmation.value = true
    } else {
      authStore.closeSignUp()
      reset()
      router.push('/account')
    }
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to sign up'
  } finally {
    loading.value = false
  }
}

function goToSignIn() {
  authStore.closeSignUp()
  reset()
  authStore.openSignIn()
}

function onUpdateOpen(open: boolean) {
  if (!open) {
    authStore.closeSignUp()
    reset()
  }
}
</script>

<template>
  <UModal :open="authStore.showSignUpModal" title="Create an account" @update:open="onUpdateOpen">
    <template #body>
      <div v-if="awaitingConfirmation" class="confirmation-message">
        <UAlert
          color="success"
          variant="subtle"
          title="Almost there!"
          :description="`Check ${email} for a confirmation link to finish signing up.`"
        />
        <UButton variant="ghost" @click="onUpdateOpen(false)">Close</UButton>
      </div>
      <form v-else class="sign-up-form" @submit.prevent="onSubmit">
        <UFormField label="Username" :error="usernameError" help="Lowercase letters, numbers, underscores">
          <UInput
            v-model="username"
            autocomplete="username"
            spellcheck="false"
            required
            class="full-width"
            :loading="checkingUsername"
            @blur="checkUsername"
          />
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
        <UAlert v-if="errorMessage" color="error" variant="subtle" :description="errorMessage" />
        <UButton type="submit" block :loading="loading">Sign up</UButton>
        <UButton type="button" variant="link" block @click="goToSignIn">
          Already have an account? Sign in
        </UButton>
      </form>
    </template>
  </UModal>
</template>

<style scoped>
.sign-up-form,
.confirmation-message {
  display: flex;
  flex-direction: column;
  gap: 1em;
}

.full-width {
  width: 100%;
}
</style>
