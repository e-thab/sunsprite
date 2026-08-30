<script lang="ts">
export const meta = {
	title: 'Circle',
	icon: 'tabler:circle',
	summary: 'A filled circle shape.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>new Circle(options?: CircleProps)</pre></DocSnippet>

	<DocSection id="content-1">
		<p>A filled circle shape. Composes every trait in GameObject, plus its own fill color and radius.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="color" type="string">The fill color.</DocProperty>
		<DocProperty name="radius" type="number">The distance from the center of the circle to the edge.</DocProperty>
	</DocProperties>

	<DocMixins :paths="['api/traits/game-object']" />
</template>
