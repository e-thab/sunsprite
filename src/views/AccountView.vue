<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/assets/utils/supabase'
import { useAuthStore } from '@/stores/authStore'

const usernamePattern = /^[a-z0-9_]{3,20}$/

const authStore = useAuthStore()
const router = useRouter()

const username = ref('')
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const usernameError = ref<string | undefined>(undefined)
const savedMessage = ref('')

const newEmail = ref('')
const emailSaving = ref(false)
const emailErrorMessage = ref('')
const emailSavedMessage = ref('')

async function loadProfile() {
  if (!authStore.user) return
  loading.value = true

  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', authStore.user.id)
    .maybeSingle()

  if (error) {
    errorMessage.value = error.message
  } else {
    username.value = data?.username ?? ''
  }
  loading.value = false
}

async function saveProfile() {
  if (!authStore.user) return
  errorMessage.value = ''
  usernameError.value = undefined
  savedMessage.value = ''

  if (username.value && !usernamePattern.test(username.value)) {
    usernameError.value = 'Lowercase letters, numbers, and underscores only (3-20 characters)'
    return
  }

  saving.value = true

  const { error } = await supabase
    .from('profiles')
    .update({ username: username.value || null })
    .eq('id', authStore.user.id)

  if (error) {
    if (error.code === '23505') usernameError.value = 'That username is already taken'
    else errorMessage.value = error.message
  } else {
    savedMessage.value = 'Saved'
    authStore.setUsername(username.value || null)
  }
  saving.value = false
}

async function changeEmail() {
  emailErrorMessage.value = ''
  emailSavedMessage.value = ''

  if (!newEmail.value) return

  emailSaving.value = true
  try {
    await authStore.updateEmail(newEmail.value)
    emailSavedMessage.value = `Check both ${authStore.user?.email} and ${newEmail.value} for confirmation links to finish the change.`
    newEmail.value = ''
  } catch (err) {
    emailErrorMessage.value = err instanceof Error ? err.message : 'Failed to update email'
  } finally {
    emailSaving.value = false
  }
}

async function onSignOut() {
  await authStore.signOut()
  router.push('/')
}

onMounted(loadProfile)
</script>

<template>
  <div class="account-view">
    <UCard class="account-card">
      <template #header>
        <h1>Account</h1>
        <p class="email">{{ authStore.user?.email }}</p>
      </template>

      <div class="account-body">
        <template v-if="!loading">
          <UFormField label="Username" :error="usernameError" help="Lowercase letters, numbers, underscores">
            <UInput v-model="username" autocomplete="username" spellcheck="false" class="full-width" @keyup.enter="saveProfile" />
          </UFormField>
          <UAlert v-if="errorMessage" color="error" variant="subtle" :description="errorMessage" />
          <UAlert v-if="savedMessage" color="success" variant="subtle" :description="savedMessage" />
          <UButton block :loading="saving" @click="saveProfile">Save</UButton>

          <UFormField label="Change email">
            <UInput v-model="newEmail" type="email" autocomplete="email" placeholder="New email address" class="full-width" @keyup.enter="changeEmail" />
          </UFormField>
          <UAlert v-if="emailErrorMessage" color="error" variant="subtle" :description="emailErrorMessage" />
          <UAlert v-if="emailSavedMessage" color="success" variant="subtle" :description="emailSavedMessage" />
          <UButton block variant="soft" :loading="emailSaving" @click="changeEmail">Update email</UButton>
        </template>
      </div>

      <template #footer>
        <div class="account-actions">
          <UButton variant="ghost" @click="() => { router.push('/projects') }">My Projects</UButton>
          <UButton variant="ghost" color="error" @click="onSignOut">Sign out</UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>

<style scoped>
.account-view {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--theme-bg-elevated);
}

.account-card {
  width: 100%;
  max-width: 360px;
}

.account-card h1 {
  font-size: 1.3em;
  text-align: center;
}

.email {
  text-align: center;
  color: var(--ui-text-muted);
  margin-top: 0.25em;
}

.account-body {
  display: flex;
  flex-direction: column;
  gap: 1em;
}

.full-width {
  width: 100%;
}

.account-actions {
  display: flex;
  justify-content: space-between;
}
</style>
