<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import type { DocRef } from '@/assets/docs/docsTypes'
import { methodAnchor } from '@/assets/docs/docsAnchors'
import { tokenizeSignature } from '@/assets/docs/docsSignature'
import DocFrom from './DocFrom.vue'
import { useDocFromColumn } from './useDocFromColumn'
import { useDocRefs } from './useDocRefs'

/**
 * One entry in a DocMethods table: a row carrying the signature (and the From
 * cell, on a page that composes traits), and the description (the default
 * slot) on a second row under it, spanning both. Stacked rather than given a
 * column of its own so a wide signature costs row height instead of squeezing
 * every description in the table into a narrow column.
 *
 * Overloads are just repeated entries with the same name. `from` names the
 * trait a composing page inherits this method from — omitted on a page's own
 * methods.
 */
const props = defineProps<{
	signature: string
	from?: string | DocRef
}>()

const fromColumn = useDocFromColumn(props.from)

const { nav, normalize, labelOf, href, go } = useDocRefs()

/**
 * The page being read, named the way the From column names any other page. A
 * row with no `from` is declared right here, so this is what fills its cell —
 * an empty one in a column of trait names reads as a gap in the data rather
 * than as the answer. Same treatment DocProperty gives its own rows.
 */
const declaredHere = computed(() => labelOf({ path: nav.currentPath.value }))

/** The method's own name, i.e. the signature up to its parameter list. */
const methodName = computed(() => {
	const open = props.signature.indexOf('(')
	return (open < 0 ? props.signature : props.signature.slice(0, open)).trim()
})

/**
 * What a link to this method addresses. Carried by every row, the page's own
 * included: a class page listing an inherited goTo() is a perfectly good place
 * to land, and which page a given link means is already settled by its path.
 *
 * Overloads share it, since they share a name — deliberately. It's an
 * attribute rather than a DOM id precisely so they can: two elements with the
 * same id would be invalid, while a duplicate attribute is fine, and the
 * resolver taking the first match lands on the first overload with the rest of
 * them in view below it (see docsAnchors).
 */
const anchor = computed(() => methodAnchor(methodName.value))

/**
 * The page this row's method is declared on, when that isn't this one — which
 * is exactly when there's somewhere for its signature to link to.
 */
const declaredOn = computed(() => (props.from ? normalize([props.from])[0]! : undefined))

/**
 * Splits a parameter list on its top-level commas only — a parameter's own
 * type can carry commas inside brackets of its own. The `=` guard keeps an
 * arrow type's `=>` from reading as a closing bracket.
 */
function splitParams(params: string): string[] {
	const out: string[] = []
	let depth = 0
	let start = 0

	for (let i = 0; i < params.length; i++) {
		const char = params[i]!
		if ('(<[{'.includes(char)) depth++
		else if (')]}'.includes(char)) depth--
		else if (char === '>' && params[i - 1] !== '=') depth--
		else if (char === ',' && depth === 0) {
			out.push(params.slice(start, i).trim())
			start = i + 1
		}
	}

	const last = params.slice(start).trim()
	if (last) out.push(last)
	return out
}

/** The signature rewritten one parameter per line; undefined if it has no parameters to break across. */
const multiline = computed(() => {
	const open = props.signature.indexOf('(')
	const close = props.signature.lastIndexOf(')')
	if (open < 0 || close < open) return undefined

	const params = splitParams(props.signature.slice(open + 1, close))
	if (params.length === 0) return undefined

	const name = props.signature.slice(0, open)
	const returns = props.signature.slice(close + 1)
	return `${name}(\n${params.map((param) => `\t${param}`).join(',\n')}\n)${returns}`
})

/**
 * The form currently on screen, split into colored runs. Built from the
 * rendered text rather than the prop, so the re-laid form gets highlighted on
 * the same terms as the one-line one — see tokenizeSignature.
 */
const tokens = computed(() => tokenizeSignature(wrapped.value ? multiline.value! : props.signature))

const cell = useTemplateRef<HTMLElement>('cell')
const box = useTemplateRef<HTMLElement>('box')
const wrapped = ref(false)

/**
 * The signature's width on one line, which is what it's worth breaking up
 * against. Measured from the element itself rather than a hidden probe, but
 * only ever while it's unwrapped — wrapped, the same measurement would return
 * the longest of its lines instead.
 */
let oneLineWidth = 0

/**
 * Wrap exactly when the one-line form no longer fits the width the pane
 * actually gives this row. A signature with no parameters bails out above:
 * there's nothing to break it across, so it stays on one line however narrow
 * the pane gets.
 *
 * Measured against the scrolling wrapper, deliberately, not against the cell.
 * The table sits in an `overflow-x: auto` box, so `table-layout: auto` lets it
 * grow to its max-content width instead of being held to the container — which
 * means the cell is always at least as wide as the signature that widened it,
 * and a cell-based test could never fire. The wrapper's own width comes from
 * the pane and owes nothing to the content, so it's the one reference here
 * that can't move in response to this decision, which is also what keeps the
 * result stable rather than oscillating.
 *
 * What the row can't use is subtracted from it: the cell's own padding, and
 * the From column, whose width is its widest trait name and likewise doesn't
 * shift when a signature wraps.
 */
function measure() {
	if (!cell.value || !box.value || !multiline.value) return

	// scrollWidth is the full nowrap extent even where the box overflows the
	// cell — but it's only the *one-line* extent while the box is unwrapped.
	if (!wrapped.value && box.value.scrollWidth > 0) oneLineWidth = box.value.scrollWidth

	// Zero until the table has been laid out at all (a collapsed docs pane
	// renders at no width); the observer fires again once it has been.
	if (oneLineWidth === 0) return

	const wrapper = cell.value.closest('.doc-table-scroll')
	if (!wrapper) return

	const cellPadding = cell.value.offsetWidth - cell.value.clientWidth
	const fromCell = cell.value.nextElementSibling as HTMLElement | null
	const fromWidth = fromCell?.offsetWidth ?? 0

	wrapped.value = oneLineWidth > wrapper.clientWidth - cellPadding - fromWidth
}

let observer: ResizeObserver | undefined

onMounted(() => {
	measure()
	// The wrapper, not the cell: once the table is pinned at its max-content
	// width the cell stops resizing entirely, so a cell-based observer would
	// go silent exactly when the pane keeps narrowing and this most needs to
	// re-run.
	const wrapper = cell.value?.closest('.doc-table-scroll')
	if (!wrapper) return
	observer = new ResizeObserver(measure)
	observer.observe(wrapper)
})

onBeforeUnmount(() => observer?.disconnect())

// A page swap reuses this component for a different method, whose one-line
// width has nothing to do with the last one's.
watch(
	() => props.signature,
	() => {
		oneLineWidth = 0
		wrapped.value = false
	}
)
</script>

<template>
	<tr :data-doc-anchor="anchor">
		<td ref="cell" class="doc-method">
			<!-- An inherited signature doubles as the link to where it's declared,
			     landing on the same method's row on the trait's page rather than
			     the top of it. A row with no `from` is the page's own method —
			     this is already where it's defined, so it stays plain text. -->
			<!-- <UTooltip v-if="declaredOn" :text="`See ${methodName}() on ${labelOf(declaredOn)}`"> -->
				<a
					v-if="declaredOn"
					class="doc-signature-link"
					:href="href(declaredOn, anchor)"
					@click.prevent="go(declaredOn, anchor)"
					>
					<!-- :title="`See ${methodName}() on ${labelOf(declaredOn)}`" -->
					<code ref="box" class="doc-signature" :class="{ 'doc-signature-wrapped': wrapped }"><span v-for="(token, i) in tokens" :key="i" :class="token.kind === 'plain' ? undefined : `doc-signature-${token.kind}`">{{ token.text }}</span></code>
				</a>
			<!-- </UTooltip> -->
			<code v-else ref="box" class="doc-signature" :class="{ 'doc-signature-wrapped': wrapped }"><span v-for="(token, i) in tokens" :key="i" :class="token.kind === 'plain' ? undefined : `doc-signature-${token.kind}`">{{ token.text }}</span></code>
		</td>
		<td v-if="fromColumn" class="doc-from-cell">
			<DocFrom v-if="from" :from="from" />
			<!-- Deliberately not a link: it would only lead back to the page it's
			     already on. -->
			<span v-else class="doc-from-self">{{ declaredHere }}</span>
		</td>
	</tr>
	<!-- Its own row, spanning the table, so the description runs under the From
	     cell instead of stopping at the signature column's edge — a trait name
	     is narrow and always will be, and the column it reserves is dead width
	     on every line of description after the first. The pair is one entry: no
	     border of its own, and no anchor of its own (see docsPage.css). -->
	<tr class="doc-desc-row">
		<td class="doc-desc" :colspan="fromColumn ? 2 : 1"><slot></slot></td>
	</tr>
</template>
