<script lang="ts">
export const meta = {
	title: 'repeatUntil()',
	icon: 'tabler:repeat',
	summary: 'Runs a function every frame until a condition becomes true.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>repeatUntil(condition: () =&gt; boolean, func: (i: number) =&gt; void): { then(afterFunc: (i: number) =&gt; void): void }</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Runs alongside the game loop, one iteration per frame, until the given condition becomes true.</p>
	</DocSection>

	<DocParams>
		<DocParam name="condition" type="() => boolean">The predicate condition to check each frame.</DocParam>
		<DocParam name="func" type="(i: number) => void">The function to be repeated. Receives i, the current iteration (times repeated so far).</DocParam>
	</DocParams>

	<DocReturns type="{ then(afterFunc: (i: number) => void): void }">Call .then() to register a function that runs once, when the loop ends.</DocReturns>

	<DocSnippet title="Example">
<pre>repeatUntil(() =&gt; bunny.rotation &gt;= 360, i =&gt; {
    bunny.rotation += 2
}).then(i =&gt; print(`done after ${i} frames`))</pre>
	</DocSnippet>

	<DocRelated :paths="['api/functions/game-loop/repeat-while', 'api/functions/game-loop/repeat']" />
</template>
