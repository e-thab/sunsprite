# Play/pause flicker: sequencing pause state across the sandbox boundary

## What this is

The canvas toolbar's Play/Pause button would occasionally flicker — visibly
toggle icon/label two or three times in quick succession — after a single
click, always settling on the correct final state. Not reproducible on
demand; timing-dependent. Root cause was a race between two independent
writers of the same piece of state, not a rendering or event-handling bug.
Fixed by adding a sequence number to the pause/play protocol so the host can
tell a stale state echo from a current one.

## The race

`pausedRef` (`src/sandbox/hostBridge.ts`) had two writers:

1. **Optimistic, on click.** `pause()`/`play()` set `pausedRef.value`
   immediately, then `post()` a `'set-paused'` command into the sandboxed
   iframe.
2. **Polled, every 60ms.** The sandbox (`src/sandbox/main.ts`,
   `startStatusReports()`) broadcasts a `'status'` snapshot on a `setInterval`
   completely independent of any command, and the host's handler
   unconditionally overwrote `pausedRef.value` with whatever that snapshot
   said.

`postMessage` is asynchronous in both directions. If a `'status'` snapshot
generated *before* the sandbox processed the click's `'set-paused'` command
was still in flight when the optimistic write happened, it would land
*after* — stomping the button back to the pre-click state for one tick —
until the next snapshot (now reflecting the applied command) corrected it.
That round trip is what read as "flicker," and it always resolved correctly
because the true state eventually wins once the sandbox catches up.

This is a genuine ordering race, not just a slow-network artifact: it's
triggered by *relative* timing between the click and the interval's phase,
so any main-thread delay on the host (Vue reactivity, layout, GC) widens the
window rather than being the sole cause. It reproduced in a plain timing
simulation even with near-zero simulated latency, and got noticeably worse
with a simulated host-thread stall around the click — consistent with why it
was hard to trigger deliberately but kept turning up in normal use.

## The fix

Added a monotonic sequence number to the `'set-paused'` / `'status'` pair so
the host can recognize a snapshot that predates its latest command and
discard it, instead of trusting whichever message arrives last:

```
user clicks Pause/Play
  → hostBridge.ts pause()/play():
        pausedRef.value = ...        (optimistic, unchanged)
        sentPauseSeq += 1
        post({ type: 'set-paused', paused, seq: sentPauseSeq })

  → sandbox main.ts handleMessage('set-paused'):
        core.ts pause()/play()       (unchanged)
        appliedPauseSeq = message.seq

  → (independently, every 60ms) startStatusReports():
        postToHost({ type: 'status', paused, pauseSeq: appliedPauseSeq, ... })

  → hostBridge.ts onSandboxMessage('status'):
        if (message.pauseSeq >= sentPauseSeq) pausedRef.value = message.paused
```

`sentPauseSeq` only ever increases, and `appliedPauseSeq` echoes the seq of
the last command the sandbox actually applied. A snapshot with
`pauseSeq < sentPauseSeq` is provably stale — generated before the sandbox
caught up — so gating on `>=` discards exactly the messages that caused the
flicker and nothing else. Once the sandbox catches up once, every later
snapshot satisfies the gate again, so this doesn't interfere with the game's
own code calling the exposed `pause()`/`play()` API on itself (e.g.
pause-on-game-over) — those changes don't bump `appliedPauseSeq` at all, and
pass straight through.

## Files touched

| File | What changed |
|---|---|
| `src/sandbox/protocol.ts` | `'set-paused'` carries `seq`; `'status'` echoes `pauseSeq` |
| `src/sandbox/main.ts` | tracks `appliedPauseSeq`, set on `'set-paused'`, included in every status report |
| `src/sandbox/hostBridge.ts` | tracks `sentPauseSeq`; `pause()`/`play()` bump and send it; the `'status'` handler gates the `pausedRef` write on `message.pauseSeq >= sentPauseSeq` |

## Considerations for working with this later

- **Any new host-commandable, optimistically-updated toolbar state needs the
  same pattern, or it can flicker the same way.** The Volume and Settings
  buttons in `PhaserCanvas.vue` are placeholders today (`Output.print(...)`).
  If either grows a real sandbox-side command with a locally-optimistic UI
  control (e.g. a volume slider that updates instantly on drag but is also
  echoed back via `'status'`), it needs its own seq counter — don't just
  reuse `pauseSeq`/`sentPauseSeq`, which are specific to pause state. The
  general shape to copy: (1) add a monotonic counter to the host→sandbox
  command, (2) bump it at the same point as the optimistic local write, (3)
  sandbox remembers "last applied seq" and echoes it back in `'status'`, (4)
  host gates the corresponding status-driven write behind
  `echoed >= sent`.
- **`fpsRef`, `mouseRef`, `clockRef`, `screenRef`, and the watch panel don't
  need this** — nothing writes them optimistically host-side, so there's no
  second writer to race against and "last status wins" is already correct
  for them. Only add gating where a host-initiated command competes with the
  poll.
- **If another call site ever posts `'set-paused'` directly** (bypassing
  `pause()`/`play()` in `hostBridge.ts`), it must also increment and send
  `sentPauseSeq`, or its command becomes invisible to the gate. Symmetrically,
  any sandbox-side code that handles `'set-paused'` outside the one switch
  case in `main.ts`'s `handleMessage()` must also update `appliedPauseSeq`.
- **`runUserCode`'s implicit unpause on restart** (`core.ts`'s `play()` call
  at the start of every run) does *not* bump `appliedPauseSeq`. That's fine —
  the gate only requires `pauseSeq >= sentPauseSeq`, not equality, and
  restart never needs to defeat a click that hasn't landed yet — but if
  restart/run logic changes in a way that could reset `appliedPauseSeq`
  backward, re-check this invariant.
- **`sentPauseSeq` is module-level state in `hostBridge.ts` and is not reset
  by `attachSandbox()`/`detachSandbox()`.** `PhaserCanvas.vue` only mounts
  once per view today, so this doesn't come up, but if the component is ever
  made to remount within the same page session (not a full reload), the
  fresh sandbox's `appliedPauseSeq` restarts at 0 while the host's
  `sentPauseSeq` doesn't — status snapshots would be gated out until the next
  click re-syncs them. This matches how `fpsRef`/`mouseRef`/etc. already go
  stale across a remount with no explicit reset, so it's not a new gap, just
  worth knowing if that scenario becomes real.

## Testing notes

No dedicated test suite exists in this project (no vitest/jest configured).
Verified by:

- Reading the full message path end to end (`PhaserCanvas.vue` →
  `hostBridge.ts` → `protocol.ts` → `main.ts` → `core.ts`) to find the two
  writers.
- A standalone discrete-event timing simulation (Node, not part of the repo —
  scratch file, not committed) modeling both sides' actual logic: the
  interval-driven status broadcast, postMessage latency, and the click. It
  reproduced the exact flicker timeline described in the bug report against
  the pre-fix logic (~7.6% of clicks under realistic latency, ~12.9% with a
  simulated host-thread stall, and still ~0.5% even at near-zero latency,
  confirming it's an ordering race and not purely a delay artifact), and
  showed zero flickers post-fix across all scenarios plus a rapid-re-toggle
  edge case (500/500 settled on the correct final value).
- `vue-tsc --build` passes with the protocol change.
- **Not verified**: clicking the real button in a running browser. This
  project's convention is to ask before spinning up Playwright/the dev
  server for verification rather than doing it unprompted — worth doing as a
  final sanity check before considering this closed, since the bug's own
  defining trait is that it's intermittent and could theoretically have a
  contributing factor the simulation's model doesn't capture.
