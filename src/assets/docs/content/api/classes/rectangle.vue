<script lang="ts">
export const meta = {
	title: 'Rectangle',
	icon: 'tabler:square',
	summary: 'A filled rectangle shape.',
}

export default {}
</script>

<template>
	<DocSignature>new Rectangle(options?: RectangleProps)</DocSignature>

	<DocSection id="content-1">
		<p>A filled rectangle shape. Composes every trait in GameObject, plus its own fill color.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="color" type="string">The fill color.</DocProperty>
	</DocProperties>

	<DocMixins :paths="['api/traits/game-object']" />
</template>
