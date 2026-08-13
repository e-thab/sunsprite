<script setup lang="ts">
import { inject } from 'vue'
import type { DocCategoryNode } from '@/assets/docs/docsTypes'
import { docsNavigationKey } from '@/assets/docs/docsNavigation'

const props = defineProps<{
	node: DocCategoryNode
	/** This category's own resolved path, needed to build each child's path. */
	path: string
}>()

const nav = inject(docsNavigationKey)!
</script>

<template>
	<div class="docs-landing">
		<header class="landing-header">
			<div class="header-title-group">
				<UIcon v-if="node.icon" :name="node.icon" class="header-icon" />
				<h1 class="header-title">{{ node.title }}</h1>
			</div>
			<slot name="header-actions" />
		</header>

		<p v-if="node.intro" class="landing-intro">{{ node.intro }}</p>

		<div class="landing-cards">
			<button
				v-for="child in node.children"
				:key="child.slug"
				type="button"
				class="landing-card"
				@click="nav.navigate(`${path}/${child.slug}`, { reveal: true })"
			>
				<UIcon v-if="child.icon" :name="child.icon" class="card-icon" />
				<div class="card-body">
					<div class="card-title">{{ child.title }}</div>
					<div class="card-summary">{{ child.summary }}</div>
				</div>
				<UIcon v-if="child.kind === 'category'" name="tabler:chevron-right" class="card-chevron" />
			</button>
		</div>
	</div>
</template>

<style scoped>
.docs-landing {
	color: var(--theme-text);
}

.landing-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5em;
	margin-bottom: 0.5em;
}

.header-title-group {
	display: flex;
	align-items: center;
	gap: 0.5em;
	min-width: 0;
}

.header-icon {
	color: var(--theme-text-toned);
	font-size: 1.3em;
}

.header-title {
	margin: 0;
	font-size: 1.3em;
	color: var(--theme-text-highlighted);
}

.landing-intro {
	margin: 0 0 1.25em;
	line-height: 1.5;
	color: var(--theme-text-toned);
}

.landing-cards {
	display: flex;
	flex-direction: column;
	gap: 0.5em;
}

.landing-card {
	display: flex;
	align-items: center;
	gap: 0.75em;
	padding: 0.6em 0.85em;
	background-color: var(--theme-bg);
	border: 1px solid var(--theme-border);
	border-radius: 0.3rem;
	cursor: pointer;
	text-align: left;
}

.landing-card:hover {
	background-color: var(--theme-bg-accented);
}

.card-icon {
	flex-shrink: 0;
	font-size: 1.1em;
	color: var(--theme-text-toned);
}

.card-body {
	flex: 1 1 auto;
	min-width: 0;
}

.card-title {
	color: var(--theme-text-highlighted);
	font-size: 0.95em;
}

.card-summary {
	color: var(--theme-text-toned);
	font-size: 0.85em;
}

.card-chevron {
	flex-shrink: 0;
	color: var(--theme-text-toned);
}
</style>
