<script setup lang="ts">
import { computed } from 'vue'
import { clientVolumeRef, clientMutedRef, setClientVolume, setClientMuted } from '@/sandbox/hostBridge'

// The canvas toolbar's Volume button and the dropdown behind it: a slider and
// a mute toggle for the *client* bus (see api/Sound.ts), the one bus user
// scripts can't reach, so this is the listener's own volume rather than
// anything the game can argue with. All the state lives in hostBridge.ts —
// this component is only the control surface, which is why both toolbars
// around the running game (PhaserCanvas.vue, and PlayView.vue when it stops
// being "coming soon") can mount it and stay in sync with each other.
//
// The slider and the mute toggle stay independent, matching the two bus
// properties they drive: dragging the slider while muted sets the volume the
// game returns to, it doesn't un-mute on the person's behalf.

/**
 * 0..1 sandbox-side; a slider wants whole percent. The setter normalizes
 * because USlider hands back an array when it has multiple thumbs and a
 * scalar when it has one (same reason SettingsPanel.vue's asNumber exists).
 */
const percent = computed({
  get: () => Math.round(clientVolumeRef.value * 100),
  set: (value: number | number[]) => {
    const next = Array.isArray(value) ? value[0] : value
    if (typeof next === 'number' && Number.isFinite(next)) setClientVolume(next / 100)
  },
})

const icon = computed(() => {
  if (clientMutedRef.value) return 'tabler:volume-off'
  if (percent.value === 0) return 'tabler:volume-3'
  if (percent.value < 50) return 'tabler:volume-2'
  return 'tabler:volume'
})

const muteIcon = computed(() => clientMutedRef.value ? 'tabler:volume-off' : 'tabler:volume')
const muteLabel = computed(() => clientMutedRef.value ? 'Unmute' : 'Mute')

// Muting is a state the person needs to notice from the toolbar alone, with
// the dropdown closed — the same warning-subtle treatment Restart uses for
// "there's something here you should know about" (see PhaserCanvas.vue).
const triggerVariant = computed(() => clientMutedRef.value ? 'subtle' : 'ghost')
const triggerColor = computed(() => clientMutedRef.value ? 'warning' : 'neutral')
</script>

<template>
  <UPopover :content="{ align: 'start' }">
    <UButton :icon="icon" :variant="triggerVariant" :color="triggerColor" label="Volume" size="xs" />

    <template #content>
      <div class="volume-popover">
        <UButton
          :icon="muteIcon"
          :color="clientMutedRef ? 'warning' : 'primary'"
          :variant="'subtle'"
          :aria-label="muteLabel"
          :title="muteLabel"
          size="xs"
          @click="setClientMuted(!clientMutedRef)"
        />

        <USlider
          v-model="percent"
          :min="0"
          :max="100"
          :step="1"
          :disabled="clientMutedRef"
          aria-label="Game volume"
          size="xs"
          class="volume-slider"
        />

        <span class="volume-value">{{ percent }}%</span>
      </div>
    </template>
  </UPopover>
</template>

<style scoped>
.volume-popover {
  display: flex;
  align-items: center;
  gap: 0.5em;
  padding: 0.5em 0.6em;
}

.volume-slider {
  width: 120px;
}

.volume-value {
  /* Fixed width so the slider doesn't shift as the number gains digits. */
  width: 3em;
  text-align: right;
  font-variant-numeric: tabular-nums;
  font-size: 0.75rem;
  opacity: 0.8;
}
</style>
