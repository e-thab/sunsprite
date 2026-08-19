<script lang="ts">
export const meta = {
	title: 'after()',
	icon: 'tabler:alarm',
	summary: 'Runs a function once, after a delay in seconds.',
}

export default {}
</script>

<template>
	<DocSignature>after(seconds: number, func: () =&gt; void): void</DocSignature>

	<DocSection id="content-1">
		<p>Runs the given function once, after the specified number of seconds have passed.</p>
	</DocSection>

	<DocParams>
		<DocParam name="seconds" type="number">The number of seconds to wait before running.</DocParam>
		<DocParam name="func" type="() => void">The function to run.</DocParam>
	</DocParams>

	<DocExample>
<pre>after(2, () =&gt; {
    print('2 seconds have passed')
})</pre>
	</DocExample>

	<DocRelated :paths="['api/functions/game-loop/every']" />
</template>
