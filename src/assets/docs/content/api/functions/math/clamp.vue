<script lang="ts">
export const meta = {
	title: 'clamp()',
	icon: 'tabler:container',
	summary: 'Constrains a number to a given range.',
}

export default {}
</script>

<template>
	<DocSignature>clamp(num: number, min: number, max: number): number</DocSignature>

	<DocSection id="content-1">
		<p>Returns a number constrained to a given range. If num &lt;= min, returns min. If num &gt;= max, returns max. If min &gt; max, they’re automatically swapped for you.</p>
	</DocSection>

	<DocParams>
		<DocParam name="num" type="number">A number.</DocParam>
		<DocParam name="min" type="number">The low end of the constraint range.</DocParam>
		<DocParam name="max" type="number">The high end of the constraint range.</DocParam>
	</DocParams>

	<DocReturns type="number">num, constrained between min and max.</DocReturns>
</template>
