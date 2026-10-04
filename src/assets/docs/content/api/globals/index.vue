<script lang="ts">
export const meta = {
	title: 'Globals',
	icon: 'tabler:world',
	summary: 'Live references available everywhere: Mouse, Screen, Camera, Clock, Background, keysPressed.',
	order: ['mouse', 'screen', 'camera', 'clock', 'background', 'keys-pressed'],
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>A handful of always-available globals that reflect live engine state, rather than functions you call.</p>

		<p>Each one is a single shared object, not something you create: there is exactly one Camera, one Background, one Clock. You read from them and assign to them directly — <code>Camera.zoom = 2</code>, <code>Background.color = '#222'</code> — and every script in the project sees the same one.</p>
	</DocSection>
</template>
