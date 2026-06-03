<script setup lang="ts">
import { ref } from 'vue'
// import VueTreeDnd from 'vue-tree-dnd';
// import TreeItemRenderer from './TreeItemRenderer.vue';

// const tree = ref([
//     {
//         id: 1,
//         name: 'Item 1',
//         expanded: true,
//         children: [
//             {
//                 id: 2,
//                 name: 'Item 2',
//                 expanded: true,
//                 children: [
//                     {
//                         id: 3,
//                         name: 'Item 3',
//                         expanded: false,
//                         children: []
//                     }
//                 ]
//             }
//         ]
//     }
// ])
// const moveHandler = (event: any) => {
//     console.log(event)
// }
// import 'primeicons/primeicons.css'
// import Tree from 'primevue/tree'
// import type { TreeNode } from 'primevue/treenode'

// const nodes = ref<TreeNode[]>([
//     {
//     key: '0',
//     label: 'Documents',
//     data: 'Documents Folder',
//     icon: 'pi pi-fw pi-inbox',
//     // expandedIcon: 'pi pi-fw pi-cog',
//     // collapsedIcon: 'pi pi-fw pi-home',
//     children: [
//         {
//             key: '0-0',
//             label: 'Work',
//             data: 'Work Folder',
//             icon: 'pi pi-fw pi-cog',
//             // expandedIcon: 'pi pi-fw pi-inbox',
//             // collapsedIcon: 'pi-chevron-circle-left',
//             children: [
//                 { key: '0-0-0', label: 'Expenses.doc', icon: 'pi pi-fw pi-file', data: 'Expenses Document' },
//                 { key: '0-0-1', label: 'Resume.doc', icon: 'pi pi-fw pi-file', data: 'Resume Document' }
//             ]
//         },
//         {
//             key: '0-1',
//             label: 'Home',
//             data: 'Home Folder',
//             icon: 'pi pi-fw pi-home',
//             children: [{ key: '0-1-0', label: 'Invoices.txt', icon: 'pi pi-fw pi-file', data: 'Invoices for this month' }]
//         }
//     ]
// },
// ])
import type { TreeItem } from '@nuxt/ui'

// https://icones.js.org/collection/tabler
// https://icones.js.org/collection/catppuccin

const items = ref<TreeItem[]>([
  {
    label: 'Images',
    defaultExpanded: true,
    children: [
      {
        label: 'image.png',
        icon: 'catppuccin:image'
      },
      {
        label: 'icon.svg',
        icon: 'catppuccin:svg'
      },
    ]
  },

  {
    label: 'Sounds',
    defaultExpanded: true,
    children: [
      {
        label: 'sound.wav',
        icon: 'catppuccin:audio'
      },
    ]
  },

  {
    label: 'Scripts',
    defaultExpanded: true,
    children: [
      // {
      //   label: 'main.ts',
      //   icon: 'catppuccin:typescript'
      // },
      {
        label: 'sprites.js',
        icon: 'catppuccin:javascript',
        onSelect: (event) => {
          if (event.target) emit('selectScript', (event.target as HTMLElement).innerText)
        }
      },
      {
        label: 'rectangles.js',
        icon: 'catppuccin:javascript',
        onSelect: (event) => {
          if (event.target) emit('selectScript', (event.target as HTMLElement).innerText)
        }
      },
      {
        label: 'lines.js',
        icon: 'catppuccin:javascript',
        onSelect: (event) => {
          if (event.target) emit('selectScript', (event.target as HTMLElement).innerText)
        }
      },
      {
        label: 'labels.js',
        icon: 'catppuccin:javascript',
        onSelect: (event) => {
          if (event.target) emit('selectScript', (event.target as HTMLElement).innerText)
        }
      },
      {
        label: 'main.js',
        icon: 'catppuccin:javascript',
        onSelect: (event) => {
          if (event.target) emit('selectScript', (event.target as HTMLElement).innerText)
        }
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
])

const emit = defineEmits<{
  selectScript: [fileName: string]
}>()
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
        <div class="panel-bar" style="justify-content: center;">
            <div>Files</div>
        </div>
        <div class="file-tree">
            <UTree :items="items" class="file-tree" />
        </div>
    </div>
</template>

<style scoped>
.file-tree {
    /* height: 100%; */
    /* width: 100%; */
    /* flex: 1 1 auto; */
    background-color: var(--nord-background-neutral);
}
</style>