<script lang="ts">
export const meta = {
	title: 'Clock',
	icon: 'tabler:clock',
	summary: 'A live reference to elapsed game time.',
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>A live reference to elapsed time and frame count since the game started. Pausing the Clock pauses the game, and it can't be reset — for timing something of your own, create a <DocLink to="api/classes/timer" /> instead.</p>

		<p><code>time</code> is the one to reach for most of the time: it counts seconds of actual play, skipping anything spent paused. <code>age</code> is the same measurement without that exclusion.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="time" type="number" readonly>Seconds since the game started, not counting time spent paused.</DocProperty>
		<DocProperty name="timeMs" type="number" readonly>Milliseconds since the game started, not counting time spent paused.</DocProperty>
		<DocProperty name="age" type="number" readonly>Seconds since the game started, including time spent paused.</DocProperty>
		<DocProperty name="ageMs" type="number" readonly>Milliseconds since the game started, including time spent paused.</DocProperty>
		<DocProperty name="delta" type="number" readonly>Time since the last frame, normalized to 60fps — usually around 1. Multiply movement by this to keep it frame-rate independent.</DocProperty>
		<DocProperty name="deltaMs" type="number" default="0">Time since the last frame in milliseconds, smoothed.</DocProperty>
		<DocProperty name="frame" type="number" default="0">Frames since the game started. Does not increment while paused.</DocProperty>
		<DocProperty name="paused" type="boolean" default="false">Whether the game is currently paused. Assigning to it is the same as calling pause() or play().</DocProperty>
		<DocProperty name="startTime" type="number" readonly>When this run started, in seconds since the Unix epoch.</DocProperty>
		<DocProperty name="startTimeMs" type="number" readonly>When this run started, in milliseconds since the Unix epoch.</DocProperty>
		<DocProperty name="now" type="number" readonly>The current time, in seconds since the Unix epoch, as of the last frame.</DocProperty>
		<DocProperty name="nowMs" type="number" readonly>The current time, in milliseconds since the Unix epoch, as of the last frame.</DocProperty>
	</DocProperties>

	<DocMethods>
		<DocMethod signature="pause(): void">Pause the game.</DocMethod>
		<DocMethod signature="play(): void">Resume the game after a pause.</DocMethod>
	</DocMethods>

	<DocSnippet title="Example">
<pre>const crab = new Sprite({ src: 'crab.png' })

forever(() =&gt; {
    crab.x += 2 * Clock.delta
})</pre>
	</DocSnippet>

	<DocRelated :paths="['api/classes/timer', 'api/traits/timeable', 'api/functions/game-loop/forever']" />
</template>
