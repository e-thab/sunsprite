<script lang="ts">
export const meta = {
	title: 'repeatWhile()',
	icon: 'tabler:repeat',
	summary: 'Runs a function every frame while a condition stays true.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>repeatWhile(condition: () =&gt; boolean, func: (i: number) =&gt; void): { then(afterFunc: (i: number) =&gt; void): void }</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Runs repeatedly while the given condition is true, alongside the game loop, one iteration per frame.</p>
	</DocSection>

	<DocParams>
		<DocParam name="condition" type="() => boolean">The predicate condition to check each frame.</DocParam>
		<DocParam name="func" type="(i: number) => void">The function to be repeated. Receives i, the current iteration (times repeated so far).</DocParam>
	</DocParams>

	<DocReturns type="{ then(afterFunc: (i: number) => void): void }">Call .then() to register a function that runs once, every time the condition switches from true to false.</DocReturns>

	<DocRelated :paths="['api/functions/game-loop/repeat-until']" />
</template>
