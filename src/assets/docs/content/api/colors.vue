<script lang="ts">
export const meta = {
	title: 'Colors',
	icon: 'tabler:palette',
	summary: 'Named color constants, e.g. Colors.CornflowerBlue.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>enum Colors</pre></DocSnippet>

	<DocSection id="content-1">
		<p>A large set of standard named web colors, each mapping to a hex color string — a convenient alternative to typing hex codes by hand. Includes the full standard CSS color-name set (AliceBlue, Black, Blue, Coral, CornflowerBlue, Crimson, DarkGreen, Gold, HotPink, Indigo, Magenta, Orange, Purple, Red, SeaGreen, SkyBlue, Tomato, Violet, White, Yellow, and hundreds more).</p>
	</DocSection>

	<DocSnippet title="Example">
<pre>rect.color = Colors.CornflowerBlue</pre>
	</DocSnippet>

	<DocSection id="palette" title="Palette">
		<DocColorSwatches />
	</DocSection>
</template>
