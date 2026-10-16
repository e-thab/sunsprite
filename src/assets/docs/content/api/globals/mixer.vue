<script lang="ts">
export const meta = {
	title: 'Mixer',
	icon: 'tabler:adjustments-horizontal',
	summary: 'Controls all of the game\'s audio at once, and the buses that group sounds together.',
}

export default {}
</script>

<template>
	<DocSection id="content-1">
		<p>A live reference to the game's audio as a whole. Its <code>volume</code>, <code>pitch</code>, <code>speed</code>, and <code>muted</code> apply on top of every <DocLink to="api/classes/sound" /> in the game, so <code>Mixer.volume = 0.5</code> halves the volume of everything at once.</p>

		<p>Between a single Sound and the whole game sit <em>buses</em>: named groups of sounds that can be adjusted together, like turning the music down without touching the sound effects. Put a sound on a bus with its <code>bus</code> property, then adjust the bus through the Mixer. Five buses are always there: Music, Effects, UI, Ambient, and Dialogue. You can add more of your own with <code>addBus()</code>.</p>

		<p>A sound's final volume is its own volume times its bus's volume times the Mixer's volume. Speed multiplies the same way, pitch adds up, and a sound is muted if it, its bus, or the Mixer is muted.</p>
	</DocSection>

	<DocProperties>
		<DocProperty name="volume" type="number" default="1">Master volume, multiplied into every sound's volume. 0 is silent, 0.5 half as loud, 2 twice as loud.</DocProperty>
		<DocProperty name="pitch" type="number" default="0">Master pitch in cents, added to every sound's pitch. Every 100 is one semitone, so 1200 raises everything an octave.</DocProperty>
		<DocProperty name="speed" type="number" default="1">Master playback speed, multiplied into every sound's speed. 0.5 is half speed, 2 is double.</DocProperty>
		<DocProperty name="muted" type="boolean" default="false">Whether all the game's audio is silenced. Muting keeps every volume as it was, so unmuting returns to it.</DocProperty>
		<DocProperty name="buses" type="Bus[]" readonly>Every bus, including the five default ones. A copy: adding to or removing from it doesn't change the Mixer's buses.</DocProperty>
		<DocProperty name="music" type="Bus" readonly>The Music bus, for background music. Same as bus('Music').</DocProperty>
		<DocProperty name="effects" type="Bus" readonly>The Effects bus, for sound effects like jumps, hits, and pickups. Same as bus('Effects').</DocProperty>
		<DocProperty name="ui" type="Bus" readonly>The UI bus, for beeps, taps, and clicks played on menu interactions. Same as bus('UI').</DocProperty>
		<DocProperty name="ambient" type="Bus" readonly>The Ambient bus, for background sound like wildlife, weather, and other surroundings. Same as bus('Ambient').</DocProperty>
		<DocProperty name="dialogue" type="Bus" readonly>The Dialogue bus, for character voices. Same as bus('Dialogue').</DocProperty>
	</DocProperties>

	<DocMethods>
		<DocMethod signature="mute(): void">Silence all the game's audio. Same as setting muted to true.</DocMethod>
		<DocMethod signature="unmute(): void">Un-silence the game's audio. Sounds that are muted themselves, or whose bus is muted, stay silent.</DocMethod>
		<DocMethod signature="bus(name: string): Bus">Get a bus by its name. Names aren't case-sensitive, so bus('music') and bus('Music') are the same bus. Throws an error if there's no bus with that name.</DocMethod>
		<DocMethod signature="hasBus(name: string): boolean">Whether a bus with that name exists. Use it before bus() when you're not sure.</DocMethod>
		<DocMethod signature="addBus(nameOrProps: string | BusProps): Bus">Add a new bus, either by name or with an object of bus properties that includes a name. If a bus with that name already exists, no new bus is added: an object's properties are set on the existing bus instead, with a warning in the output panel. Returns the bus either way.</DocMethod>
	</DocMethods>

	<DocSection id="bus" title="Bus">
		<p>A named group of sounds, adjusted together. Buses aren't created with <code>new</code>: get one from the Mixer with <code>bus()</code> or a property like <code>Mixer.music</code>, or make one with <code>addBus()</code>. A sound can be on at most one bus at a time, and putting it on a new bus takes it off its old one.</p>
	</DocSection>

	<DocProperties id="bus-properties" title="Bus Properties">
		<DocProperty name="name" type="string" readonly>The bus's name, stored in lowercase.</DocProperty>
		<DocProperty name="sounds" type="Sound[]" default="[]">Every sound on the bus. Reading it gives a copy. Assigning a new array replaces the bus's sounds: anything not in the new array is taken off the bus.</DocProperty>
		<DocProperty name="volume" type="number" default="1">Volume of the bus's sounds, multiplied into each one's own volume.</DocProperty>
		<DocProperty name="pitch" type="number" default="0">Pitch of the bus's sounds in cents, added to each one's own pitch.</DocProperty>
		<DocProperty name="speed" type="number" default="1">Playback speed of the bus's sounds, multiplied into each one's own speed.</DocProperty>
		<DocProperty name="muted" type="boolean" default="false">Whether the bus's sounds are silenced. Each sound keeps its own muted setting for when the bus is unmuted.</DocProperty>
	</DocProperties>

	<DocMethods id="bus-methods" title="Bus Methods">
		<DocMethod signature="addSound(sound: Sound): void">Put a sound on this bus, taking it off whichever bus it was on. Same as setting the sound's bus property.</DocMethod>
		<DocMethod signature="addSounds(sounds: Sound[]): void">Put several sounds on this bus at once, keeping the sounds already on it.</DocMethod>
		<DocMethod signature="removeSound(sound: Sound): void">Take a sound off this bus. Does nothing if the sound is on a different bus.</DocMethod>
		<DocMethod signature="removeSounds(sounds: Sound[]): void">Take several sounds off this bus at once.</DocMethod>
		<DocMethod signature="clear(): Bus">Take every sound off this bus.</DocMethod>
		<DocMethod signature="set(props: BusProps): Bus">Set any number of bus properties at once, except name. Anything left out of the object is unchanged.</DocMethod>
		<DocMethod signature="reset(): Bus">Put volume, pitch, speed, and muted back to their defaults. Doesn't change which sounds are on the bus.</DocMethod>
	</DocMethods>

	<DocSnippet title="Example">
<pre>const theme = new Sound({ src: 'theme.mp3', bus: 'Music', loop: true })
const jump = new Sound({ src: 'jump.ogg', bus: 'Effects' })

// Quieter music, without touching the sound effects
Mixer.music.volume = 0.4

// A bus of your own
Mixer.addBus({ name: 'Footsteps', volume: 0.6 })
const step = new Sound({ src: 'step.ogg', bus: 'Footsteps' })

onKeyPress({
    M: () =&gt; Mixer.muted ? Mixer.unmute() : Mixer.mute(),
})</pre>
	</DocSnippet>

	<DocRelated :paths="['api/classes/sound', 'tutorials/playing-sounds']" />
</template>
