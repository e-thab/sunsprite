<script lang="ts">
export const meta = {
	title: 'Timer',
	icon: 'tabler:stopwatch',
	summary: 'A stopwatch you can start, pause, and reset.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>new Timer()</pre></DocSnippet>

	<DocSection id="content-1">
		<p>A stopwatch that starts counting the moment you create it. Use one when you need to time something independently of the rest of the game — a round, a cooldown, how long a player took — rather than reading overall game time off <DocLink to="api/globals/clock" />.</p>

		<p>Every timer is paused by the game being paused, on top of its own pause state: a timer's <code>time</code> stops advancing either when you call <code>pause()</code> on it or when the game itself is paused. <code>age</code> ignores both and just counts wall-clock seconds since the timer was made.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="time" type="number" readonly>Seconds since the timer started, not counting time it spent paused.</DocProperty>
		<DocProperty name="timeMs" type="number" readonly>Milliseconds since the timer started, not counting time it spent paused.</DocProperty>
		<DocProperty name="age" type="number" readonly>Seconds since the timer started, including time it spent paused.</DocProperty>
		<DocProperty name="ageMs" type="number" readonly>Milliseconds since the timer started, including time it spent paused.</DocProperty>
		<DocProperty name="paused" type="boolean" default="false">Whether this timer is currently paused. Assigning to it is the same as calling pause() or play().</DocProperty>
		<DocProperty name="startTime" type="number" readonly>When the timer started, in seconds since the Unix epoch.</DocProperty>
		<DocProperty name="startTimeMs" type="number" readonly>When the timer started, in milliseconds since the Unix epoch.</DocProperty>
		<DocProperty name="now" type="number" readonly>The current time, in seconds since the Unix epoch, as of the last frame.</DocProperty>
		<DocProperty name="nowMs" type="number" readonly>The current time, in milliseconds since the Unix epoch, as of the last frame.</DocProperty>
	</DocProperties>

	<DocMethods>
		<DocMethod signature="pause(): void">Stop advancing time. The elapsed time so far is kept.</DocMethod>
		<DocMethod signature="play(): void">Resume after a pause, picking up where time left off.</DocMethod>
		<DocMethod signature="reset(): void">Set the timer back to zero and start counting again from now.</DocMethod>
	</DocMethods>

	<DocSnippet title="Example">
<pre>const round = new Timer()

when(() =&gt; round.time &gt;= 30, () =&gt; {
    print('Time!')
    round.reset()
})</pre>
	</DocSnippet>

	<DocRelated :paths="['api/globals/clock', 'api/traits/timeable', 'api/functions/game-loop/every']" />
</template>
