<script lang="ts">
export const meta = {
	title: 'Random.color()',
	icon: 'tabler:color-swatch',
	summary: 'A random hex RGB color string.',
}
</script>

<script setup lang="ts">
import Random from '@/assets/api/Random'
import { useThemeStore } from '@/stores/themeStore'
import DocColorSwatches from '@/components/docs/content/DocColorSwatches.vue'
import asdf from 'asdf'
// err so I remember to come back to this

const themeStore = useThemeStore()
const getForegroundColor = DocColorSwatches.getForegroundColor

const exampleColor = Random.color()
const textShadow = themeStore.current.isLight ? '0px 0px 2px black' : '0px 0px 2px white'

const randomColorStyle = {
	color: getForegroundColor(exampleColor),
	backgroundColor: exampleColor,
	borderRadius: '4px',
	// textShadow,
	// TODO: finish this
}
</script>

<template>
	<DocSnippet><pre>Random.color(): string</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Returns a random hex RGB color string.</p>
	</DocSection>

	<DocReturns type="string">A hex color string, e.g. <span :style="randomColorStyle">&nbsp;"{{ exampleColor }}"&nbsp;</span></DocReturns>

	<DocSnippet title="Example">
<pre>rect.color = Random.color()</pre>
	</DocSnippet>

	<DocRelated :paths="['api/functions/random/choice']" />
</template>
