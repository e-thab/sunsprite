<script setup lang="ts">
import { Splitpanes, Pane } from 'splitpanes';
import { resizeStage } from '@/assets/api';
import PixiCanvas from '@/components/PixiCanvas.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import { onMounted } from 'vue';

async function resizeOnReady() {
  await new Promise(resolve => setTimeout(resolve, 300))
  resizeStage()
}

onMounted(() => {
  resizeOnReady()
})
</script>

<template>
  <splitpanes
    class="default-theme"
    :push-other-panes="false"
    @resize="resizeStage()"
  >
    <!-- Left side pane: File explorer -->
    <pane size="12">
      <div>Files</div>
    </pane>

    <!-- Center pane: Code editor -->
    <pane size="44" min-size="15">
      <CodeEditor ref="editor" class="inner-pane"/>
    </pane>

    <!-- Right side pane: Nested game/output splitpanes -->
    <pane size="44" min-size="15">
      <splitpanes
        horizontal
        :push-other-panes="false"
        @resize="resizeStage()"
      >
        <!-- Top right pane: Game view -->
        <pane size="80" min-size="60">
          <PixiCanvas ref="canvas" class="inner-pane"/>
        </pane>

        <!-- Bottom left pane: Output -->
        <pane size="20">
          <div>Output</div>
        </pane>
      </splitpanes>
    </pane>
  </splitpanes>
</template>

<style scoped>
.inner-pane {
  width: 100%;
  height: 100%;
}
</style>