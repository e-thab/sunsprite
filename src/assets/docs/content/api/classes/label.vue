<script lang="ts">
export const meta = {
	title: 'Label',
	icon: 'tabler:letter-case',
	summary: 'An object that displays text.',
}

export default {}
</script>

<template>
	<DocSignature>new Label(options?: LabelProps)</DocSignature>

	<DocSection id="content-1">
		<p>An object that displays text — useful for scores, timers, and messages. Composes every trait in GameObject, plus its own text/size/font/color.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="text" type="string | string[]">Text content of the label.</DocProperty>
		<DocProperty name="size" type="number">Font size.</DocProperty>
		<DocProperty name="font" type="string">Font family.</DocProperty>
		<DocProperty name="color" type="string">Fill color.</DocProperty>
	</DocProperties>

	<DocMixins :paths="['api/traits/game-object']" />
</template>
