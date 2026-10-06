import Phaser from 'phaser'
import { scene } from '@api/core'

/* TODO:
* Create an audio bus system. Sounds should have a `bus` property that tracks
* which bus they belong to. All sounds belonging to that bus can be adjusted
* using Sound.Bus(name).property. i.e. Sound.Bus('effects').volume = 50
* 
* A few default buses should be provided:
*   Master, Music, Effects, UI, Environment, Dialogue
* 
* The master bus is a special bus containing all sounds on all other buses.
* Default buses can be accessed using i.e. Sound.Bus('Music') (case-insensitive)
* or through static providers Sound.Music, Sound.Effects, etc.
* 
* Custom buses can be:
*   - Created with Sound.addBus(name)
*   - Gotten with Sound.Bus(name)
*/

/* TODO 2:
* - Look into adjusting pitch/speed without affecting each other
* - `On` events; onFinish, onStart, maybe more
*/

export type SoundProps = {
    /** Sound's audio source. A file path or URL. */
    src?: string
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
     */
    pitch?: number
    /**
     * Playback speed of the sound. 1 is normal speed, 0.5 is half (takes twice as long),
     */
    speed: number
    /** Whether this sound automatically repeats when it's finished. */
    loop: boolean
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

    constructor(props?: SoundProps) {
        // TODO: Check if key exists in scene (from file tree preload), otherwise load now
        this._src = props?.src ?? 'win'
        this._ref = scene.sound.add(this._src)

        this._volume = props?.volume ?? 1
        this.volume = this._volume

        this._pitch = props?.pitch ?? 0
        this.pitch = this._pitch

        this._muted = props?.muted ?? false
        this.muted = this._muted

        this._speed = props?.speed ?? 1
        this.speed = this._speed

        this._loop = props?.loop ?? false
        this.loop = this._loop
    }

    /** Set any number of sound properties at once. */
    set(props?: SoundProps) {
        if (props?.src !== undefined) this.src = props.src
        if (props?.volume !== undefined) this.volume = props.volume
        if (props?.pitch !== undefined) this.pitch = props.pitch
        if (props?.speed !== undefined) this.speed = props.speed
        if (props?.muted !== undefined) this.muted = props.muted
        if (props?.loop !== undefined) this.loop = props.loop
    }

    /** Sound's audio source. A file path or URL. */
    get src(): string {
        return this._src
    }
    set src(src: string) {
        // Check for key existence
        if (src === this._src) return

        this._ref.destroy()
        this._ref = scene.sound.add(src)
        this.set({
            volume: this._volume,
            pitch: this._pitch,
            muted: this._muted,
            speed: this._speed,
            loop: this._loop,
        })
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

    /** Playback rate of the sound. */
    get speed(): number {
        return this._speed
    }
    set speed(speed: number) {
        this._speed = speed
        this._ref.setRate(speed)
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
     */
    get volume(): number {
        return this._volume
    }
    set volume(volume: number) {
        volume = Math.max(0, volume)
        this._volume = volume
        this._ref.setVolume(volume)
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
     */
    get pitch(): number {
        return this._pitch
    }
    set pitch(pitch: number) {
        this._pitch = pitch
        this._ref.setDetune(pitch)
    }

    /**
     * True while the sound is muted. Does not check volume; a sound being
     * muted does not mean its volume is 0.
     */
    get muted(): boolean {
        return this._muted
    }
    set muted(mute: boolean) {
        this._muted = mute
        this._ref.setMute(mute)
    }

    /** Whether this sound automatically repeats when it's finished. */
    get loop(): boolean {
        return this._loop
    }
    set loop(loop: boolean) {
        this._loop = loop
        this._ref.setLoop(loop)
    }

    /** Play the sound until finished or stopped manually. */
    play() {
        this._ref.play()
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