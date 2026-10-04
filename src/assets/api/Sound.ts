import Phaser from 'phaser'
import { scene } from '@api/core'

export type SoundProps = {
    /** Sound's audio source. A file path or URL. */
    src?: string
    /** True when the sound is muted. */
    muted?: boolean
    /** Loudness of the sound in a range from 0 (quietest) to 1 (loudest). */
    volume?: number
    /**
     * Pitch of the sound in [cents.](https://en.wikipedia.org/wiki/Cent_(music))
     * 
     * 0 means no change in pitch, every 100 increases by one semitone. For example,
     * if your sound is around 440hz (A4):
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
}

/** A sound that can play an audio file. */
export default class Sound {
    _ref: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound

    _src: string
    // muted: boolean = false
    _volume: number
    _pitch: number
    _muted: boolean

    constructor(props?: SoundProps) {
        // TODO: Check if key exists in scene (from file tree preload), otherwise load now
        this._src = props?.src ?? 'win'
        this._ref = scene.sound.add(this._src)

        this._volume = props?.volume ?? 1
        // this.volume = this._volume

        this._pitch = props?.pitch ?? 0
        // this.pitch = this._pitch

        this._muted = props?.muted ?? false
        // this.muted = this._muted
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
    }

    /** Loudness of the sound in a range from 0 (quietest) to 1 (loudest). */
    get volume(): number {
        return this._volume
    }
    set volume(volume: number) {
        this._volume = volume
        this._ref.setVolume(volume)
    }

    /**
     * Pitch of the sound in [cents.](https://en.wikipedia.org/wiki/Cent_(music))
     * 
     * 0 means no change in pitch, every 100 increases by one semitone. For example,
     * if your sound is around 440hz (A4):
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

    /** True when the sound is muted. */
    get muted(): boolean {
        return this._muted
    }
    set muted(mute: boolean) {
        this._muted = mute
        this._ref.setMute(mute)
    }

    /** Play the sound until finished or stopped manually. */
    play() {
        this._ref.play()
    }

    /** True if the sound is currently playing. */
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
     * Mutes the sound. This is different from setting volume to 0 because the
     * current volume is saved and restored on unmute().
     */
    mute() {
        this.muted = true
    }
    
    /**
     * Unmutes the sound. It may still not be audible if the volume is too low.
     */
    unmute() {
        this.muted = false
    }

    // on() {

    // }
}