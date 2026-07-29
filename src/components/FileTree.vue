<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TreeItem } from '@nuxt/ui'
import { useFileStore } from '@/stores/fileStore'

const fileStore = useFileStore()

const emit = defineEmits<{
	selectScript: [fileName: string]
}>()

// Reads the script name from the item's own data rather than the clicked
// element's rendered text — the label slot appends a "*" for unsaved
// files, which would otherwise get emitted as part of the file name. The
// template invokes this with (event, item) even though TreeItem.onSelect's
// declared type only requires the event, so item is typed optional here.
function selectHandler(_event: any, item?: TreeItem) {
	if (item?.label) emit('selectScript', item.label)
}

// https://icones.js.org/collection/tabler
// https://icones.js.org/collection/catppuccin

// icon: 'catppuccin:image'
// icon: 'catppuccin:svg'

const guestItems: TreeItem[] = [
	{
		label: 'images',
		defaultExpanded: false,
		children: [
			{
				label: 'animals',
				defaultExpanded: false,
				children: [
					{
						label: 'elephant.png',
						icon: './images/animals/elephant.png'
					},
					{
						label: 'giraffe.png',
						icon: './images/animals/giraffe.png'
					},
					{
						label: 'hippo.png',
						icon: './images/animals/hippo.png'
					},
					{
						label: 'monkey.png',
						icon: './images/animals/monkey.png'
					},
				]
			},
			{
				label: 'cards',
				defaultExpanded: false,
				children: [
					{
						label: 'back.png',
						icon: './images/animals/back.png'
					},
					{
						label: 'clubs_02.png',
						icon: './images/animals/clubs_02.png'
					},
					{
						label: 'clubs_03.png',
						icon: './images/animals/clubs_03.png'
					},
					{
						label: 'clubs_04.png',
						icon: './images/animals/clubs_04.png'
					},
					{
						label: 'clubs_05.png',
						icon: './images/animals/clubs_05.png'
					},
				]
			},
		]
	},

	// {
	//   label: 'Sounds',
	//   defaultExpanded: true,
	//   children: [
	//     {
	//       label: 'sound.wav',
	//       icon: 'catppuccin:audio'
	//     },
	//   ]
	// },

	{
		label: 'scripts',
		defaultExpanded: true,
		children: [
			// {
			//   label: 'main.ts',
			//   icon: 'catppuccin:typescript'
			// },
			{
				label: 'examples',
				defaultExpanded: true,
				children: [
					{
						label: 'input.js',
						icon: 'catppuccin:javascript',
						onSelect: () => emit('selectScript', 'input.js'),
					}
					// {
					//   label: 'labels.js',
					//   icon: 'catppuccin:javascript',
					//   onSelect: (event) => {
					//     if (event.target) emit('selectScript', (event.target as HTMLElement).innerText)
					//   }
					// },
					// {
					//   label: 'lines.js',
					//   icon: 'catppuccin:javascript',
					//   onSelect: (event) => {
					//     if (event.target) emit('selectScript', (event.target as HTMLElement).innerText)
					//   }
					// },
					// {
					//   label: 'rectangles.js',
					//   icon: 'catppuccin:javascript',
					//   onSelect: (event) => {
					//     if (event.target) emit('selectScript', (event.target as HTMLElement).innerText)
					//   }
					// },
					// {
					//   label: 'rectSpiral.js',
					//   icon: 'catppuccin:javascript',
					//   onSelect: (event) => {
					//     if (event.target) emit('selectScript', (event.target as HTMLElement).innerText)
					//   }
					// },
					// {
					//   label: 'sprites.js',
					//   icon: 'catppuccin:javascript',
					//   onSelect: (event) => {
					//     if (event.target) emit('selectScript', (event.target as HTMLElement).innerText)
					//   }
					// },
				]
			},

			{
				label: 'temp.js',
				icon: 'catppuccin:javascript',
				onSelect: () => emit('selectScript', 'temp.js'),
			},

			{
				label: 'main.js',
				icon: 'catppuccin:javascript',
				onSelect: () => emit('selectScript', 'main.js'),
			},
		]
	},
	// {
	//   label: 'app/',
	//   defaultExpanded: true,
	//   children: [
	//     {
	//       label: 'composables/',
	//       children: [
	//         {
	//           label: 'useAuth.js',
	//           icon: 'catppuccin:javascript'
	//         },
	//         {
	//           label: 'useUser.ts',
	//           icon: 'catppuccin:typescript'
	//         }
	//       ]
	//     },
	//     {
	//       label: 'components/',
	//       defaultExpanded: false,
	//       children: [
	//         {
	//           label: 'Card.vue',
	//           icon: 'catppuccin:vue'
	//         },
	//         {
	//           label: 'Button.vue',
	//           icon: 'catppuccin:vue'
	//         }
	//       ]
	//     },
	//   ]
	// },
	// {
	//   label: 'app.vue',
	//   icon: 'catppuccin:vue'
	// },
	// {
	//   label: 'nuxt.config.ts',
	//   icon: 'catppuccin:nuxt'
	// },
]

const items = computed<TreeItem[]>(() => {
	if (!fileStore.projectId) return guestItems

	return [
		{
			label: 'scripts',
			defaultExpanded: true,
			children: fileStore.scripts.map((script) => ({
				label: script.name,
				icon: 'catppuccin:javascript',
				onSelect: selectHandler,
			})),
		},
	]
})

const selected = ref({
	label: 'main.js',
	icon: 'catppuccin:javascript',
	onSelect: selectHandler,
})

async function addScript() {
	const name = window.prompt('New script name (e.g. game.js):')
	if (!name) return

	if (fileStore.scripts.some((script) => script.name === name)) {
		window.alert('A script with that name already exists.')
		return
	}

	await fileStore.createScript(name)
}

function scriptName(item: TreeItem): string {
	return item.label ?? ''
}

async function renameScript(current: string) {
	const name = window.prompt('Rename script:', current)
	if (!name || name === current) return

	if (fileStore.scripts.some((script) => script.name === name)) {
		window.alert('A script with that name already exists.')
		return
	}

	await fileStore.renameScript(current, name)
}

async function deleteScript(name: string) {
	if (fileStore.scripts.length <= 1) {
		window.alert("Can't delete the last script in a project.")
		return
	}
	if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return

	const wasActive = fileStore.activeFileName === name
	await fileStore.deleteScript(name)

	if (wasActive) {
		const next = fileStore.scripts[0]?.name
		if (next) emit('selectScript', next)
	}
}
</script>

<template>
	<!-- <VueTreeDnd
        :component="TreeItemRenderer"
        v-model="tree"
        @move="moveHandler"
    /> -->

	<!-- <div class="panel-wrapper">
        <div class="panel-bar">
            <span>Files</span>
        </div>
        <Tree :value="nodes" class="file-tree" />
    </div> -->

	<div class="panel-wrapper">
		<div class="panel-bar">
			<div class="spacer"></div>
			
			<div>Files</div>

			<UTooltip v-if="fileStore.projectId" text="New script" style="flex: 0 1 auto;">
				<UButton icon="tabler:script-plus" variant="ghost" color="neutral" size="xs" @click="addScript" />
			</UTooltip>
			<div v-else class="spacer"></div>
		</div>

		<div class="file-tree">
			<UTree v-model="selected" :items="items" expanded-icon="tabler:folder-open-filled" collapsed-icon="tabler:folder-filled" class="file-tree">
				<template #item-label="{ item }">
					{{ item.label }}<span v-if="fileStore.isDirty(scriptName(item))" class="dirty-marker">*</span>
				</template>

				<template v-if="fileStore.projectId" #item-trailing="{ item }">
					<div v-if="!item.children" class="item-actions">
						<UTooltip text="Rename script">
							<UButton icon="tabler:pencil-filled" variant="ghost" color="neutral" size="xs" @click.stop="renameScript(scriptName(item))" />
						</UTooltip>

						<UTooltip text="Delete script">
							<UButton icon="tabler:trash-filled" variant="ghost" color="error" size="xs" @click.stop="deleteScript(scriptName(item))" />
						</UTooltip>
					</div>
				</template>
			</UTree>
		</div>
	</div>
</template>

<style scoped>
.file-tree {
	flex: 1 1 auto;
	min-height: 0;
	overflow-y: auto;
	background-color: var(--theme-bg-neutral);
}

.spacer {
	width: 1.5em;
	flex: 0 1 auto;
}

.dirty-marker {
	color: var(--theme-warning);
	margin-left: 0.15em;
}

/* Nuxt UI's tree-item link is `position: relative`, which is what these
   coordinates anchor to — taking the actions out of flow (rather than
   relying on the trailing slot's own flex/margin-auto behavior) also frees
   the label to use the row's full width instead of sharing it, so the
   filename doesn't truncate just because these buttons exist. */
.item-actions {
	display: flex;
	align-items: center;
	gap: 0.15em;
	position: absolute;
	right: 0.5em;
	top: 50%;
	transform: translateY(-50%);
	opacity: 0;
	pointer-events: none;
	transition: opacity 0.1s;
}

:deep([data-slot="link"]:hover) .item-actions,
:deep([data-slot="link"]:focus-within) .item-actions {
	opacity: 1;
	pointer-events: auto;
}
</style>