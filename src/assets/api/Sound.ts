import Phaser from 'phaser'
import { scene } from '@api/core'
import { _audioSourceStatus, _reportFailedLoad, type AudioSource } from '@api/assets'
import Output from '@/sandbox/output'

/* TODO:
* Create an audio bus system. Sounds should have a `bus` property that tracks
* which bus they belong to. All sounds belonging to that bus can be adjusted
* using Sound.Bus(name).property. i.e. Sound.Bus('effects').volume = 50
* 
* A few default buses should be provided:
*   Master, Music, Effects, UI, Ambient, Dialogue
* 
* The master bus is a special bus containing all sounds on all other buses.
* Default buses can be accessed using i.e. Sound.Bus('Music') (case-insensitive)
* or through static providers Sound.Music, Sound.Effects, etc.
* 
* Custom buses can be:
*   - Created with Sound.addBus(name)
*   - Gotten with Sound.Bus(name)
* 
* note: ensure name uniqueness?
*/

/* TODO 2:
* - Look into adjusting pitch/speed without affecting each other
* - `On` events; onFinish, onStart, maybe more
*/

export type BusProps = {
    /**
     * This bus's name. A few names are already taken by the default buses:
     * - Ambient
     * - Dialogue
     * - Effects
     * - Master
     * - Music
     * - UI
     */
    name?: string
    /** A list of sounds to add to the bus. */
    sounds?: Sound[]
    /**
     * True while the sound is muted. Does not check volume; this being true
     * does not mean its volume is 0.
     */
    muted?: boolean
    /**
     * Loudness of sounds on the bus. The lower this is, the quieter the sounds.
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
    speed?: number
}

type BusPropsWithName = Omit<BusProps, 'name'> & Required<Pick<BusProps, 'name'>>

function isBusPropsWithName(value: unknown): value is BusPropsWithName {
    return typeof value === 'object'
        && value !== null
        && typeof (value as BusProps).name === 'string'
}

const soundDefaults = {
    muted: false,
    volume: 1,
    pitch: 0,
    speed: 1,
    loop: false
}

/**
 * An audio bus, holds an array of sounds and applies properties to each of them. This class is
 * not meant to be instantiated manually, to add a new bus use Sound.addBus() instead.
 */
export class Bus {
    name: string
    sounds: Sound[]
    _muted: boolean = false
    _volume: number = 1
    _pitch: number = 0
    _speed: number = 1

    constructor(nameOrProps: string | BusPropsWithName) {
        if (typeof nameOrProps === 'string') {
            this.name = nameOrProps.toLowerCase()
            this.sounds = []
            this.muted = soundDefaults.muted
            this.volume = soundDefaults.volume
            this.pitch = soundDefaults.pitch
            this.speed = soundDefaults.speed
        } else {
            const props = nameOrProps
            const name = props.name
            this.name = name.toLowerCase()
            this.sounds = props?.sounds ?? []
            this.muted = props?.muted ?? soundDefaults.muted
            this.volume = props?.volume ?? soundDefaults.volume
            this.pitch = props?.pitch ?? soundDefaults.pitch
            this.speed = props?.speed ?? soundDefaults.speed
        }
    }

    get muted(): boolean {
        return this._muted
    }
    set muted(mute: boolean) {
        this._muted = mute
        for (const sound of this.sounds) {
            sound._applyMuted()
        }
    }

    get volume(): number {
        return this._volume
    }
    set volume(volume: number) {
        this._volume = volume
        for (const sound of this.sounds) {
            sound._applyVolume()
        }
    }

    get pitch(): number {
        return this._pitch
    }
    set pitch(pitch: number) {
        this._pitch = pitch
        for (const sound of this.sounds) {
            sound._applyPitch()
        }
    }

    get speed(): number {
        return this._speed
    }
    set speed(speed: number) {
        this._speed = speed
        for (const sound of this.sounds) {
            sound._applySpeed()
        }
    }

    addSound(sound: Sound, unique: boolean = true) {
        // Guarantee uniqueness (each Sound must have at most 1 bus)
        if (unique) for (const bus of Sound.buses) {
            if (bus.sounds.includes(sound)) bus.removeSound(sound)
        }
        this.sounds.push(sound)
    }

    removeSound(sound: Sound) {
        this.sounds = this.sounds.filter((item) => sound !== item)
    }

    clear() {
        this.sounds = []
    }

    set(props: BusProps) {
        if (props.sounds !== undefined) this.sounds = props.sounds
        if (props.muted !== undefined) this.muted = props.muted
        if (props.volume !== undefined) this.volume = props.volume
        if (props.pitch !== undefined) this.pitch = props.pitch
        if (props.speed !== undefined) this.speed = props.speed
    }

    reset() {
        this.muted = soundDefaults.muted
        this.volume = soundDefaults.volume
        this.pitch = soundDefaults.pitch
        this.speed = soundDefaults.speed
        return this
    }

    toString(): string {
        return `<Bus: ${this.name}>`
    }
}

/**
 * A locally-controlled client bus. This is like the master bus, but can't be accessed via user
 * scripts. This is the bus modified when users adjust the volume sliders in the editor UI.
 * Only volume and mute are used as of now.
 */
// const _clientBus = new Bus('Client')
const _client = {
    volume: 1,
    muted: false
}

/** The API-accessible master bus. */
const masterBus = new Bus('Master')
const defaultBuses = () => [
    masterBus,
    new Bus('Music'),
    new Bus('Effects'),
    new Bus('UI'),
    new Bus('Ambient'),
    new Bus('Dialogue')
]

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
     * 2 is double (twice as fast).
     */
    speed?: number
    /** Whether this sound automatically repeats when it's finished. */
    loop?: boolean
}

function _getBus(name: string | undefined): Bus | undefined {
    return Sound.buses.find((item) => item.name === name)
}

/*
 * The client's volume/mute control (the canvas toolbar's volume dropdown)
 * lands here, routed through core.ts's setClientAudio. The client bus
 * can't be accessed through user scripts.
 */
export function setClientVolume(volume: number) {
    _client.volume = volume
    Sound._applyAll()
}
export function setClientMute(muted: boolean) {
    _client.muted = muted
    Sound._applyAll()
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
    static buses: Bus[] = defaultBuses()
    static allSounds: Sound[] = []

    constructor(props?: SoundProps) {
        this._src = props?.src ?? 'win'
        this._volume = Math.max(0, props?.volume ?? 1)
        this._pitch = props?.pitch ?? 0
        this._muted = props?.muted ?? false
        this._speed = props?.speed ?? 1
        this._loop = props?.loop ?? false
        this._bus = _getBus(props?.bus)
        this._bus?.addSound(this, false)
        this._ref = this._createRef(this._src)
        Sound.allSounds.push(this)
    }

    /** Returns the Bus object matching a given name. */
    static Bus(name: string): Bus | undefined {
        return _getBus(name)
    }

    /** Creates and adds a new Bus. */
    static addBus(nameOrProps: string | BusPropsWithName): Bus {
        const busName = typeof nameOrProps === 'string' ? nameOrProps : nameOrProps.name
        
        for (const bus of Sound.buses) {
            // Warn if name is not unique
            // TODO: TEST!!
            if (bus.name === busName) {
                let warnMsg = `A sound bus with name ${busName} already exists. `
                try {
                    if (typeof nameOrProps === 'string') {
                        warnMsg += `Ignoring Sound.addBus('${busName}')`
                    }
                    if (isBusPropsWithName(nameOrProps)) {
                        warnMsg += `Setting properties of the existing bus rather than adding a new one.`
                        bus.set(nameOrProps)
                    }
                } finally {
                    Output.warn(warnMsg)
                }
                break
            }
        }
        
        const bus = new Bus(nameOrProps)
        Sound.buses.push(bus)
        return bus
    }

    /**
     * Volume of the master bus. All sounds are on the master bus, so adjusting this property
     * changes the overall volume of the entire game.
     */
    static get volume(): number {
        return masterBus.volume
    }
    static set volume(volume: number) {
        masterBus.volume = volume
        Sound._applyAll()
    }

    /**
     * Pitch of the master bus. All sounds are on the master bus, so adjusting this property
     * changes the overall pitch of the entire game.
     */
    static get pitch(): number {
        return masterBus.pitch
    }
    static set pitch(pitch: number) {
        masterBus.pitch = pitch
        Sound._applyAll()
    }

    /**
     * Speed of the master bus. All sounds are on the master bus, so adjusting this property
     * changes the overall playback speed of all the audio in the game.
     */
    static get speed(): number {
        return masterBus.speed
    }
    static set speed(speed: number) {
        masterBus.speed = speed
        Sound._applyAll()
    }

    /**
     * Mute state of the master bus. All sounds are on the master bus, so adjusting this property
     * (or using Sound.mute() & Sound.unmute()) affects all the audio in the game.
     */
    static get muted(): boolean {
        return masterBus.muted
    }
    static set muted(muted: boolean) {
        masterBus.muted = muted
        Sound._applyAll()
    }

    /** Mute all sounds in the game. */
    static mute() {
        Sound.muted = true
    }

    /**
     * Unmute all sounds in the game. NOTE: This does not automatically make all sounds able to be
     * heard, since sounds are also considered muted if their non-master bus is still muted or if
     * they're still individually muted.
     */
    static unmute() {
        Sound.muted = false
    }

    /** Internal. Calculates and applies all net values for all sounds. */
    static _applyAll() {
        for (const sound of Sound.allSounds) {
            sound._applyAll()
        }
    }

    /** Internal. Reset sound manager on each game run. */
    static _reset() {
        masterBus.clear()
        masterBus.reset()
        Sound.buses = defaultBuses()
        Sound.allSounds = []
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

    /** Set any number of sound properties at once. */
    set(props?: SoundProps) {
        if (props?.src !== undefined) this.src = props.src
        if (props?.bus !== undefined) this.bus = props.bus
        if (props?.volume !== undefined) this.volume = props.volume
        if (props?.pitch !== undefined) this.pitch = props.pitch
        if (props?.speed !== undefined) this.speed = props.speed
        if (props?.muted !== undefined) this.muted = props.muted
        if (props?.loop !== undefined) this.loop = props.loop
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
     * Playback speed of the sound. 1 is normal speed, 0.5 is half (takes twice as long),
     * 2 is double (twice as fast).
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
        return this._speed * masterBus.speed * (this._bus?.speed ?? 1)
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
        return this._volume * masterBus.volume * (this._bus?.volume ?? 1)
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
        return this._pitch + masterBus.pitch + (this._bus?.pitch ?? 0)
    }

    /**
     * True while the sound is muted. Does not check volume; a sound being
     * muted does not mean its volume is 0, even though it can't be heard.
     * 
     * If this sound's bus is muted, this sound is considered muted.
     */
    get muted(): boolean {
        return masterBus.muted || this._bus?.muted || this._muted
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
    set bus(bus: string | undefined) {
        const nextBus = _getBus(bus)
        if (nextBus === undefined) return

        this._bus?.removeSound(this)
        nextBus?.addSound(this)
        this._bus = nextBus
        // Every bus-combined property changes with the bus
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

    // on() {

    // }
}