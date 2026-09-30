import Phaser from 'phaser'
import { scene } from '@api/core'

export type SoundProps = {
    /** Sound's audio source. A file path or URL. */
    src?: string
}

export default class Sound {
    _ref: Phaser.Sound.BaseSound

    constructor(props?: SoundProps) {
        // TODO: Check if key exists in scene (from file tree preload), otherwise load now
        const key = props?.src ?? 'win'
        this._ref = scene.sound.add(key)
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

    // on() {

    // }
}