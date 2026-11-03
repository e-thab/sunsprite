import type Sound from '@api/Sound'

export type BusProps = {
    /**
     * This bus's name. These names are already taken by the default buses:
     * - Ambient
     * - Dialogue
     * - Effects
     * - Music
     * - UI
     */
    name: string
    /**
     * An array of all the sounds that should belong to this bus. Setting this removes any sounds
     * not in the new array. If you want to add sounds without removing any current ones, instead
     * use bus.addSounds()
     */
    sounds?: Sound[]
    /**
     * True while the bus's sound is muted. Does not check volume; this being true
     * does not necessarily mean that its volume is 0.
     */
    muted?: boolean
    /**
     * Loudness of the bus's sounds. The lower this is, the quieter the sounds.
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
     * Pitch of the bus's sounds in [cents.](https://en.wikipedia.org/wiki/Cent_(music))
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
     * Playback speed of the bus's sound.
     *
     * | Speed | Result |
     * | ------ | ------ |
     * | 0 | Playback never advances, sound can't be heard |
     * | 0.5 | Half the default speed |
     * | 1 | Default playback  |
     * | 2 | Twice as fast as default |
     */
    speed?: number
}

export function isBusProps(value: unknown): value is BusProps {
    return typeof value === 'object'
        && value !== null
        && typeof (value as BusProps).name === 'string'
}

export const busDefaults = {
    muted: false,
    volume: 1,
    pitch: 0,
    speed: 1
}

/**
 * An audio bus, holds an array of sounds and applies properties to each of them. This class is
 * not meant to be instantiated manually, to add a new bus use Mixer.addBus() instead.
 */
export default class Bus {
    _name: string
    _sounds: Sound[] = []
    _muted: boolean = busDefaults.muted
    _volume: number = busDefaults.volume
    _pitch: number = busDefaults.pitch
    _speed: number = busDefaults.speed

    constructor(nameOrProps: string | BusProps) {
        if (typeof nameOrProps === 'string') {
            this._name = nameOrProps.toLowerCase()
            this.muted = busDefaults.muted
            this.volume = busDefaults.volume
            this.pitch = busDefaults.pitch
            this.speed = busDefaults.speed
        } else {
            const props = nameOrProps
            const name = props.name

            this.sounds = props?.sounds ?? []
            this._name = name.toLowerCase()
            this.muted = props?.muted ?? busDefaults.muted
            this.volume = props?.volume ?? busDefaults.volume
            this.pitch = props?.pitch ?? busDefaults.pitch
            this.speed = props?.speed ?? busDefaults.speed
        }
    }

    /** This bus's name. Can't be changed after the bus is created. */
    get name(): string {
        return this._name
    }

    /**
     * An array of all the sounds that belong to this bus. Setting this removes any sounds
     * not in the new array. If you want to add sounds without removing any current ones, instead
     * use bus.addSounds()
     * @returns A copy of the bus's sounds array.
     */
    get sounds(): Sound[] {
        // A copy, so pushing to/splicing the returned array can't add or remove a sound without
        // that sound knowing which bus it's on
        return [...this._sounds]
    }
    set sounds(sounds: Sound[]) {
        this.clear()
        this.addSounds(sounds)
    }

    /**
     * True while the bus's sound is muted. Does not check volume; this being true
     * does not necessarily mean that its volume is 0.
     */
    get muted(): boolean {
        return this._muted
    }
    set muted(mute: boolean) {
        this._muted = mute
        for (const sound of this._sounds) {
            sound._applyMuted()
        }
    }

    /**
     * Loudness of the bus's sounds. The lower this is, the quieter the sounds.
     *
     * | Volume | Result |
     * | ------ | ------ |
     * | 0 | Too quiet to hear |
     * | 0.5 | Half as loud as default |
     * | 1 | Default volume  |
     * | 2 | Twice as loud as default |
     */
    get volume(): number {
        return this._volume
    }
    set volume(volume: number) {
        this._volume = volume
        for (const sound of this._sounds) {
            sound._applyVolume()
        }
    }

    /**
     * Pitch of the bus's sounds in [cents.](https://en.wikipedia.org/wiki/Cent_(music))
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
    get pitch(): number {
        return this._pitch
    }
    set pitch(pitch: number) {
        this._pitch = pitch
        for (const sound of this._sounds) {
            sound._applyPitch()
        }
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
     */
    get speed(): number {
        return this._speed
    }
    set speed(speed: number) {
        this._speed = speed
        for (const sound of this._sounds) {
            sound._applySpeed()
        }
    }

    /**
     * Stop all sounds on this bus.
     */
    stopAll() {
        for (const sound of this._sounds) sound.stop()
    }

    /**
     * Pause all sounds on this bus.
     */
    pauseAll() {
        for (const sound of this._sounds) sound.pause()
    }

    /**
     * Resume all sounds on this bus. (Play them if they're currently paused)
     */
    resumeAll() {
        for (const sound of this._sounds) sound.resume()
    }

    /**
     * Add a sound to this bus.
     * @param sound The sound object to add to the bus.
     */
    addSound(sound: Sound) {
        // Also takes the sound off its previous bus, if any
        sound._setBus(this)
    }

    /**
     * Add multiple sounds to this bus.
     * @param sounds An array of sound objects to add to the bus.
     */
    addSounds(sounds: Sound[]) {
        for (const sound of sounds) this.addSound(sound)
    }

    /**
     * Remove a sound from this bus.
     * @param sound The sound to remove.
     */
    removeSound(sound: Sound) {
        if (sound._bus === this) sound._setBus(undefined)
    }

    /**
     * Remove multiple sounds from this bus.
     * @param sounds An array of sound objects to remove from the bus.
     */
    removeSounds(sounds: Sound[]) {
        for (const sound of sounds) this.removeSound(sound)
    }

    /**
     * Remove all sounds from this bus.
     * @returns This bus object.
     */
    clear() {
        // Copy first, each _setBus(undefined) removes that sound from this._sounds
        for (const sound of [...this._sounds]) {
            sound._setBus(undefined)
        }
        return this
    }

    /*
     * Internal, only called from Sound._setBus (and the Sound constructor)
     * so that a bus's _sounds and each sound's _bus always agree. Everything else, including the
     * public methods above, goes through _setBus.
     */
    _addSound(sound: Sound) {
        if (!this._sounds.includes(sound)) this._sounds.push(sound)
    }

    _removeSound(sound: Sound) {
        this._sounds = this._sounds.filter((item) => item !== sound)
    }

    /**
     * Set any number of bus properties at once, except name.
     * @param props An object containing the properties to set and their values.
     * @returns This bus object.
     */
    set(props: Omit<BusProps, 'name'>) {
        if (props.sounds !== undefined) this.sounds = props.sounds
        if (props.muted !== undefined) this.muted = props.muted
        if (props.volume !== undefined) this.volume = props.volume
        if (props.pitch !== undefined) this.pitch = props.pitch
        if (props.speed !== undefined) this.speed = props.speed
        return this
    }

    /**
     * Reset this bus's properties back to default. Doesn't change which sounds belong to the bus.
     * @returns This bus object.
     */
    reset() {
        this.muted = busDefaults.muted
        this.volume = busDefaults.volume
        this.pitch = busDefaults.pitch
        this.speed = busDefaults.speed
        return this
    }

    /**
     * How the bus should look when converted to a string.
     * @returns A string of the format `<Bus: {name}>`
     */
    toString(): string {
        return `<Bus: ${this.name}>`
    }
}
