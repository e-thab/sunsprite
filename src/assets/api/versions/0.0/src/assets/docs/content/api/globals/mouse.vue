<script lang="ts">
export const meta = {
	title: 'Mouse',
	icon: 'tabler:mouse',
	summary: 'The user\'s mouse reference.',
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>A live reference to the user's mouse — cursor position and which buttons are currently held.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="x" type="number">Horizontal position of the user's cursor.</DocProperty>
		<DocProperty name="y" type="number">Vertical position of the user's cursor.</DocProperty>
		<DocProperty name="position" type="Point">Position of the user's cursor as a Point.</DocProperty>
		<DocProperty name="pos" type="Point">Position of the user's cursor as a Point. Alias of position.</DocProperty>
		<DocProperty name="leftButtonDown" type="boolean">Whether the left mouse button is currently held down.</DocProperty>
		<DocProperty name="rightButtonDown" type="boolean">Whether the right mouse button is currently held down.</DocProperty>
		<DocProperty name="middleButtonDown" type="boolean">Whether the middle mouse button is currently held down.</DocProperty>
		<DocProperty name="anyButtonDown" type="boolean">Whether any mouse button is currently held down.</DocProperty>
	</DocProperties>

	<DocRelated :paths="['api/functions/input/on-mouse', 'api/traits/interactable']" />
</template>
