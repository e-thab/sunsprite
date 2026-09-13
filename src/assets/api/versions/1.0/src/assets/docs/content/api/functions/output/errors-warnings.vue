<script lang="ts">
export const meta = {
	title: 'Errors & Warnings',
	icon: 'tabler:alert-triangle',
	summary: 'Throw to report a problem without the fatal look of a thrown Error.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>throw new Warning(message?: string)
throw new Error(message?: string)</pre></DocSnippet>

	<DocSection id="content-1">
		<p>A throwable, like Error, for problems worth flagging without the fatal-looking treatment of a real error. An uncaught Warning is caught the same way any other throw is, but shown in the output panel styled as a warning instead of an error — and if the line it was thrown from can be recovered, that item gets the same clickable "at script:line" link errors do, and the line itself is highlighted in the warning color rather than the error color.</p>
	</DocSection>

	<DocParams>
		<DocParam name="message" type="string" optional>The warning message to display.</DocParam>
	</DocParams>

	<DocRelated :paths="['api/functions/output/warn', 'api/functions/output/error']" />
</template>
