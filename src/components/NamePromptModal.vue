<script setup lang="ts">
import { computed } from 'vue'
import { useNamePromptStore } from '@/stores/namePromptStore'

const namePromptStore = useNamePromptStore()

const remaining = computed(() => namePromptStore.options.maxLength - namePromptStore.value.length)
const nearLimit = computed(() => remaining.value <= 5)
const canConfirm = computed(() => namePromptStore.value.trim().length > 0)

// UModal emits this for every close, whatever the cause (X button, overlay
// click, Escape) — Confirm calls namePromptStore.confirm() itself and that
// already sets open to false, so by the time this fires for *that* case
// there's no pending resolver left for cancel() to redundantly settle.
function onUpdateOpen(isOpen: boolean) {
	if (!isOpen) namePromptStore.cancel()
}
</script>

<template>
	<UModal
		:open="namePromptStore.open"
		:title="namePromptStore.options.title"
		:description="namePromptStore.options.description"
		@update:open="onUpdateOpen"
	>
		<template #body>
			<form id="name-prompt-form" @submit.prevent="namePromptStore.confirm">
				<UInput
					v-model="namePromptStore.value"
					autofocus
					autocomplete="off"
					:maxlength="namePromptStore.options.maxLength"
					class="name-prompt-input"
				/>
				<div class="name-prompt-count" :class="{ 'name-prompt-count--limit': nearLimit }">
					{{ namePromptStore.value.length }} / {{ namePromptStore.options.maxLength }}
				</div>
			</form>
		</template>

		<template #footer>
			<div class="name-prompt-actions">
				<UButton variant="ghost" color="neutral" @click="namePromptStore.cancel">Cancel</UButton>
				<UButton :disabled="!canConfirm" @click="namePromptStore.confirm">{{ namePromptStore.options.confirmLabel ?? 'Confirm' }}</UButton>
			</div>
		</template>
	</UModal>
</template>

<style scoped>
.name-prompt-input {
	width: 100%;
}

.name-prompt-count {
	margin-top: 0.35em;
	text-align: right;
	font-size: 0.8em;
	color: var(--theme-text-toned);
}

.name-prompt-count--limit {
	color: var(--theme-warning);
}

.name-prompt-actions {
	display: flex;
	justify-content: flex-end;
	gap: 0.5em;
	width: 100%;
}
</style>
