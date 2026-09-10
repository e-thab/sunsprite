import Output from './output'
import type { WatchCardSnapshot } from './protocol'

// Sandbox-side implementation of the user-facing watch() API (see
// WatchPanel.vue and stores/watchPanelStore.ts on the host side). Shares the
// shape of the host's own addCard() so both are called the same way, but
// getters run here, where the user's game state actually lives — only their
// formatted results cross the postMessage boundary, same as output.ts does
// for print/warn/error.

interface WatchCard {
    label: string
    values: Record<string, () => any>
}

const cards = new Map<string, WatchCard>()

// Sub-item keys (per card label) that errored on the *previous*
// collectWatchSnapshot() call, so a getter that keeps throwing every ~60ms
// tick only gets reported to Output once, on the transition into failure —
// not continuously. Rebuilt from scratch each call (see collectWatchSnapshot)
// rather than mutated in place, so a key that stops erroring is dropped and
// a later failure is treated as a fresh occurrence and reported again.
let previousErrorKeys = new Map<string, Set<string>>()

/**
 * Adds an item to the watch panel.
 * @param label The card's title.
 * @param values An object whose properties are value labels, and whose values are functions returning the value to watch.
 */
export function watch(label: string, values: Record<string, () => any>): void
/**
 * Adds an item to the watch panel.
 * @param label The card's title.
 * @param value A function returning the value to watch.
 */
export function watch(label: string, value: () => any): void
// Registers (or replaces) a card of live values shown in the editor's Watch
// panel. Re-calling with the same label replaces its sub-items in place, so
// a script can call this once per run without accumulating duplicates.
//
// A single getter (rather than a labeled record) adds a card with one
// top-level value and no sub-items — stored under an empty-string key, which
// the rendering side (WatchPanel.vue) treats the same way InfoPanel.vue
// already treats a missing sub-label: shown unlabeled.
export function watch(label: string, valueOrValues: Record<string, () => any> | (() => any)) {
    const values = typeof valueOrValues === 'function' ? { '': valueOrValues } : valueOrValues
    cards.set(label, { label, values })
}

// Removes a card from the editor's Watch panel. No-op if no card is
// registered under that label. The host side picks this up on its own — the
// next status snapshot simply won't include the label, and
// watchPanelStore.syncFromSandbox() already drops any card that disappears
// between two snapshots.
/**
 * Removes an item from the watch panel.
 * @param label The card's title.
 */
export function unwatch(label: string) {
    cards.delete(label)
}

/** Called at the start of each run so a previous run's cards don't linger. */
export function clearWatchCards() {
    cards.clear()
    previousErrorKeys = new Map()
}

function round(value: number, digits: number): number {
    const factor = 10 ** digits
    return Math.round(value * factor) / factor
}

function formatValue(value: unknown): string {
    if (value === undefined) return 'undefined'
    if (value === null) return 'null'
    if (typeof value === 'number') return Number.isFinite(value) ? String(round(value, 3)) : String(value)
    if (typeof value === 'boolean') return String(value)
    if (typeof value === 'string') return value
    try {
        return JSON.stringify(value) ?? String(value)
    } catch {
        return '<unserializable>'
    }
}

/** Evaluates every registered card's getters into a structured-cloneable snapshot. */
export function collectWatchSnapshot(): WatchCardSnapshot[] {
    const nextErrorKeys = new Map<string, Set<string>>()

    const snapshot = Array.from(cards.values()).map((card) => ({
        label: card.label,
        items: Object.entries(card.values).map(([label, getValue]) => {
            try {
                return { label, value: formatValue(getValue()) }
            } catch (err) {
                const wasErroring = previousErrorKeys.get(card.label)?.has(label) ?? false
                if (!wasErroring) {
                    const message = err instanceof Error ? err.message : String(err)
                    Output.error(`Watch "${card.label}"${label ? ` (${label})` : ''}: ${message}`)
                }

                let cardErrors = nextErrorKeys.get(card.label)
                if (!cardErrors) nextErrorKeys.set(card.label, cardErrors = new Set())
                cardErrors.add(label)

                return { label, value: 'error', error: true }
            }
        }),
    }))

    previousErrorKeys = nextErrorKeys
    return snapshot
}
