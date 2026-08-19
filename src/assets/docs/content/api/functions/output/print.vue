<script lang="ts">
export const meta = {
	title: 'print()',
	icon: 'tabler:message',
	summary: 'Display a message in the output panel.',
}

export default {}
</script>

<template>
	<DocSignature>print(...msg: Printable[]): void</DocSignature>

	<DocSection id="content-1">
		<p>Display a normal message in the output panel.</p>
	</DocSection>

	<DocParams>
		<DocParam name="msg" type="Printable[]">The message to display.</DocParam>
	</DocParams>

	<DocRelated :paths="['api/functions/output/warn', 'api/functions/output/clear']" />
</template>
