<script lang="ts">
export const meta = {
	title: 'every()',
	icon: 'tabler:alarm-average',
	summary: 'Runs a function repeatedly at a fixed time interval.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>every(seconds: number, func: () =&gt; void): void</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Runs the given function once immediately, then repeatedly at the specified time interval.</p>
	</DocSection>

	<DocParams>
		<DocParam name="seconds" type="number">The number of seconds to wait before running each time.</DocParam>
		<DocParam name="func" type="() => void">The function to run.</DocParam>
	</DocParams>

	<DocSnippet title="Example">
<pre>every(0.1, () =&gt; {
    new Sprite({ src: 'https://pixijs.com/assets/bunny.png' })
})</pre>
	</DocSnippet>

	<DocRelated :paths="['api/functions/game-loop/after', 'api/functions/game-loop/forever']" />
</template>
