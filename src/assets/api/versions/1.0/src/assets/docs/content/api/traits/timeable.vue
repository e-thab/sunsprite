<script lang="ts">
export const meta = {
	title: 'Timeable',
	icon: 'tabler:clock',
	summary: 'Tracks how long an object has existed.',
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>Adds an age property, tracking how long this object has existed in seconds.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="age" type="number">How long this object has existed in seconds.</DocProperty>
	</DocProperties>
</template>
