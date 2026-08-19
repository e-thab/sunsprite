<script lang="ts">
export const meta = {
	title: 'repeat()',
	icon: 'tabler:repeat',
	summary: 'Runs a function a set number of times, once per frame.',
}

export default {}
</script>

<template>
	<DocSignature>repeat(times: number, func: (i: number) =&gt; void): { then(afterFunc: (i: number) =&gt; void): void }</DocSignature>

	<DocSection id="content-1">
		<p>Runs a specified number of times alongside the game loop, one iteration per frame.</p>
	</DocSection>

	<DocParams>
		<DocParam name="times" type="number">The number of times to repeat.</DocParam>
		<DocParam name="func" type="(i: number) => void">The function to be repeated. Receives i, the current iteration (times repeated so far).</DocParam>
	</DocParams>

	<DocReturns type="{ then(afterFunc: (i: number) => void): void }">Call .then() to register a function that runs once, when the repeat ends.</DocReturns>

	<DocExample>
<pre>repeat(45, () =&gt; {
    gator.rotation += 8
}).then(() =&gt; {
    print('done')
})</pre>
	</DocExample>

	<DocRelated :paths="['api/functions/game-loop/forever', 'api/functions/game-loop/repeat-until']" />
</template>
