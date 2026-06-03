<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { /*runUserCode,*/ startCode, print } from '@/assets/api/core';
import { runUserCode } from '@/assets/api/core';
import { completions } from '@/assets/code-completion/codemirror-completions';
import { Codemirror } from 'vue-codemirror';
import { javascript } from '@codemirror/lang-javascript'
import { wordHover } from '@/assets/code-completion/codemirror-completions'
import { nord } from '@fsegurai/codemirror-theme-nord'
import { oneDark } from '@codemirror/theme-one-dark'

const code = ref(startCode)
const js = javascript()
const isSaved = ref(true)

let lastSavedAt = ''

const extensions = [
	js,
    js.language.data.of({
		autocomplete: completions
    }),
	wordHover,
    // oneDark,
	nord,
]

function setCode(newCode: string) {
	code.value = newCode
}

function resetCode() {
	if (!confirm('Reset editor code to default?')) return
	code.value = startCode
}

function saveCurrentCode() {
	lastSavedAt = new Date().toLocaleTimeString()
	localStorage.setItem('code', code.value)
	updateSaveMsg()
}

function runActiveUserCode() {
	runUserCode(code.value)
}

function updateSaveMsg(checkCode?: string) {
	const saveElement = document.getElementById('save-msg')
	if (!saveElement) return

	const currentCode = checkCode ?? code.value
	const savedCode = localStorage.getItem('code')

	isSaved.value = currentCode === savedCode
	if (isSaved.value) {
		saveElement.innerText = `Saved ${lastSavedAt}`
	} else {
		saveElement.innerText = `Saved`
	}
}

defineExpose({ runActiveUserCode, setCode })

onMounted(() => {
	code.value = localStorage.getItem('code') ?? startCode
	runActiveUserCode()
	updateSaveMsg()
})

// TODO: 
// 	- Save info element next to save button (last save time, changed, color-coding)
//	- Visual indicator of save state (is saved/edited) / progress / completion
//	- Visual indicator that the game already running is not using the edited code (coloring the game reset button?)
</script>

<template>
	<div class="panel-wrapper">
		<div class="panel-bar">
			<!-- <button @click="runActiveUserCode" class="run-button">Run</button> -->
			<span v-show="isSaved" id="save-msg"></span>
			<img v-show="!isSaved" class="img-button" style="margin-left: 10px;" @click="saveCurrentCode" title="Save" src="/src/assets/images/game-icons/save.png" />
			<!-- <img class="img-button" @click="resetCode" title="Reset code to default" src="/src/assets/images/game-icons/previous.png" /> -->
		</div>
		<div id="code-container" class="editor">
			<codemirror
				v-model="code"
				placeholder="/* ... */"
				:indent-with-tab="true"
				:tab-size="4"
				:extensions="extensions"
				:autofocus="true"
				:style="{
					maxHeight: '100%'
				}",
				@change="updateSaveMsg"
			/>
		</div>
	</div>
</template>

<style scoped>
.editor {
	flex: 1 1 auto;
	overflow: auto;
}

.editor-bar {
	/* display: flex;
	justify-content: space-evenly;
	background-color: var(--nord-background-dark);
	min-height: 24px; */
	border-bottom: 20px;
}

.run-button {
	height: 100%;
	width: 50px;
}

#save-msg {
	flex: 1 1 auto;
	padding-left: 10px;
	color: var(--nord-text-dim);
}

/* .save-info {

} */
</style>