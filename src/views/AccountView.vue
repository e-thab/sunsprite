<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/assets/utils/supabase'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const router = useRouter()

const displayName = ref('')
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const savedMessage = ref('')

async function loadProfile() {
  if (!authStore.user) return
  loading.value = true

  const { data, error } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', authStore.user.id)
    .maybeSingle()

  if (error) {
    errorMessage.value = error.message
  } else {
    displayName.value = data?.display_name ?? ''
  }
  loading.value = false
}

async function saveProfile() {
  if (!authStore.user) return
  saving.value = true
  errorMessage.value = ''
  savedMessage.value = ''

  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName.value || null })
    .eq('id', authStore.user.id)

  if (error) {
    errorMessage.value = error.message
  } else {
    savedMessage.value = 'Saved'
  }
  saving.value = false
}

async function onSignOut() {
  await authStore.signOut()
  router.push('/')
}

onMounted(loadProfile)
</script>

<template>
  <div class="account-view">
    <div class="account-card">
      <h1>Account</h1>

      <p class="email">{{ authStore.user?.email }}</p>

      <template v-if="!loading">
        <UFormField label="Display name">
          <UInput v-model="displayName" class="full-width" @keyup.enter="saveProfile" />
        </UFormField>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        <p v-if="savedMessage" class="saved-message">{{ savedMessage }}</p>
        <UButton block :loading="saving" @click="saveProfile">Save</UButton>
      </template>

      <div class="account-actions">
        <UButton variant="ghost" @click="router.push('/projects')">My Projects</UButton>
        <UButton variant="ghost" color="error" @click="onSignOut">Sign out</UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.account-view {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--nord-background-neutral);
  color: var(--nord-text-bright);
}

.account-card {
  width: 100%;
  max-width: 360px;
  padding: 2em;
  border-radius: 8px;
  background-color: var(--nord-background-dark);
  display: flex;
  flex-direction: column;
  gap: 1em;
}

.account-card h1 {
  font-size: 1.3em;
  text-align: center;
}

.email {
  text-align: center;
  color: var(--nord-text-dim);
}

.full-width {
  width: 100%;
}

.error-message {
  color: #bf616a;
  font-size: 0.9em;
}

.saved-message {
  color: #a3be8c;
  font-size: 0.9em;
}

.account-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 1em;
}
</style>
