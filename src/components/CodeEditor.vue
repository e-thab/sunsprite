<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { /*runUserCode,*/ print } from '@/assets/api/core';
import { runUserCode } from '@/assets/api/core';
import { completions } from '@/assets/code-completion/codemirror-completions';
import { Codemirror } from 'vue-codemirror';
import { javascript } from '@codemirror/lang-javascript'
import { wordHover } from '@/assets/code-completion/codemirror-completions'
import { nord } from '@fsegurai/codemirror-theme-nord'
import { oneDark } from '@codemirror/theme-one-dark'
import { useFileStore } from '@/stores/fileStore';
import { getExampleCode } from '@/assets/api/examples';

const code = ref('')
const js = javascript()
const fileStore = useFileStore()

// const isSaved = ref(true)
const saveColor = computed(() => {
	const rootStyles = window.getComputedStyle(document.documentElement)
	const nordTextBright = rootStyles.getPropertyValue('--nord-text-bright').trim()
	const nordTextDim = rootStyles.getPropertyValue('--nord-text-dim').trim()

	return fileStore.activeFileIsSaved ? nordTextDim : nordTextBright
})
const saveCursor = computed(() => {
	return fileStore.activeFileIsSaved ? 'default' : 'pointer'
})

const saveBtnFilter = computed(() => {
	return fileStore.activeFileIsSaved ? 'brightness(0.3) sepia(1) saturate(0.8) hue-rotate(180deg)' : 'brightness(0.8) sepia(0) saturate(0.8) hue-rotate(180deg)'
})
const saveBtnHoverFilter = computed(() => {
	return fileStore.activeFileIsSaved ? 'brightness(0.3) sepia(1) saturate(0.8) hue-rotate(180deg)' : 'brightness(1) sepia(0) saturate(0.8) hue-rotate(180deg)'
})

const saveMsgFilter = computed(() => {
	return fileStore.activeFileIsSaved ? '' : 'brightness(0.8)'
})
const saveMsgHoverFilter = computed(() => {
	return fileStore.activeFileIsSaved ? '' : 'brightness(1)'
})

const extensions = [
	js,
    js.language.data.of({
		autocomplete: completions
    }),
	wordHover,
    // oneDark,
	nord,
]

function getCode(): string {
	return code.value
}

function setCode(newCode: string) {
	code.value = newCode
}

function resetCode() {
	if (!confirm('Reset editor code to default?')) return
	code.value = getExampleCode(fileStore.activeFileName)
	updateSaveMsg()
}

function saveCurrentCode() {
	if (fileStore.activeFileIsSaved) return
	fileStore.saveCode(fileStore.activeFileName, code.value)
	updateSaveMsg(code.value)
}

function runActiveUserCode() {
	runUserCode(code.value)
}

function updateSaveMsg(checkCode?: string) {
	const saveElement = document.getElementById('save-msg')
	if (!saveElement) return

	const activeFile = fileStore.activeFileName
	const currentCode = checkCode ?? code.value
	const savedCode = fileStore.getLocalCode(activeFile)

	fileStore.activeFileIsSaved = currentCode === savedCode
	if (fileStore.activeFileIsSaved) {
		if (fileStore.savedThisSession(activeFile)) {
			saveElement.innerText = `Saved ${fileStore.getTimeSaved(activeFile)}`
		} else {
			saveElement.innerText = 'Unchanged'
		}
	} else {
		saveElement.innerText = 'Save'
	}
}

defineExpose({ runActiveUserCode, setCode, getCode, updateSaveMsg })

onMounted(() => {
	fileStore.activate('main.js')
	code.value = fileStore.getLocalCode('main.js') ?? getExampleCode()
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
		<div id="editor-bar">
			<div style="display: inline-flex; justify-self: start; padding-left: 10px;">
				<img id="save-btn" class="img-button" @click="saveCurrentCode" title="Save" src="/src/assets/images/game-icons/save.png" />
				<div id="save-msg" @click="saveCurrentCode"></div>
			</div>
			<div id="file-name">{{ fileStore.activeFileName }}</div>
			<img class="img-button"  style="justify-self: end; padding-right: 10px;" @click="resetCode" title="Reset code to default" src="/src/assets/images/game-icons/previous.png" />
			<!-- <button @click="runActiveUserCode" class="run-button">Run</button> -->
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

#editor-bar {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	justify-items: center;
	/* border-bottom: 20px; */
}

#file-name {
	color: var(--nord-text-bright);
}

.run-button {
	height: 100%;
	width: 50px;
}

#save-msg {
	/* flex: 1 1 auto; */
	padding-left: 10px;
	color: v-bind(saveColor);
	filter: v-bind(saveMsgFilter);
	transition: color 0.25s ease-in;
	cursor: v-bind(saveCursor);
}
#save-msg:hover {
	filter: v-bind(saveMsgHoverFilter);
}

#save-btn {
	filter: v-bind(saveBtnFilter);
	transition: all 0.25s ease-in;
	cursor: v-bind(saveCursor);
	/* filter: saturate(1); */
	/* filter: hue-rotate(180deg); */
	/* filter: brightness(0.4) */
}
#save-btn:hover {
	filter: v-bind(saveBtnHoverFilter)
}

/* .save-info {

} */
</style>