<script setup lang="ts">
/**
 * A banner marking a page, or part of one, as unfinished. Put it where the
 * unfinished part starts: the top of the page for a whole page.
 *
 * Its slot is an optional note on what's missing (`<DocUnderConstruction>
 * Examples coming soon.</DocUnderConstruction>`); without one it says so in
 * general terms. Like DocRelated, it isn't a DocSection, so it stays out of
 * the table of contents. Its default wording isn't searchable either, since
 * search indexes each page's own source and that lives here; a note written
 * into the slot is, the same as any other prose on the page.
 */
</script>

<template>
	<div class="doc-under-construction" role="note">
		<UIcon name="tabler:barrier-block" class="doc-under-construction-icon" />
		<div>
			<p class="doc-under-construction-title">Under Construction</p>
			<p class="doc-under-construction-note">
				<slot>This page isn't finished yet, check back again soon for a more detailed entry.</slot>
			</p>
		</div>
	</div>
</template>
