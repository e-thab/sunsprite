<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { fpsRef, mouseRef, pausedRef, pause, play } from '@/sandbox/hostBridge'
import { useFullscreenStore } from '@/stores/fullscreen'
import { useFileStore } from '@/stores/fileStore'
import GameFrame from '@/components/GameFrame.vue'
import CollapsiblePane from './CollapsiblePane.vue'
import Output from '@/assets/api/output'
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
function togglePlayPause() {
  if (pausedRef.value) {
    play()
  } else {
    pause()
  }
}

const fullscreenIcon = computed(() => fullscreenStore.fullscreen ? 'tabler:minimize' : 'tabler:maximize')
const fullscreenTooltip = computed(() => fullscreenStore.fullscreen ? 'Minimize' : 'Maximize')

const restartVariant = computed(() => fileStore.codeChangedSinceLastRun ? 'subtle' : 'ghost')
const restartColor = computed(() => fileStore.codeChangedSinceLastRun ? 'warning' : 'neutral')

const emit = defineEmits(['ready', 'runGame', 'fullscreen'])
</script>

<template>
  <CollapsiblePane label="Game" icon="streamline-plump:controller-1-solid">
  <div class="panel-wrapper">
    <div class="panel-bar">
      <!-- Play / Pause -->
      <!-- <UTooltip :text="playPauseLabel"> -->
        <UButton :icon="playPauseIcon" variant="subtle" color="primary" :label="playPauseLabel" size="xs" @click="togglePlayPause" />
      <!-- </UTooltip> -->

      <!-- Restart / Run code -->
      <UChip inset color="warning" :show="fileStore.codeChangedSinceLastRun">
        <!-- <UTooltip text="Restart"> -->
          <UButton icon="tabler:refresh" :variant="restartVariant" :color="restartColor" label="Restart" size="xs" @click="onRestartClick" />
        <!-- </UTooltip> -->
      </UChip>

      <!-- Sound -->
      <!-- Icon should change based on volume -->
      <!-- <UTooltip text="Volume"> -->
        <UButton icon="tabler:volume" variant="ghost" color="neutral" label="Volume" size="xs" @click="Output.print('sound')" />
      <!-- </UTooltip> -->

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
      <UBadge color="primary" variant="outline">FPS: <span class="fps-number">{{ fpsRef }}</span></UBadge>
    </div>

    <GameFrame @ready="$emit('ready')" />
  </div>
  </CollapsiblePane>
</template>

<style scoped>
.fps-number {
  color: v-bind(fpsColor)
}

.coords-badge {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5em;
  width: 180px;
}
</style>
