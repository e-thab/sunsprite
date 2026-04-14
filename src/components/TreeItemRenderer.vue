<script setup lang="ts">
import { inject, ref } from 'vue'

type TreeItem = {
    id: number | string
    expanded: boolean
    children: TreeItem[]
}

type MoveMutation = {
    id: number | string
    targetId: number | string
    position: 'LEFT' | 'RIGHT' | 'FIRST_CHILD' | 'LAST_CHILD'
}

const props = defineProps(['item', 'depth', 'expanded'])
const itemExpanded = ref(props.expanded)
defineEmits(['setExpanded'])

const deleteItem = () => {
    const deleteHandler = inject('delete') as Function
    deleteHandler(props.item.id)
}

function setExpanded(expanded: boolean) {
    itemExpanded.value = expanded
}
</script>

<template>
    <div :style="{ paddingLeft: `${1.5 * depth}rem`, width: '100%' }">
        <button @click="setExpanded(!itemExpanded)">{{ itemExpanded ? "▼" : "▶" }}</button>
        <span>{{ item.name }}</span>
        <button @click="deleteItem">X</button>
    </div>
</template>