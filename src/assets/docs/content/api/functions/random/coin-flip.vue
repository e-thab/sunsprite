<script lang="ts">
export const meta = {
	title: 'Random.coinFlip()',
	icon: 'tabler:coin',
	summary: 'A random true/false, 50/50 chance.',
}

export default {}
</script>

<template>
	<DocSignature>Random.coinFlip(): boolean</DocSignature>

	<DocSection id="content-1">
		<p>Returns a random boolean, 50/50 chance for true/false.</p>
	</DocSection>

	<DocReturns type="boolean">true or false, each with 50% chance.</DocReturns>

	<DocExample>
<pre>if (Random.coinFlip()) {
    bunny.rotation += 180
}</pre>
	</DocExample>
</template>
