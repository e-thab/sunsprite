<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { fpsRef, mouseRef, pausedRef, pause, play } from '@/sandbox/hostBridge'
import { useFullscreenStore } from '@/stores/fullscreen'
import { useFileStore } from '@/stores/fileStore'
import GameFrame from '@/components/GameFrame.vue'
import CollapsiblePane from './CollapsiblePane.vue'
import VolumeControl from './VolumeControl.vue'
import Output from '@/api/output'
import { releaseButtonFocus } from '@/utils/releaseButtonFocus'
// import { AUTO, Game, Scene, type Types } from 'phaser'

const fpsColor = ref()
const fullscreenStore = useFullscreenStore()
const fileStore = useFileStore()

function onRestartClick() {
  emit('runGame')
}

// The sandbox reports its frame rate on its own cadence, so this just recolors
// the badge whenever a new reading lands instead of polling the game itself.
watch(fpsRef, (fps) => {
  if (fps >= 55) {
    fpsColor.value = 'SpringGreen'
  } else if (fps >= 30) {
    fpsColor.value = 'PaleGreen'
  } else if (fps >= 20) {
    fpsColor.value = 'Khaki'
  } else if (fps >= 10) {
    fpsColor.value = 'Gold'
  } else {
    fpsColor.value = 'Tomato'
  }
}, { immediate: true })

const playPauseIcon = computed(() => pausedRef.value ? 'tabler:player-play-filled' : 'tabler:player-pause-filled')
const playPauseLabel = computed(() => pausedRef.value ? 'Play' : 'Pause')
const playPauseColor = computed(() => pausedRef.value ? 'warning' : 'neutral')
const playPauseVariant = computed(() => pausedRef.value ? 'subtle' : 'ghost')
function togglePlayPause() {
  if (pausedRef.value) {
    play()
  } else {
    pause()
  }
}

const fullscreenIcon = computed(() => fullscreenStore.fullscreen ? 'tabler:minimize' : 'tabler:maximize')
const fullscreenTooltip = computed(() => fullscreenStore.fullscreen ? 'Minimize' : 'Maximize')

const restartVariant = computed(() => fileStore.mainChangedSinceLastRun ? 'subtle' : 'ghost')
const restartColor = computed(() => fileStore.mainChangedSinceLastRun ? 'warning' : 'neutral')

const emit = defineEmits(['ready', 'runGame', 'fullscreen'])
</script>

<template>
  <CollapsiblePane label="Game" icon="streamline-plump:controller-1-solid">
  <div class="panel-wrapper">
    <!-- Buttons give focus back after a click, so Space reaches the game
         instead of re-clicking them (see releaseButtonFocus). -->
    <div class="panel-bar" @click="releaseButtonFocus">
      <!-- Play / Pause -->
      <!-- <UTooltip :text="playPauseLabel"> -->
        <UButton :icon="playPauseIcon" :variant="playPauseVariant" :color="playPauseColor" :label="playPauseLabel" size="xs" @click="togglePlayPause" />
      <!-- </UTooltip> -->

      <!-- Restart / Run code -->
      <UChip inset color="warning" :show="fileStore.mainChangedSinceLastRun">
        <!-- <UTooltip text="Restart"> -->
          <UButton icon="tabler:refresh" :variant="restartVariant" :color="restartColor" label="Restart" size="xs" @click="onRestartClick" />
        <!-- </UTooltip> -->
      </UChip>

      <!-- Sound: volume slider + mute for the client bus. Its own component
           so PlayView.vue's toolbar can show the same control. -->
      <VolumeControl />

      <!-- Fullscreen toggle -->
      <!-- <UTooltip :text="fullscreenTooltip"> -->
        <UButton :icon="fullscreenIcon" variant="ghost" color="neutral" :label="fullscreenTooltip" size="xs" @click="$emit('fullscreen')" />
      <!-- </UTooltip> -->

      <!-- Settings -->
      <!-- <UTooltip text="Settings"> -->
        <UButton icon="tabler:settings-filled" variant="ghost" color="neutral" label="Settings" size="xs" @click="Output.print('settings')" />
      <!-- </UTooltip> -->

      <!-- mouseX/Y -->
      <!-- <UBadge color="neutral" variant="soft" class="coords-badge">
        <span>mouse X: {{ mouseRef.mouseX }}</span>
        <span>mouse Y: {{ mouseRef.mouseY }}</span>
      </UBadge> -->

      <!-- FPS indicator -->
      <UBadge class="fps-badge" color="neutral" variant="subtle">FPS: {{ fpsRef }}</UBadge>
    </div>

    <GameFrame @ready="$emit('ready')" />
  </div>
  </CollapsiblePane>
</template>

<style scoped>
/* fpsColor is a CSS named color, not one of the theme's, so it can't go
   through UBadge's color prop. This redoes what the subtle variant does with
   a theme color (bg-{color}/10, ring-{color}/25) by hand, over the neutral
   subtle badge's defaults; unlayered, so it outranks those utilities. The
   text keeps the neutral badge's color. */
.fps-badge {
  background-color: color-mix(in srgb, v-bind(fpsColor) 10%, transparent);
  --tw-ring-color: color-mix(in srgb, v-bind(fpsColor) 25%, transparent);
}

.coords-badge {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5em;
  width: 180px;
}
</style>
