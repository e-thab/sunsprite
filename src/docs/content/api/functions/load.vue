<script lang="ts">
export const meta = {
	title: 'load()',
	icon: 'tabler:photo-down',
	summary: 'Loads images and sounds from URLs and gives them names to use as a src.',
}

export default {}
</script>

<template>
	<DocUnderConstruction />

	<DocSnippet><pre>load(key: string, url: string, type?: 'image' | 'sound'): Promise&lt;void&gt;
load(files: Record&lt;string, string&gt;): Promise&lt;void&gt;</pre></DocSnippet>

	<DocSection id="content-1">
		<p>Loads images and sounds from URLs and gives them names you can use as a <code>src</code>. Files in your project are already loaded when your script starts, so you only need this for files hosted somewhere else.</p>
		<p>Put <code>await load(...)</code> at the top of your script, above anything that uses the file. Your script waits on that line until the file has arrived, so a sprite created below it has its real size right away, and a sound below it plays as soon as you ask.</p>
	</DocSection>

	<DocParams>
		<DocParam name="key" type="string">The name to use for the file. Must be different from your project’s file names.</DocParam>
		<DocParam name="url" type="string">The URL of the image or sound. The site hosting it has to allow other sites to use its files (CORS), or the file can’t be loaded.</DocParam>
		<DocParam name="type" type="'image' | 'sound'">Optional. Whether the file is an image or a sound. You only need this when the URL doesn’t end in its file type, see below.</DocParam>
		<DocParam name="files" type="Record<string, string>">Instead of a key and a URL, an object with several: its keys are the names, and its values are the URLs.</DocParam>
	</DocParams>

	<DocReturns type="Promise&lt;void&gt;">Resolves once loading has finished, whether or not it worked. If a file can’t be loaded, an error is shown in the output panel, sprites using it show the missing image, and sounds using it stay silent.</DocReturns>

	<DocSnippet title="Example">
<pre>await load('gator', 'https://example.com/gator.png')
await load('chomp', 'https://example.com/chomp.mp3')

const gator = new Sprite({ src: 'gator', width: 100 })
const chomp = new Sound({ src: 'chomp' })</pre>
	</DocSnippet>

	<DocSnippet title="Loading several files">
<pre>await load({
    gator: 'https://example.com/gator.png',
    unicorn: 'https://example.com/unicorn.png',
    chomp: 'https://example.com/chomp.mp3'
})

const gator = new Sprite({ src: 'gator' })
const unicorn = new Sprite({ src: 'unicorn' })</pre>
	</DocSnippet>

	<DocSection id="content-2" title="Images or sounds">
		<p>load() decides what kind of file it’s loading from the end of the URL. A URL ending in <code>.mp3</code>, <code>.ogg</code>, <code>.wav</code> or <code>.m4a</code> (or <code>.aac</code>, <code>.opus</code>, <code>.flac</code> or <code>.webm</code>) is loaded as a sound, and anything else as an image.</p>
		<p>Some URLs don’t end in their file type. For those, say what the file is with a third argument:</p>
	</DocSection>

	<DocSnippet>
<pre>await load('theme', 'https://example.com/audio?id=42', 'sound')

const music = new Sound({ src: 'theme', loop: true })
music.play()</pre>
	</DocSnippet>

	<DocSection id="content-3">
		<p>A file loaded this way can only be used as its own kind: using a sound’s name as a sprite’s <code>src</code> shows a warning in the output panel.</p>
	</DocSection>

	<DocSection id="content-4" title="Where to put it">
		<ul>
			<li><strong>Above anything that uses the file.</strong> A sprite created above its <code>load()</code> shows the missing image, and stays that way even after the image arrives.</li>
			<li><strong>Above your loops.</strong> Your game keeps running during an <code>await</code>, so a <code>forever()</code> above it starts right away. If that loop uses a variable declared below the <code>await</code>, you’ll get an error.</li>
		</ul>
	</DocSection>

	<DocSection id="content-5" title="Without await">
		<p>Without <code>await</code>, the file loads in the background and your script carries on. That’s useful for files you’ll only need later:</p>
	</DocSection>

	<DocSnippet>
<pre>load('explosion', 'https://example.com/explosion.png')

onKeyPress({
    Space() {
        new Sprite({ src: 'explosion' })
    }
})</pre>
	</DocSnippet>

	<DocSection id="content-6">
		<p>A sprite that uses an image before it has arrived is invisible until it does, and a sound played before it has arrived starts once it does. Either way, you’ll see a warning in the output panel.</p>
	</DocSection>
</template>
