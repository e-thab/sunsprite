<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from '@nuxt/ui/composables'
import Colors from '@/assets/api/Colors'

const toast = useToast()

function getColorBrightness(hex: string): number {
	const r = parseInt(hex.slice(1, 3), 16)
	const g = parseInt(hex.slice(3, 5), 16)
	const b = parseInt(hex.slice(5, 7), 16)
	return (r * 0.299 + g * 0.587 + b * 0.114) / 255
	// return Math.max(r, g, b) / 255
}

function getForegroundColor(backgroundHex: string): string {
	return getColorBrightness(backgroundHex) > 0.45 ? '#000000' : '#ffffff' 
}
defineExpose([getForegroundColor])

// String enums have no reverse mapping, so the plain entries are already the
// name → hex pairs we want.
const swatches = computed(() => Object.entries(Colors).map(([name, hex]) => ({ name, hex: hex as string })))

async function copyName(name: string) {
	const reference = `Colors.${name}`
	await navigator.clipboard.writeText(reference)
	toast.add({
		title: 'Copied to clipboard',
		description: reference,
		icon: 'tabler:copy-filled',
	})
}
</script>

<template>
	<div class="swatch-grid">
		<button
			v-for="swatch in swatches"
			:key="swatch.name"
			type="button"
			class="swatch"
			:title="`Copy Colors.${swatch.name}`"
			:style="{ backgroundColor: swatch.hex, color: getForegroundColor(swatch.hex) }"
			@click="copyName(swatch.name)"
		>
			<!-- <span class="swatch-chip" :style="{ backgroundColor: swatch.hex }"></span> -->
			<span class="swatch-text">
				<span class="swatch-name">{{ swatch.name }}</span>
				<span class="swatch-hex">{{ swatch.hex }}</span>
			</span>
		</button>
	</div>
</template>

<style scoped>
.swatch-grid {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(11em, 1fr));
	gap: 0.5em;
}

.swatch {
	display: flex;
	align-items: center;
	gap: 0.5em;
	padding: 0.4em;
	min-width: 0;
	text-align: left;
	/* background-color: var(--theme-bg); */
	border: 2px solid var(--theme-bg-elevated);
	border-radius: 0.4rem;
	cursor: pointer;
}

.swatch:hover {
	background-color: var(--theme-bg-accented);
	border: 2px solid var(--theme-text-highlighted);

}

.swatch-chip {
	flex-shrink: 0;
	width: 1.75em;
	height: 1.75em;
	border: 1px solid var(--theme-border);
	border-radius: 0.2rem;
}

.swatch-text {
	display: flex;
	flex-direction: column;
	min-width: 0;
}

.swatch-name {
	font-size: 0.85em;
	/* color: var(--theme-text-highlighted); */
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.swatch-hex {
	font-family: monospace;
	font-size: 0.75em;
	/* color: var(--theme-text-toned); */
}
</style>
