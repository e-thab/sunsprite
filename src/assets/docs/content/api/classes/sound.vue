<script lang="ts">
export const meta = {
	title: 'Sound',
	icon: 'tabler:volume',
	summary: 'An audio file you can play, pause, and pitch.',
}

export default {}
</script>

<template>
	<DocSnippet><pre>new Sound(options?: SoundProps)</pre></DocSnippet>

	<DocSection id="content-1">
		<p>A single audio file — a sound effect, a music track, anything you want the game to play. Create one with the file you want, then call <code>play()</code> whenever it should be heard. The same Sound can be played as many times as you like.</p>

		<p>Volume and pitch can be changed at any time, including while the sound is playing.</p>
	</DocSection>

	<DocParams>
		<DocParam name="options" type="SoundProps" optional>Initial properties: src, volume, pitch, and muted.</DocParam>
	</DocParams>

	<DocProperties>
		<DocProperty name="volume" type="number" default="1">How loud the sound is, from 0 (silent) to 1 (full volume).</DocProperty>
		<DocProperty name="pitch" type="number" default="0">How far the sound is shifted in pitch, in cents. 0 leaves it alone, every 100 is one semitone up, and negative values pitch it down — so -1200 is an octave lower and 1200 an octave higher.</DocProperty>
		<DocProperty name="muted" type="boolean" default="false">Whether the sound is silenced. Muting keeps the volume you set, so unmuting returns to it.</DocProperty>
	</DocProperties>

	<DocMethods>
		<DocMethod signature="play(): void">Play the sound from the beginning.</DocMethod>
		<DocMethod signature="pause(): void">Pause playback, keeping the position so resume() can pick it up.</DocMethod>
		<DocMethod signature="resume(): void">Resume playback from where pause() left it.</DocMethod>
		<DocMethod signature="stop(): void">Stop playback and return to the beginning.</DocMethod>
		<DocMethod signature="mute(): void">Silence the sound without changing its volume. Same as setting muted to true.</DocMethod>
		<DocMethod signature="unmute(): void">Un-silence the sound, restoring the volume it had. It may still be inaudible if that volume is very low.</DocMethod>
	</DocMethods>

	<DocSnippet title="Example">
<pre>const coin = new Sound({
    src: 'coin.ogg',
    volume: 0.4,
})

onKeyPress({
    Space: () =&gt; coin.play(),
})</pre>
	</DocSnippet>

	<DocRelated :paths="['tutorials/playing-sounds']" />
</template>
