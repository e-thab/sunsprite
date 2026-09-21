<script setup lang="ts">
import { computed } from 'vue'
import type { DocRef } from '@/assets/docs/docsTypes'
import { propertyAnchor } from '@/assets/docs/docsAnchors'
import DocFrom from './DocFrom.vue'
import { useDocFromColumn } from './useDocFromColumn'
import { useDocRefs } from './useDocRefs'

/**
 * One entry in a DocProperties table: a row of name/type/default/from, and the
 * description (the default slot) on a second row under it, spanning the lot.
 * Stacked rather than given a column of its own for the reason DocMethod
 * stacks a signature's description — a name, a type and a trait name are each
 * as wide as they are, so a description sharing the row can only be squeezed
 * into what's left, and the widest column in the table ends up the one with
 * the least to say.
 *
 * `from` names the trait a composing page inherits this property from —
 * omitted on a page's own properties.
 */
const props = defineProps<{
	name: string
	type?: string
	/**
	 * The value the property has when nothing sets it, written as it would be
	 * in code (`0`, `'#fff'`, `true`). Left off a property that has no value of
	 * its own to report — one derived from others, like an edge or a corner —
	 * where the column shows a dash rather than inventing one.
	 */
	default?: string
	from?: string | DocRef
	readonly?: boolean
}>()

const fromColumn = useDocFromColumn(props.from)

const { nav, normalize, labelOf, href, go } = useDocRefs()

/**
 * The page being read, named the way the From column names any other page. A
 * row with no `from` is declared right here, so this is what fills its cell —
 * an empty one in a column of trait names reads as a gap in the data rather
 * than as the answer.
 */
const declaredHere = computed(() => labelOf({ path: nav.currentPath.value }))

/**
 * What a link to this property addresses. Carried by every row, the page's own
 * included — a class page listing an inherited `left` is a perfectly good place
 * to land, and which page a link means is already settled by its path. Prefixed
 * apart from the method anchors for the reason docsAnchors gives.
 */
const anchor = computed(() => propertyAnchor(props.name))

/**
 * The page this row's property is declared on, when that isn't this one —
 * which is exactly when there's somewhere for its name to link to.
 */
const declaredOn = computed(() => (props.from ? normalize([props.from])[0]! : undefined))
</script>

<template>
	<tr :data-doc-anchor="anchor">
		<td class="doc-name">
			<!-- An inherited name doubles as the link to where it's declared,
			     landing on the same property's row on the trait's page rather
			     than the top of it — the same treatment DocMethod gives a
			     signature. A row with no `from` is the page's own property, so
			     there's nowhere for it to go. -->
			<!-- <UTooltip v-if="declaredOn" :text="`See ${name} on ${labelOf(declaredOn)}`"> -->
			<a v-if="declaredOn" class="doc-name-link" :href="href(declaredOn, anchor)" @click.prevent="go(declaredOn, anchor)">{{ name }}</a>
			<!-- </UTooltip> -->
			<template v-else>{{ name }}</template>
		</td>
		<td class="doc-type">
			<code v-if="type">{{ type }}</code>
			<span v-if="readonly" class="doc-readonly">read-only</span>
		</td>
		<td class="doc-default">
			<code v-if="default">{{ default }}</code>
			<span v-else class="doc-default-none" title="Derived from other properties">&mdash;</span>
		</td>
		<td v-if="fromColumn" class="doc-from-cell">
			<DocFrom v-if="from" :from="from" />
			<!-- Deliberately not a link: it would only lead back to the page it's
			     already on. -->
			<span v-else class="doc-from-self">{{ declaredHere }}</span>
		</td>
	</tr>
	<!-- The pair is one entry, so this row carries no border of its own and no
	     anchor of its own: it's found, highlighted and scrolled to through the
	     row above it (see docsPage.css). -->
	<tr class="doc-desc-row">
		<td class="doc-desc" :colspan="fromColumn ? 4 : 3"><slot></slot></td>
	</tr>
</template>
