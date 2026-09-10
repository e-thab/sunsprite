<script lang="ts">
export const meta = {
	title: 'Random.char()',
	icon: 'material-symbols:match-word-rounded',
	summary: 'A random character from a string.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>Random.char(str: string): string</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Returns a random character from a given string.</p>
	</DocSection>

	<DocParams>
		<DocParam name="str" type="string">The string to choose a character from.</DocParam>
	</DocParams>

	<DocReturns type="string">One randomly-chosen character from str.</DocReturns>
</template>
