<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import type { DocRef } from '@/assets/docs/docsTypes'
import DocFrom from './DocFrom.vue'
import { useDocFromColumn } from './useDocFromColumn'

/**
 * One row of a DocMethods table: the signature, with the description (the
 * default slot) stacked underneath it rather than beside it, so a wide
 * signature costs row height instead of squeezing every description in the
 * table into a narrow column. Overloads are just repeated rows with the same
 * name. `from` names the trait a composing page inherits this method from —
 * omitted on a page's own methods.
 */
const props = defineProps<{
	signature: string
	from?: string | DocRef
}>()

const fromColumn = useDocFromColumn(props.from)

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
	<tr>
		<td ref="cell" class="doc-method">
			<code ref="box" class="doc-signature" :class="{ 'doc-signature-wrapped': wrapped }">{{ wrapped ? multiline : signature }}</code>
			<div class="doc-desc"><slot></slot></div>
		</td>
		<td v-if="fromColumn" class="doc-from-cell">
			<DocFrom v-if="from" :from="from" />
		</td>
	</tr>
</template>
