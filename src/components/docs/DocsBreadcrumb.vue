<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { BreadcrumbItem } from '@nuxt/ui'
import { docsNavigationKey } from '@/assets/docs/docsNavigation'
import { docsDataKey } from '@/assets/docs/docsData'

const nav = inject(docsNavigationKey)!
const docsData = inject(docsDataKey)!

const ancestorItems = computed<(BreadcrumbItem & { path: string })[]>(() =>
	docsData.value.ancestorsOf(nav.currentPath.value).map((entry) => ({
		label: entry.node.title,
		icon: entry.node.icon,
		to: nav.resolveHref(entry.path),
		path: entry.path,
	}))
)

// How many leading (oldest/shallowest) items are currently collapsed into a
// single "…" placeholder — recalculated whenever the container resizes or
// the ancestor chain changes, so the breadcrumb always fits without a
// scrollbar of its own: older ancestors give way first, keeping the page
// you're actually on (and its nearest ancestors) visible.
const collapseFrom = ref(0)
const containerRef = ref<HTMLElement | null>(null)

const displayItems = computed<(BreadcrumbItem & { path: string; ellipsis?: true })[]>(() => {
	if (collapseFrom.value <= 0) return ancestorItems.value
	return [{ label: '…', path: '', ellipsis: true }, ...ancestorItems.value.slice(collapseFrom.value)]
})

async function recalcTruncation() {
	const el = containerRef.value
	if (!el) return
	collapseFrom.value = 0
	await nextTick()
	const count = ancestorItems.value.length
	// Always leaves at least the last (current) item on screen — i only ever
	// reaches count - 1, collapsing everything before it into "…".
	for (let i = 1; i < count && el.scrollWidth > el.clientWidth; i++) {
		collapseFrom.value = i
		await nextTick()
	}
}

let resizeObserver: ResizeObserver | undefined
onMounted(() => {
	resizeObserver = new ResizeObserver(() => recalcTruncation())
	if (containerRef.value) resizeObserver.observe(containerRef.value)
	recalcTruncation()
})
onBeforeUnmount(() => resizeObserver?.disconnect())

watch(ancestorItems, () => recalcTruncation())

// Plain left-click navigates in place through the shared context (a local
// ref inside the panel, a real router.push on the standalone page — this
// component doesn't know which). Modifier/middle clicks are left alone so
// ctrl/cmd-click and "open in new tab" still work via the item's real `to`.
function onLabelClick(event: MouseEvent, path: string) {
	if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
	event.preventDefault()
	nav.navigate(path)
}
</script>

<template>
	<div ref="containerRef" class="docs-breadcrumb-container">
		<UBreadcrumb
			:items="displayItems"
			class="docs-breadcrumb"
			:ui="{ list: 'flex-nowrap', item: 'shrink-0', linkLabel: 'overflow-visible whitespace-nowrap text-clip' }"
		>
			<template #item-leading="{ item, active }">
				<UIcon
					v-if="item.icon"
					:name="item.icon"
					class="crumb-icon"
					:class="{ 'crumb-icon-current': active }"
				/>
			</template>

			<template #item-label="{ item, active }">
				<span v-if="item.ellipsis" class="crumb-ellipsis">{{ item.label }}</span>
				<span
					v-else
					:class="active ? 'crumb-current' : 'crumb'"
					@click="onLabelClick($event, item.path)"
				>{{ item.label }}</span>
			</template>
		</UBreadcrumb>
	</div>
</template>

<style scoped>
.docs-breadcrumb-container {
	overflow: hidden;
}

.docs-breadcrumb {
	padding: 0.5em 0.75em;
	font-size: 0.85em;
}

.crumb-icon {
	flex-shrink: 0;
	color: var(--theme-text-toned);
}

.crumb-icon-current {
	color: var(--theme-primary);
}

.crumb {
	color: var(--theme-text-toned);
}

.crumb-current {
	color: var(--theme-primary);
	cursor: default;
}

.crumb-ellipsis {
	color: var(--theme-text-toned);
	cursor: default;
}
</style>

<!--
Icon (item-leading) and label (item-label) are separate slots that Nuxt UI
renders as siblings inside one shared <a> — not something this component's
own template renders as a unit, so a scoped selector can't reach across them
(same lesson learned styling DocsTree.vue's row highlight). Driving both from
the shared anchor's own :hover, in a plain global block, is what makes
hovering either one highlight both together — instead of the icon and label
reacting to separate, mismatched hit areas, one tied to Nuxt UI's own
group-hover on the full anchor box and the other to just this span.
-->
<style>
.docs-breadcrumb a[data-slot='link']:hover .crumb,
.docs-breadcrumb a[data-slot='link']:hover .crumb-icon {
	color: var(--theme-text);
}

/* Keep the current item's primary highlight even while hovering it — :hover
   on the anchor would otherwise win over the plain .crumb-current/
   .crumb-icon-current rules above (same specificity fix as DocsTree.vue's
   analogous .doc-title-current:hover rule). */
.docs-breadcrumb a[data-slot='link']:hover .crumb-current,
.docs-breadcrumb a[data-slot='link']:hover .crumb-icon-current {
	color: var(--theme-primary);
}
</style>
