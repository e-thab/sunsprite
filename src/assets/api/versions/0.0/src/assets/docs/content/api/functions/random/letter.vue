<script lang="ts">
import Random from "../../../../../api/Random"

export const meta = {
	title: 'Random.letter()',
	icon: `tabler:square-letter-${Random.letter()}`,
	summary: 'A random letter of the alphabet.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>Random.letter(uppercase: boolean = false): string</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Returns a random letter of the alphabet. Lowercase by default.</p>
	</DocSection>

	<DocParams>
		<DocParam name="uppercase" type="boolean">Controls upper/lowercase status of the return character.</DocParam>
	</DocParams>

	<DocReturns type="string">A single character of the alphabet, A-Z.</DocReturns>
</template>
