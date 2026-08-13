<script setup lang="ts">
import { computed, inject } from 'vue'
import type { DocEntryNode, DocRef } from '@/assets/docs/docsTypes'
import { nodesByPath } from '@/assets/docs/docsIndex'
import { docsNavigationKey } from '@/assets/docs/docsNavigation'
import { docWidgets } from './widgets'

const props = defineProps<{
	node: DocEntryNode
}>()

const nav = inject(docsNavigationKey)!

const topWidgets = computed(() => props.node.body.widgets?.filter((w) => w.placement === 'top') ?? [])
const bottomWidgets = computed(() => props.node.body.widgets?.filter((w) => w.placement !== 'top') ?? [])

function refLabel(ref: DocRef): string {
	return ref.label ?? nodesByPath.get(ref.path)?.title ?? ref.path
}

function refIcon(ref: DocRef): string | undefined {
	const node = nodesByPath.get(ref.path)
	return node?.icon
}

function go(path: string) {
	nav.navigate(path, { reveal: true })
}
</script>

<template>
	<div class="docs-body">
		<header class="docs-body-header">
			<div class="header-title-group">
				<UIcon v-if="node.icon" :name="node.icon" class="header-icon" />
				<h1 class="header-title">{{ node.title }}</h1>
			</div>
			<slot name="header-actions"></slot>
		</header>

		<section
			v-for="widget in topWidgets"
			:id="`section-${widget.id}`"
			:key="widget.id"
			class="member-section"
		>
			<h2 v-if="widget.title" class="section-title">{{ widget.title }}</h2>
			<component :is="docWidgets[widget.widget]" v-bind="widget.props" />
		</section>

		<template v-if="node.body.kind === 'prose'">
			<p v-for="(paragraph, i) in node.body.paragraphs" :key="i" class="prose-paragraph">
				{{ paragraph }}
			</p>
		</template>

		<template v-else>
			<code v-if="node.body.signature" class="signature-block">{{ node.body.signature }}</code>

			<p id="section-description" class="body-description">{{ node.body.description }}</p>

			<section v-if="node.body.params?.length" id="section-params" class="member-section">
				<h2 class="section-title">Params</h2>
				<table class="member-table">
					<tbody>
						<tr v-for="p in node.body.params" :key="p.name">
							<td class="col-name">{{ p.name }}<span v-if="p.optional" class="optional-marker">?</span></td>
							<td class="col-type"><code>{{ p.type }}</code></td>
							<td class="col-desc">{{ p.description }}</td>
						</tr>
					</tbody>
				</table>
			</section>

			<section v-if="node.body.returns" id="section-returns" class="member-section">
				<h2 class="section-title">Returns</h2>
				<p class="returns-row"><code>{{ node.body.returns.type }}</code> — {{ node.body.returns.description }}</p>
			</section>

			<section v-if="node.body.properties?.length" id="section-properties" class="member-section">
				<h2 class="section-title">Properties</h2>
				<table class="member-table">
					<tbody>
						<tr v-for="p in node.body.properties" :key="p.name">
							<td class="col-name">{{ p.name }}</td>
							<td class="col-type"><code>{{ p.type }}</code></td>
							<td class="col-desc">{{ p.description }}</td>
						</tr>
					</tbody>
				</table>
			</section>

			<section v-if="node.body.methods?.length" id="section-methods" class="member-section">
				<h2 class="section-title">Methods</h2>
				<table class="member-table">
					<tbody>
						<tr v-for="(m, i) in node.body.methods" :key="`${m.name}-${i}`">
							<td class="col-name"><code>{{ m.signature }}</code></td>
							<td class="col-desc">{{ m.description }}</td>
						</tr>
					</tbody>
				</table>
			</section>

			<section v-if="node.body.mixins?.length" id="section-composed-from" class="member-section">
				<h2 class="section-title">Composed From</h2>
				<p class="section-hint">Members declared on these shared traits aren't repeated here — click through to see them.</p>
				<div class="mixin-cards">
					<button
						v-for="ref in node.body.mixins"
						:key="ref.path"
						type="button"
						class="mixin-card"
						@click="go(ref.path)"
					>
						<UIcon v-if="refIcon(ref)" :name="refIcon(ref)!" class="mixin-card-icon" />
						<span>{{ refLabel(ref) }}</span>
					</button>
				</div>
			</section>

			<section v-if="node.body.example" id="section-example" class="member-section">
				<h2 class="section-title">Example</h2>
				<pre class="example-block"><code>{{ node.body.example }}</code></pre>
			</section>
		</template>

		<section
			v-for="widget in bottomWidgets"
			:id="`section-${widget.id}`"
			:key="widget.id"
			class="member-section"
		>
			<h2 v-if="widget.title" class="section-title">{{ widget.title }}</h2>
			<component :is="docWidgets[widget.widget]" v-bind="widget.props" />
		</section>

		<!-- Same shape on both body kinds, so it renders once here rather than per-branch. -->
		<div v-if="node.body.related?.length" class="related-row">
			<span class="related-label">See also</span>
			<UButton
				v-for="ref in node.body.related"
				:key="ref.path"
				:label="refLabel(ref)"
				:icon="refIcon(ref)"
				variant="soft"
				color="neutral"
				size="xs"
				@click="go(ref.path)"
			/>
		</div>
	</div>
</template>

<style scoped>
.docs-body {
	color: var(--theme-text);
}

.docs-body-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.5em;
	margin-bottom: 0.75em;
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

.prose-paragraph,
.body-description {
	line-height: 1.5;
	color: var(--theme-text);
}

.signature-block {
	display: block;
	padding: 0.5em 0.75em;
	margin-bottom: 0.75em;
	font-family: monospace;
	font-size: 0.9em;
	background-color: var(--theme-bg);
	border-radius: 0.2rem;
	color: var(--theme-text-highlighted);
	overflow-x: auto;
}

.member-section {
	margin-top: 1.25em;
}

.section-title {
	margin: 0 0 0.5em;
	font-size: 0.95em;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: var(--theme-text-toned);
}

.section-hint {
	margin: 0 0 0.5em;
	font-size: 0.85em;
	color: var(--theme-text-toned);
}

.member-table {
	width: 100%;
	border-collapse: collapse;
	font-size: 0.9em;
}

.member-table td {
	padding: 0.35em 0.5em 0.35em 0;
	vertical-align: top;
	border-top: 1px solid var(--theme-border);
}

.col-name {
	white-space: nowrap;
	color: var(--theme-text-highlighted);
	font-family: monospace;
}

.optional-marker {
	color: var(--theme-text-toned);
}

.col-type code {
	color: var(--theme-text-toned);
}

.col-desc {
	color: var(--theme-text);
}

.returns-row {
	margin: 0;
}

.mixin-cards {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5em;
}

.mixin-card {
	display: flex;
	align-items: center;
	gap: 0.4em;
	padding: 0.4em 0.7em;
	background-color: var(--theme-bg);
	border: 1px solid var(--theme-border);
	border-radius: 0.2rem;
	color: var(--theme-text-highlighted);
	cursor: pointer;
	font-size: 0.9em;
}

.mixin-card:hover {
	background-color: var(--theme-bg-accented);
}

.mixin-card-icon {
	color: var(--theme-text-toned);
}

.example-block {
	padding: 0.75em;
	background-color: var(--theme-bg);
	border-radius: 0.2rem;
	font-family: monospace;
	font-size: 0.85em;
	overflow-x: auto;
	white-space: pre;
	color: var(--theme-text);
}

.related-row {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 0.5em;
	margin-top: 1.25em;
}

.related-label {
	font-size: 0.85em;
	color: var(--theme-text-toned);
}
</style>
