import Bus, { isBusProps, type BusProps } from '@api/Bus'
import type Sound from '@api/Sound'
import Output from '@/sandbox/output'
import { currentLocation } from './moduleRunner'

/**
 * Internal. The user client's volume/mute controls accessed via the editor UI. Applies
 * over top of all buses and can't be modified by user scripts.
 */
export const _client = {
    volume: 1,
    muted: false
}

const defaultBuses = () => [
    new Bus('Music'),
    new Bus('Effects'),
    new Bus('UI'),
    new Bus('Ambient'),
    new Bus('Dialogue')
]

/**
 * Controls all of the game's audio at once and manages buses.
 */
export default class Mixer {
    /** Internal. Not in buses so that users can't control which sounds belong to it. */
    _master = new Bus('master')
    /** Internal. Contains all sounds added. */
    _sounds: Sound[] = []
    _buses: Bus[] = defaultBuses()

    /**
     * Master volume, multiplied into every sound's volume. Changes the overall volume of all
     * the audio in the game.
     */
    get volume(): number {
        return this._master.volume
    }
    set volume(volume: number) {
        this._master.volume = volume
        this._applyAll()
    }

    /**
     * Master pitch, added to every sound's pitch. Changes the overall pitch of all the audio
     * in the game.
     */
    get pitch(): number {
        return this._master.pitch
    }
    set pitch(pitch: number) {
        this._master.pitch = pitch
        this._applyAll()
    }

    /**
     * Master speed, multiplied into every sound's speed. Changes the overall playback speed of
     * all the audio in the game.
     */
    get speed(): number {
        return this._master.speed
    }
    set speed(speed: number) {
        this._master.speed = speed
        this._applyAll()
    }

    /**
     * True while all the game's audio is muted. Setting this (or using Mixer.mute() &
     * Mixer.unmute()) affects all the audio in the game.
     */
    get muted(): boolean {
        return this._master.muted
    }
    set muted(muted: boolean) {
        this._master.muted = muted
        this._applyAll()
    }

    /** Mute all sounds in the game. */
    mute() {
        this.muted = true
    }

    /**
     * Unmute all sounds in the game. NOTE: This does not automatically make all sounds able to be
     * heard, since sounds are also considered muted if their bus is still muted or if they're
     * still individually muted.
     */
    unmute() {
        this.muted = false
    }

    /**
     * Every bus, including the default ones.
     * @returns A copy of the mixer's buses array.
     */
    get buses(): Bus[] {
        return [...this._buses]
    }

    /**
     * Get a bus by providing its name (not case-sensitive).
     * @returns The sound bus matching the provided name.
     * @throws Error when no bus is found with that name. Use Mixer.hasBus() to check
            for existence of a bus matching the name.
     */
    bus(name: string): Bus {
        const bus = this._getBus(name)
        if (bus) return bus
        throw new Error(`No mixer bus found with the name '${name}'`)
    }

    /**
     * Check if a bus with a given name exists.
     * @param name The bus's name to check.
     */
    hasBus(name: string): boolean {
        return this._getBus(name) !== undefined
    }

    /**
     * Creates and adds a new bus. If a bus with that name already exists, no new bus is added: an
     * options object's properties are set on the existing bus instead.
     * @param nameOrProps The new bus's name, or an options object with at least a name.
     * @returns The new bus, or the existing one with that name.
     */
    addBus(nameOrProps: string | BusProps): Bus {
        if (typeof nameOrProps !== 'string' && !isBusProps(nameOrProps)) {
            throw new Error(`Mixer.addBus() needs a bus name or a bus options object with at least a 'name' property, like Mixer.addBus({ name: 'footsteps' })`)
        }
        const name = typeof nameOrProps === 'string' ? nameOrProps : nameOrProps.name
        const existingBus = this._getBus(name)

        // Ensure name uniqueness
        if (existingBus) {
            let warnMsg = `A mixer bus with name '${name}' already exists. `
            try {
                if (typeof nameOrProps === 'string' || (nameOrProps.muted === undefined && nameOrProps.pitch === undefined && nameOrProps.sounds === undefined && nameOrProps.speed === undefined && nameOrProps.volume === undefined)) {
                    // If a duplicate bus name was provided only, don't do anything
                    warnMsg += `Ignoring this command.`
                } else {
                    // If a BusProps object was provided with a duplicate name, just
                    // set properties of the extant bus
                    warnMsg += `Setting properties of the existing bus rather than adding a new one.`
                    existingBus.set(nameOrProps)
                }
            } finally {
                Output.runtimeWarning(warnMsg, currentLocation())
            }
            return existingBus
        }

        const bus = new Bus(nameOrProps)
        this._buses.push(bus)
        return bus
    }

    /** The music bus. */
    get music(): Bus {
        return this.bus('Music')
    }
    /** The effects bus. */
    get effects(): Bus {
        return this.bus('Effects')
    }
    /**
     * The UI bus. Intended for UI sound effects like beeps, taps, and clicks played on
     * menu interactions.
     */
    get ui(): Bus {
        return this.bus('UI')
    }
    /**
     * The ambient bus. Intended for background sound effects like wildlife, weather, and
     * other environmental elements.
     */
    get ambient(): Bus {
        return this.bus('Ambient')
    }
    /**
     * The dialogue bus. Intended for character voices.
     */
    get dialogue(): Bus {
        return this.bus('Dialogue')
    }

    /** Internal. Like bus(), but undefined instead of throwing when there's no match. */
    _getBus(name: string | undefined): Bus | undefined {
        return this._buses.find((item) => item.name.toLowerCase() === name?.toLowerCase())
    }

    /** Internal. Calculates and applies all net values for all sounds. */
    _applyAll() {
        for (const sound of this._sounds) {
            sound._applyAll()
        }
    }

    /** Internal. Reset the mixer on each game run. */
    _reset() {
        // The previous run's sounds are dropped without touching them, their Phaser sounds may
        // already be gone. The master bus never holds sounds, so its reset() reaches none of them.
        this._master.reset()
        this._buses = defaultBuses()
        this._sounds = []
    }
}

/** The mixer singleton. */
export const mixer = new Mixer()

/*
 * The client's volume/mute control (the canvas toolbar's volume dropdown)
 * lands here, routed through core.ts's setClientAudio. The client values
 * can't be accessed through user scripts.
 */
export function setClientVolume(volume: number) {
    _client.volume = volume
    mixer._applyAll()
}
export function setClientMute(muted: boolean) {
    _client.muted = muted
    mixer._applyAll()
}
