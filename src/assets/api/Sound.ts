import Phaser from 'phaser'
import { scene } from '@api/core'

export type SoundProps = {
    /** Sound's audio source. A file path or URL. */
    src?: string
    /** True when the sound is muted. */
    muted?: boolean
}

/** A sound that can play an audio file. */
export default class Sound {
    _ref: Phaser.Sound.NoAudioSound | Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound

    // muted: boolean = false

    constructor(props?: SoundProps) {
        // TODO: Check if key exists in scene (from file tree preload), otherwise load now
        const key = props?.src ?? 'win'
        this._ref = scene.sound.add(key)
    }

    get volume(): number {
        return this._ref.volume
    }
    set volume(volume: number) {
        this._ref.setVolume(volume)
    }

    get muted(): boolean {
        return this._ref.mute
    }
    set muted(mute: boolean) {
        if (mute) {
            this.mute()
        } else {
            this.unmute()
        }
    }

    play() {
        this._ref.play()
    }

    pause() {
        this._ref.pause()
    }

    resume() {
        this._ref.resume()
    }

    stop() {
        this._ref.stop()
    }

    /**
     * Mutes the sound. This is different from setting volume to 0 because the
     * current volume is saved and restored on unmute().
     */
    mute() {
        this._ref.setMute(true)
    }
    
    unmute() {
        this._ref.setMute(false)
    }

    // on() {

    // }
}