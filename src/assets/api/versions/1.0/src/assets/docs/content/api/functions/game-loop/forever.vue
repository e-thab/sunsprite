<script lang="ts">
export const meta = {
	title: 'forever()',
	icon: 'tabler:infinity',
	summary: 'Runs a function every frame — the primary game loop.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>forever(func: (delta: number) =&gt; void): void</pre></DocSnippet>

	<DocSection id="content-1">
		<p>The primary game loop. Runs the given function once per frame, for as long as the game runs.</p>
	</DocSection>

	<DocParams>
		<DocParam name="func" type="(delta: number) => void">The function to run each frame. Receives delta, the time since the previous frame.</DocParam>
	</DocParams>

	<DocSnippet title="Example">
<pre>forever(delta =&gt; {
    bunny.rotation += 2
})</pre>
	</DocSnippet>

	<DocRelated :paths="['api/functions/game-loop/repeat', 'api/functions/game-loop/every']" />
</template>
