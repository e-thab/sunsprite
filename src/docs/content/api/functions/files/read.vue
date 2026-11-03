<script lang="ts">
export const meta = {
	title: 'Files.read()',
	icon: 'tabler:file-text',
	summary: 'Everything in a text file, as one string.',
}

export default {}
</script>

<template>
	<DocUnderConstruction />

	<DocSnippet><pre>Files.read(name: string): string</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Returns everything in a text file in your project as one string. If there’s no text file with that name, shows a warning in the output panel and returns an empty string. File names are case-sensitive.</p>
	</DocSection>

	<DocParams>
		<DocParam name="name" type="string">The text file’s name, exactly as it appears in the file tree, like 'level1.txt'.</DocParam>
	</DocParams>

	<DocReturns type="string">The file’s contents.</DocReturns>

	<DocSnippet title="Example">
<pre>const lines = Files.read('level1.txt').split('\n')
print('The level has ' + lines.length + ' rows')</pre>
	</DocSnippet>
</template>
