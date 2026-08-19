<script setup lang="ts">
import { computed } from 'vue'
import { useDocRefs } from './useDocRefs'

/**
 * An inline link to another docs page, for use in running prose:
 * `see <DocLink to="api/classes/sprite" />`. The link text is the target
 * page's own title unless the default slot overrides it.
 */
const props = defineProps<{ to: string }>()

const { labelOf, href, go } = useDocRefs()
const ref = computed(() => ({ path: props.to }))
</script>

<template>
	<a class="doc-link" :href="href(ref)" @click.prevent="go(ref)"><slot>{{ labelOf(ref) }}</slot></a>
</template>
