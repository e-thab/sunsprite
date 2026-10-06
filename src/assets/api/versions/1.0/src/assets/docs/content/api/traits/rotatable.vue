<script lang="ts">
export const meta = {
	title: 'Rotatable',
	icon: 'tabler:rotate-rectangle',
	summary: "Controls an object's rotation angle.",
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>Adds rotation to an object, readable and settable in either degrees or radians. The two stay in sync — setting one updates the other.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="rotation" type="number">Rotation angle in degrees.</DocProperty>
		<DocProperty name="radians" type="number">Rotation angle in radians.</DocProperty>
	</DocProperties>
</template>
