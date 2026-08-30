<script lang="ts">
export const meta = {
	title: 'GameObject',
	icon: 'tabler:cube',
	summary: 'The composed base shape behind Sprite, Rectangle, Circle, and Label.',
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>GameObject is not a trait a user constructs directly — it is the composition of every trait below, and is what Sprite, Rectangle, Circle, and Label are all built from. Line, VLine, and HLine compose a smaller, direct subset of these traits instead of GameObject as a whole — see each class’s own "Composed From" section.</p>
	</DocSection>

	<DocMixins :paths="['api/traits/positionable', 'api/traits/sizable', 'api/traits/rotatable', 'api/traits/interactable', 'api/traits/viewable', 'api/traits/timeable']" />
</template>
