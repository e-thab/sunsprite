<script lang="ts">
export const meta = {
	title: 'Colors',
	icon: 'tabler:palette',
	summary: 'Named color constants, e.g. Colors.CornflowerBlue.',
}

export default {}
</script>

<script setup lang="ts">
import { WebColors } from "../../../api/Colors";
import { CustomColors } from "../../../api/Colors";
</script>

<template>
	<!-- <DocSnippet><pre>enum Colors</pre></DocSnippet> -->

	<DocSection id="content-1">
		<p>TESTING TESTING TESTING TESTING A large set of named colors, whose values are hex color strings. Includes the full, extended set of <a target="_blank" href="https://en.wikipedia.org/wiki/Web_colors#HTML_color_names">CSS & HTML color names</a> (AliceBlue, SeaGreen, Tomato, etc.) along with a handful of custom Sunsprite colors.</p>
	</DocSection>

	<!-- <DocSection id="content-2">
		<p>New link <a target="_blank" href="https://en.wikipedia.org/wiki/Web_colors#HTML_color_nam">do not click</a></p>
	</DocSection> -->

	<!-- <DocSnippet title="Example"><pre>rect.color = Colors.Peru</pre></DocSnippet> -->
	<!-- <DocSnippet title="Example" :code="{
		JavaScript: 'sprite.color = \'peru\'',
		Python: 'rect.color = Colors.Peru',
	}" /> -->

	<DocSnippet title="Example" :code="{
		JavaScript: [{ text: 'sprite', color: 'identifier' }, '.color = ', { text: '\'peru\'', color: 'string' }],
		Python: [{ text: 'rect', color: 'identifier' }, '.color = ', { text: 'Colors.Peru', color: 'type' }],
	}" />

	<DocSection id="web-colors" title="Web Colors">
		<DocColorSwatches :colors="WebColors" />
	</DocSection>

	<DocSection id="custom-colors" title="Custom Colors">
		<DocColorSwatches :colors="CustomColors" />
	</DocSection>
</template>
