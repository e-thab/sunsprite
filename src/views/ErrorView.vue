<script setup lang="ts">
// clearError() (what UError's built-in "clear" button calls) is a no-op in
// this standalone-Vite setup — it's only meaningful inside real Nuxt SSR.
// Passing `to` here makes the button a real router-link instead, since
// UButton/ULink handle `to` navigation on their own regardless.
withDefaults(defineProps<{
  statusCode?: number
  statusMessage?: string
  message?: string
  backLabel?: string
  backTo?: string
}>(), {
  statusCode: 404,
  statusMessage: 'Page not found',
  message: "The page you're looking for doesn't exist or may have moved.",
  backLabel: 'Back to home',
  backTo: '/',
})
</script>

<template>
  <UError
    icon="tabler:alert-triangle-filled"
    :error="{ statusCode, statusMessage, message }"
    :ui="{ statusMessage: 'mt-6', message: 'mt-6', links: 'mt-12' }"
    :clear="{ label: backLabel, to: backTo, color: 'primary', size: 'xl', icon: 'tabler:arrow-left', /* class: 'rounded-full' */ }"
  />
</template>
