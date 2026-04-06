<script setup lang="ts">
import { Splitpanes, Pane } from 'splitpanes';
import { resizeStage } from '@/assets/api';
import { onMounted } from 'vue';
import PixiCanvas from '@/components/PixiCanvas.vue'
import CodeEditor from '@/components/CodeEditor.vue'
import Output from '@/components/Output.vue';

async function resizeAfterSplitpaneAnimation() {
  await new Promise(resolve => setTimeout(resolve, 200))
  resizeStage()
}

onMounted(() => {
  resizeAfterSplitpaneAnimation()
})
</script>

<template>
  <splitpanes
  :push-other-panes="false"
  @resize="resizeStage()"
  >
  <!-- class="default-theme" -->
    <!-- Left side pane: File explorer -->
    <pane size="12">
      <span>Files</span>
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
          <Output />
        </pane>
      </splitpanes>
    </pane>
  </splitpanes>
</template>

<style>
.inner-pane {
  width: 100%;
  height: 100%;
}

.splitpanes {
  background-color: #101212;
}

.splitpanes__pane {
  /* background: linear-gradient(-45deg, #EE7752, #E73C7E, #23A6D5, #23D5AB); */
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.05) inset;
  justify-content: center;
  align-items: center;
  display: flex;
}

.splitpanes--vertical > .splitpanes__splitter {
  background-color: #23252b;
  min-width: 6px;
}

.splitpanes--horizontal > .splitpanes__splitter {
  background-color: #23252b;
  min-height: 6px;
}
</style>