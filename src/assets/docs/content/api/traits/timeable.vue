<script lang="ts">
export const meta = {
	title: 'Timeable',
	icon: 'tabler:clock',
	summary: "Tracks how long an object has existed.",
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>Adds age to an object, tracking how long it has existed. Paused time is not counted.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="age" type="number" readonly>How long this object has existed, in seconds (not including paused time).</DocProperty>
		<DocProperty name="ageMs" type="number" readonly>How long this object has existed, in milliseconds (not including paused time).</DocProperty>
	</DocProperties>
</template>
