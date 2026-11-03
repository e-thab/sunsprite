import Phaser from 'phaser'
import { scene } from "./core"
import { _audioSourceStatus, _reportFailedLoad, type AudioSource } from "./assets"
import Bus, { busDefaults } from "./Bus"
import { mixer, _client } from "./Mixer"

/* TODO:
* - Look into adjusting pitch/speed without affecting each other
* - `On` events; onFinish, onStart, maybe more
*/

const soundDefaults = {
    ...busDefaults,
    loop: false
}

export type SoundProps = {
    /** The sound's audio: the name of an audio file in your project, like 'jump.mp3', or a URL. */
    src?: AudioSource
    /**
     * Bus this sound belongs to. Buses are used to modify categories of sounds together so that
     * you can do things like add separate volume sliders for music, effects, and UI sounds.
     */
    bus?: string
    /**
     * True while the sound is muted. Does not check volume; this being true
     * does not mean its volume is 0.
     */
    muted?: boolean
    /**
     * Loudness of the sound. The lower this is, the quieter the sound.
     * 
     * | Volume | Result |
     * | ------ | ------ |
     * | 0 | Too quiet to hear |
     * | 0.5 | Half as loud as default |
     * | 1 | Default volume  |
     * | 2 | Twice as loud as default |
     * 
     * Volume is multiplied by bus volume.
     */
    volume?: number
    /**
     * Pitch of the sound in [cents.](https://en.wikipedia.org/wiki/Cent_(music))
     * 
     * 0 means no change in pitch, every 100 adjusts by one semitone. For example,
     * if your sound is 440hz (A4):
     * 
     * | Pitch (cents) | Hz      | Note       |
     * | ------------- | ------- | ---------- |
     * | -1200         | 220     | A3         |
     * | -200          | 392     | G4         |
     * | -100          | 415.30  | Ab4 / G#4  |
     * | 0             | 440     | A4         |
     * | 100           | 466.16  | A#4 / Bb4  |
     * | 200           | 493.88  | B4         |
     * | 1200          | 880     | A5         |
     * 
     * Pitch is added to bus pitch.
     */
    pitch?: number
    /**
     * Playback speed of the sound.
     * 
     * | Speed | Result |
     * | ------ | ------ |
     * | 0 | Playback never advances, sound can't be heard |
     * | 0.5 | Half the default speed |
     * | 1 | Default playback  |
     * | 2 | Twice as fast as default |
     * 
     * Speed is multiplied by bus speed.
     */
    speed?: number
    /** Whether this sound automatically repeats when it's finished. */
    loop?: boolean
}

/** A sound that can play an audio file. */
export default class Sound {
    _ref: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound
    _src: string
    _volume: number
    _pitch: number
    _speed: number
    _muted: boolean
    _loop: boolean
    _bus?: Bus

    constructor(props?: SoundProps) {
        this._src = props?.src ?? 'win'
        this._volume = Math.max(0, props?.volume ?? 1)
        this._pitch = props?.pitch ?? 0
        this._muted = props?.muted ?? false
        this._speed = props?.speed ?? 1
        this._loop = props?.loop ?? false
        // Bookkeeping only, _createRef below applies the bus's values
        this._bus = mixer._getBus(props?.bus)
        this._bus?._addSound(this)
        this._ref = this._createRef(this._src)
        mixer._sounds.push(this)
    }

    /**
     * True while `src` is a path/URL still downloading. Project files never
     * are, they're preloaded before the script runs.
     */
    _loading = false
    /** play() was called while loading; honored once the file arrives, unless pause()/stop() came after. */
    _playWhenLoaded = false

    /**
     * The Phaser sound behind `src`, with every current property applied. A
     * file that isn't in the cache gets a silent stand-in — reported first if
     * it's a project file name that doesn't exist, or loaded on demand and
     * swapped in when it arrives if it's a path/URL — so the rest of the
     * script can keep calling play()/volume/etc. on it either way.
     */
    _createRef(src: string): Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound {
        this._loading = false
        this._playWhenLoaded = false

        const status = _audioSourceStatus(scene.cache.audio, src)
        const ref = status === 'ready'
            ? scene.sound.add(src)
            : new Phaser.Sound.NoAudioSound(scene.sound as Phaser.Sound.NoAudioSoundManager, src)

        if (status === 'load') {
            this._loading = true
            const loadingScene = scene
            loadingScene.load.once(Phaser.Loader.Events.COMPLETE, () => {
                // Superseded by a newer src, or the game restarted meanwhile.
                if (this._src !== src || scene !== loadingScene) return
                this._loading = false
                if (!loadingScene.cache.audio.exists(src)) {
                    _reportFailedLoad(src, 'audio')
                    return
                }
                const playWhenLoaded = this._playWhenLoaded
                this._ref.destroy()
                this._ref = this._createRef(src)
                if (playWhenLoaded) this._ref.play()
            })
            loadingScene.load.audio(src, src)
            loadingScene.load.start()
        }

        this._applyAll(ref)
        return ref
    }

    /**
     * Set any number of sound properties at once.
     */
    set(props?: SoundProps) {
        if (props?.src !== undefined) this.src = props.src
        if (props?.bus !== undefined) this.bus = props.bus
        if (props?.volume !== undefined) this.volume = props.volume
        if (props?.pitch !== undefined) this.pitch = props.pitch
        if (props?.speed !== undefined) this.speed = props.speed
        if (props?.muted !== undefined) this.muted = props.muted
        if (props?.loop !== undefined) this.loop = props.loop
    }

    /**
     * Resets commonly used properties to default. Doesn't change src, bus, seek, 
     * 
     * | Property | Default |
     * | volume | 1 |
     * | speed | 1 |
     * | pitch | 0 |
     * | muted | false |
     * | loop | false |
     */
    reset() {
        this.set(soundDefaults)
    }

    /*
    * Each _apply* pushes one stored property, combined with the bus's, to a
    * Phaser sound. These are the only places that combination happens. `ref`
    * is a parameter because _createRef applies to its new sound before it
    * becomes this._ref.
    */

    _applyVolume(ref = this._ref) {
        // UI volume slider value applies here
        ref.setVolume(this.netVolume * _client.volume)
    }

    _applyPitch(ref = this._ref) {
        ref.setDetune(this.netPitch)
    }

    _applySpeed(ref = this._ref) {
        ref.setRate(this.netSpeed)
    }

    _applyMuted(ref = this._ref) {
        // UI mute applies here
        ref.setMute(this.muted || _client.muted)
    }

    _applyLoop(ref = this._ref) {
        ref.setLoop(this._loop)
    }

    _applyAll(ref = this._ref) {
        this._applyVolume(ref)
        this._applyPitch(ref)
        this._applySpeed(ref)
        this._applyMuted(ref)
        this._applyLoop(ref)
    }

    /** The sound's audio: the name of an audio file in your project, like 'jump.mp3', or a URL. */
    get src(): string {
        return this._src
    }
    set src(src: AudioSource) {
        if (src === this._src) return

        this._src = src
        this._ref.destroy()
        this._ref = this._createRef(src)
    }

    /** How long this sound is in seconds. */
    get duration(): number {
        return this._ref.duration
    }

    /** Current playback time in seconds. Goes back to 0 when playback ends. */
    get seek(): number {
        return this._ref.seek
    }
    set seek(seek: number) {
        this._ref.setSeek(seek)
    }

    /**
     * Playback speed of the bus's sound.
     * 
     * | Speed | Result |
     * | ------ | ------ |
     * | 0 | Playback never advances, sound can't be heard |
     * | 0.5 | Half the default speed |
     * | 1 | Default playback  |
     * | 2 | Twice as fast as default |
     * 
     * Speed is multiplied by bus speed.
     */
    get speed(): number {
        return this._speed
    }
    set speed(speed: number) {
        this._speed = speed
        this._applySpeed()
    }
    /** The actual calculated playback speed after multiplying bus value. */
    get netSpeed(): number {
        return this._speed * mixer._master.speed * (this._bus?.speed ?? 1)
    }

    /**
     * Loudness of the sound. The lower this is, the quieter the sound.
     * 
     * | Volume | Result |
     * | ------ | ------ |
     * | 0      | Too quiet to hear |
     * | 0.5    | Half as loud as default |
     * | 1      | Default volume  |
     * | 2      | Twice as loud as default |
     * 
     * Volume is multplied by bus volume.
     */
    get volume(): number {
        return this._volume
    }
    set volume(volume: number) {
        this._volume = Math.max(0, volume)
        this._applyVolume()
    }
    /**
     * The actual calculated output volume after multiplying bus value. Does not consider the client
     * volume controlled by the slider in the canvas UI. Scripts have no control over that value.
     */
    get netVolume(): number {
        return this._volume * mixer._master.volume * (this._bus?.volume ?? 1)
    }

    /**
     * Pitch of the sound in [cents.](https://en.wikipedia.org/wiki/Cent_(music))
     * 
     * 0 means no change in pitch, every 100 adjusts by one semitone, every 1200
     * by one octave. For example, if your sound is 440hz (A4):
     * 
     * | Pitch (cents) | Hz      | Note       |
     * | ------------- | ------- | ---------- |
     * | -1200         | 220     | A3         |
     * | -200          | 392     | G4         |
     * | -100          | 415.30  | Ab4 / G#4  |
     * | 0             | 440     | A4         |
     * | 100           | 466.16  | A#4 / Bb4  |
     * | 200           | 493.88  | B4         |
     * | 1200          | 880     | A5         |
     * 
     * Pitch is added to bus pitch.
     */
    get pitch(): number {
        return this._pitch
    }
    set pitch(pitch: number) {
        this._pitch = pitch
        this._applyPitch()
    }
    /** The actual calculated output volume after multiplying bus value. */
    get netPitch(): number {
        return this._pitch + mixer._master.pitch + (this._bus?.pitch ?? 0)
    }

    /**
     * True while the sound is muted. Does not check volume; a sound being
     * muted does not mean its volume is 0, even though it can't be heard.
     * 
     * If this sound's bus is muted, this sound is considered muted.
     */
    get muted(): boolean {
        return mixer._master.muted || this._bus?.muted || this._muted
    }
    set muted(muted: boolean) {
        // _muted always keeps the manually assigned value, saving value between bus mute/unmutes
        this._muted = muted
        this._applyMuted()
    }

    /** Whether this sound automatically repeats when it's finished. */
    get loop(): boolean {
        return this._loop
    }
    set loop(loop: boolean) {
        this._loop = loop
        this._applyLoop()
    }

    /** Name of the bus this sound belongs to, or undefined if it doesn't have one. */
    get bus(): string | undefined {
        return this._bus?.name
    }
    /**
     * A sound's bus property can be set using either the name of the bus or an actual Bus instance.
     * e.g. `song.bus = Mixer.bus('Music')` or just `song.bus = 'Music'`. Set it to undefined to
     * take the sound off its bus.
     */
    set bus(bus: string | Bus | undefined) {
        if (bus === undefined) {
            this._setBus(undefined)
            return
        }
        const nextBus = bus instanceof Bus ? bus : mixer._getBus(bus)
        if (nextBus === undefined) return
        this._setBus(nextBus)
    }

    /**
     * Internal. The one place a sound changes buses: keeps the old and new bus's sound lists
     * and this._bus in sync, then re-applies the bus-combined values.
     */
    _setBus(bus: Bus | undefined) {
        if (bus === this._bus) return
        this._bus?._removeSound(this)
        this._bus = bus
        bus?._addSound(this)
        this._applyAll()
    }

    /** Play the sound until finished or stopped manually. */
    play() {
        if (this._loading) this._playWhenLoaded = true
        else this._ref.play()
    }

    /**
     * True while the sound is playing. False if it hasn't started yet
     * or has finished playing.
     */
    get playing(): boolean {
        return this._ref.isPlaying
    }

    /** Pause the sound until stopped or resumed manually. */
    pause() {
        this._playWhenLoaded = false
        this._ref.pause()
    }

    /** True if the sound is currently paused. */
    get paused(): boolean {
        return this._ref.isPaused
    }

    /** Continue playing the sound from where it was paused. */
    resume() {
        this._ref.resume()
    }

    /** Stop playing the sound and reset to the beginning. */
    stop() {
        this._playWhenLoaded = false
        this._ref.stop()
    }

    /**
     * Mutes the sound so that it cannot be heard, but doesn't actually change
     * the volume property. Unmuting will put the volume back at the same level
     * it was before mute.
     */
    mute() {
        this.muted = true
    }
    
    /**
     * Unmutes the sound so that it can be heard (provided the volume is high
     * enough), but doesn't actually change the volume property. This will put
     * the volume back at the same level it was before it was muted.
     */
    unmute() {
        this.muted = false
    }

    // on() {

    // }
}