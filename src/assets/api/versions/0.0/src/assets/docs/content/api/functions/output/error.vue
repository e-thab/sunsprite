<script lang="ts">
export const meta = {
	title: 'Output.error()',
	icon: 'tabler:alert-circle',
	summary: 'Display an error message in the output panel.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>Output.error(...msg: Printable[]): void</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Display an error message in the output panel.</p>
	</DocSection>

	<DocParams>
		<DocParam name="msg" type="Printable[]">The error message to display.</DocParam>
	</DocParams>

	<DocRelated :paths="['api/functions/output/warn']" />
</template>
