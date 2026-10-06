<script setup lang="ts">
import { computed } from 'vue'
import type { DocRef } from '@/assets/docs/docsTypes'
import { useDocRefs } from './useDocRefs'

/**
 * The "declared on <trait>" marker a DocProperty/DocMethod row carries when
 * the member is inherited rather than the page's own. Every member a class
 * composes is listed on the class's own page, so this is what keeps those
 * repeated rows honest about where each one actually comes from.
 */
const props = defineProps<{ from: string | DocRef }>()

const { normalize, labelOf, href, go } = useDocRefs()
const target = computed(() => normalize([props.from])[0]!)
</script>

<template>
	<!-- <UTooltip :text="`Declared on ${labelOf(target)}`"> -->
		<a class="doc-from" :href="href(target)"  @click.prevent="go(target)">{{ labelOf(target) }}</a>
	<!-- </UTooltip> -->
</template>
