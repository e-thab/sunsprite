<script lang="ts">
export const meta = {
	title: 'Random.choice()',
	icon: 'tabler:list-search',
	summary: 'A random item from an array.',
}

export default {}
</script>

<template>
	<DocSignature>Random.choice(array: any[]): any</DocSignature>

	<DocSection id="content-1">
		<p>Returns a random item from a given array.</p>
	</DocSection>

	<DocParams>
		<DocParam name="array" type="any[]">The array to choose an element from.</DocParam>
	</DocParams>

	<DocReturns type="any">One randomly-chosen element from the array.</DocReturns>

	<DocExample>
<pre>const color = Random.choice(['#F72585', '#7209B7', '#3A0CA3'])</pre>
	</DocExample>
</template>
