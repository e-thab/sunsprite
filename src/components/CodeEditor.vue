<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { runUserCode, startCode } from '@/assets/api/core';
import { completions } from '@/assets/code-completion/codemirror-completions';
import { Codemirror } from 'vue-codemirror';
import { javascript } from '@codemirror/lang-javascript'
import { wordHover } from '@/assets/code-completion/codemirror-completions'
import { nord } from '@fsegurai/codemirror-theme-nord'
import { oneDark } from '@codemirror/theme-one-dark'

const code = ref(startCode)
const js = javascript()

const extensions = [
	js,
    js.language.data.of({
		autocomplete: completions
    }),
	wordHover,
    // oneDark,
	nord,
]

function runActiveUserCode() {
  runUserCode(code.value)
}
defineExpose({ runActiveUserCode })
</script>

<template>
	<div style="display: flex; flex-direction: column;">
		<div class="editor-bar">
			&nbsp;
			<!-- <button @click="runActiveUserCode" class="run-button">Run</button> -->
		</div>
		<div id="code-container" class="editor">
			<codemirror
			v-model="code"
			placeholder="..."
			:autofocus="true"
			:indent-with-tab="true"
			:tab-size="4"
			:extensions="extensions"
			:style="{
				maxHeight: '100%',
			}"
			/>
		</div>
	</div>
</template>

<style scoped>
.editor {
	flex: 1 1 auto;
	background-color: var(--nord-background-dark);
	overflow: auto;
}
.editor-bar {
	display: flex;
	justify-content: space-evenly;
	background-color: var(--nord-background-dark);
	height: 24px;
}
.run-button {
	height: 100%;
	width: 50px;
}
</style>