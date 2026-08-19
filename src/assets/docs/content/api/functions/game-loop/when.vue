<script lang="ts">
export const meta = {
	title: 'when()',
	icon: 'tabler:bolt',
	summary: 'Runs a function once each time a condition becomes true.',
}

export default {}
</script>

<template>
	<DocSignature>when(condition: () =&gt; boolean, func: () =&gt; void): void</DocSignature>

	<DocSection id="content-1">
		<p>Checks the given condition every frame, and runs func once each time it transitions from false to true.</p>
	</DocSection>

	<DocParams>
		<DocParam name="condition" type="() => boolean">The condition to check.</DocParam>
		<DocParam name="func" type="() => void">The function to run.</DocParam>
	</DocParams>

	<DocRelated :paths="['api/functions/game-loop/repeat-until']" />
</template>
