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
		<p>A live reference to elapsed time and frame count since the game started.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="time" type="number">Time since start, does not increment during pause.</DocProperty>
		<DocProperty name="totalTime" type="number">Time since start, including pause time.</DocProperty>
		<DocProperty name="delta" type="number">Normalized time since last frame. At 60 FPS, this is around 1.0.</DocProperty>
		<DocProperty name="deltaMs" type="number">Time since last frame in milliseconds.</DocProperty>
		<DocProperty name="frame" type="number">Frames since game start, does not increment during pause.</DocProperty>
	</DocProperties>

	<DocRelated :paths="['api/functions/game-loop/forever']" />
</template>
