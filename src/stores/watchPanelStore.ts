import { defineStore } from 'pinia'
import { reactive } from 'vue'
import type { WatchCardSnapshot } from '@/sandbox/protocol'

export interface WatchCard {
    label: string
    values: Record<string, () => any>
    /** Sub-item keys the sandbox already caught erroring and reported via its
     *  own Output.error() (see sandbox/watch.ts) — WatchPanel.vue uses this to
     *  show error styling without re-invoking (and re-reporting) the getter,
     *  which for these entries is just a trivial closure over an already-
     *  formatted 'error' string, not the real (sandboxed) failing code. */
    errorKeys: Set<string>
}

// Host-side registry for the Watch panel's cards (see WatchPanel.vue). Two
// sources feed it: host code can call addCard() directly (getters run here,
// e.g. against mouseRef/timerRef); the sandboxed user-facing watch() API
// (src/sandbox/watch.ts) instead arrives via syncFromSandbox(), relayed
// through hostBridge.ts's 'status' handler — its getters already ran inside
// the iframe, so what crosses over is pre-formatted display strings.
export const useWatchPanelStore = defineStore('watchPanel', () => {
    const cards = reactive(new Map<string, WatchCard>())

    // Labels most recently reported by the running sandbox, so a card whose
    // watch() call disappears between runs (edited out, or the run ended)
    // gets dropped instead of lingering as a stale ghost entry. Host-added
    // cards aren't tracked here and are never touched by the sync.
    let sandboxLabels = new Set<string>()

    // Keyed by label, so re-registering the same label (e.g. a script calling
    // this again on every run) replaces that card's sub-items in place
    // instead of accumulating duplicates.
    function addCard(label: string, values: Record<string, () => any>) {
        cards.set(label, { label, values, errorKeys: new Set() })
    }

    function syncFromSandbox(snapshot: WatchCardSnapshot[]) {
        const nextLabels = new Set(snapshot.map((card) => card.label))

        for (const label of sandboxLabels) {
            if (!nextLabels.has(label)) cards.delete(label)
        }

        for (const card of snapshot) {
            // Values already arrived as formatted strings, so each getter is
            // just a trivial closure over that string — WatchPanel.vue's own
            // formatting is a harmless no-op passthrough on the result.
            const values = Object.fromEntries(card.items.map((item) => [item.label, () => item.value]))
            const errorKeys = new Set(card.items.filter((item) => item.error).map((item) => item.label))
            cards.set(card.label, { label: card.label, values, errorKeys })
        }

        sandboxLabels = nextLabels
    }

    return { cards, addCard, syncFromSandbox }
})
