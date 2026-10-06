<script lang="ts">
export const meta = {
	title: 'Output.warn()',
	icon: 'tabler:alert-triangle',
	summary: 'Display a warning message in the output panel.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>Output.warn(...msg: Printable[]): void</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Display a warning message in the output panel.</p>
	</DocSection>

	<DocParams>
		<DocParam name="msg" type="Printable[]">The warning message to display.</DocParam>
	</DocParams>

	<DocRelated :paths="['api/functions/output/print', 'api/functions/output/error', 'api/functions/output/warning']" />
</template>
