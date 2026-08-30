<script lang="ts">
export const meta = {
	title: 'Random.color()',
	icon: 'tabler:color-swatch',
	summary: 'A random hex RGB color string.',
}
</script>

<script setup lang="ts">
import Random from "../../../../../api/Random"
import { getForegroundColor } from "../../../../../api/utility"

const exampleColor = Random.color()
const randomColorStyle = {
	color: getForegroundColor(exampleColor),
	backgroundColor: exampleColor,
	borderRadius: '0.2rem',
}
</script>

<template>
	<DocSnippet><pre>Random.color(): string</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Returns a random hex RGB color string.</p>
	</DocSection>

	<DocReturns type="string">A hex color string, e.g. <span :style="randomColorStyle">&nbsp;"{{ exampleColor }}"&nbsp;</span></DocReturns>

	<DocSnippet title="Example"><pre>rect.color = Random.color()</pre></DocSnippet>

	<DocRelated :paths="['api/colors']" />
</template>
