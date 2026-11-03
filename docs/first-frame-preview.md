# First-frame preview and flash-free restarts (prototype, reverted)

## What this was

Two related changes to how a run first shows up on the canvas. Both were
built, checked in a headless browser, and then **reverted**. The code they
added was more than the feature was worth. This doc records how they worked
so the work can be picked up again. The full diff is at the end.

1. **First-frame preview.** A project opened in the editor starts paused
   (`EditorView.vue` sends `{type: 'run', paused: true}`). Until now, the
   paused canvas showed only what the main script's top-level code set up.
   Anything a `forever()` loop or another game control sets every frame
   (positions, tints, text) hadn't been set yet, so the first thing you saw
   didn't look like the game. The change ran exactly one game frame before
   pausing.
2. **No flash on restart.** Restarting swaps one Phaser `Game` for a new one.
   Between them the canvas briefly showed either the new game's pre-update
   state or a blank (black) canvas. The change held the old game's last frame
   on screen until the new game had rendered a real frame.

## Part 1: running one frame while paused

### The idea

`pause()` stops `UserScene.update()` from stepping the game (`runControls()`,
smooths, prop updaters, and so on). A new `pauseAfterFirstFrame()` paused as
normal but also set a `_firstFramePending` flag. On the next `update()`
where the flag was set, the scene ran one step and cleared the flag:

```ts
if (!paused) {
    this.step()
} else if (_firstFramePending && !scriptsLoading()) {
    _firstFramePending = false
    clock.frame++          // the clock only counts frames while it's running
    this.step()
}
```

`step()` was the existing body of the `if (!paused)` branch, moved into a
method so both branches could call it. `play()` and `runUserCode()` both
cleared the flag.

### When to take the frame: `scriptsLoading()`

User scripts are compiled so that `import` becomes
`await __sunspriteImport(...)`, which means frames keep ticking while
imports load. If the frame ran on the first `update()`, a project whose
`main.js` imports a helper would step before the helper's loops existed.

Waiting for the entry script to *finish* doesn't work either. A top-level
`await wait(1)` never finishes while paused, because only game time can end
the wait.

So `moduleRunner.ts` tracked which scripts were still **loading**, meaning
fetched or compiled but with no body code run yet:

- Each run gets its own `Set<number>` of load ids (`pendingLoads`). The set is
  replaced each run rather than cleared, so a stale load from the previous run
  can't hold up this one.
- `trackLoad(load)` adds an id, and removes it when the load settles (on
  success or failure).
- `compileScript` takes the `loadId` and appends `__sunspriteStarted(<id>);`
  as the last statement of the one-line prelude. This preserves line numbers.
  That call removes the id as soon as the script's own code starts. A script
  that then awaits something of its own no longer counts as loading.
- `__sunspriteStarted` is exported from the per-run API module alongside the
  existing helpers (`IMPORT_HELPER`, `BLOCK_HELPER`, `LOOP_GUARD`).
- The exported `scriptsLoading()` returns `pendingLoads.size > 0`.

### Wiring in the sandbox

`src/sandbox/main.ts` gained a `pauseNewRun()` helper. It calls
`core.pauseAfterFirstFrame()` when the loaded API version has it, and falls
back to `core.pause()` for snapshot 1.0, which doesn't. It was used in two
places:

- a `run` message with `paused: true`;
- a `set-paused` (paused) that releases a run still held by the audio gate.

### Side effects

- A `print` inside `forever()` printed once when a project opened.
- An error thrown on frame 1 showed up when a project opened.
- A sound started on frame 1 waited for Play, because the audio context is
  still suspended.
- Snapshot 1.0 was unchanged, because of the fallback in `pauseNewRun()`.

## Part 2: no flash on restart

### What was flashing, and why

Each attempt uncovered the next cause:

1. **Pre-update frame.** The new game rendered its top-level state before the
   loops had run. Part 1's frame logic only helps paused runs, so restarts
   needed something else: keep the new canvas hidden until it renders a
   frame that comes *after* the first step.
2. **Black canvas from the old game.** The first attempt left the old WebGL
   canvas in the page while the new one loaded. Phaser uses
   `preserveDrawingBuffer: false`, so the buffer is cleared after every
   present. The GL calls in `destroy(true)` then present that cleared buffer,
   which shows as solid black.
3. **Black canvas from the new game.** Phaser adds its canvas to the page
   blank and visible. A `postBoot` callback that hid it ran 150–350 ms too
   late, because `postBoot` waits for Phaser's default textures to decode.
4. **White on first load.** The dark theme puts `color-scheme: dark` on the
   host page's body, and the iframe inherited it. `runner.html` declares no
   scheme, and Chrome paints an opaque white backdrop behind an iframe whose
   scheme doesn't match its document. The visible game canvas had always
   covered this, so it only showed up once the canvas was hidden during load.

Causes 3 and 4 were found by recording every frame Chrome drew with a CDP
`Page.startScreencast` in Playwright and classifying a pixel grid per frame.
Screenshots are too slow to catch these flashes.

### The mechanism

**Freeze the old frame (core.ts `_freezeFrame`, called first in
`retireGame`).** If the old game is running and its canvas is visible:

- create a 2D canvas the same size, in both backing pixels and CSS size;
- re-render the old scene once (`renderer.preRender()`,
  `scene.render(renderer)`, `renderer.postRender()`) and `drawImage` it into
  the 2D canvas in the same task. A WebGL buffer is only readable in the task
  that drew it;
- insert the still just before the old canvas, replacing any earlier still.

The old game's teardown then runs unchanged: its canvas is removed at once
and `destroy(true)` is called.

If the old canvas was still hidden (a restart during a restart), nothing new
is frozen and the older still stays up.

**Boot the new canvas hidden.** The game config sets
`canvasStyle: 'visibility: hidden'`. Phaser's `CreateRenderer` applies it
before `AddToDOM`, so the canvas is never visible blank.

**Swap them after the first real render (`UserScene.showAfterRender`).** At
the end of every `update()`, once `!scriptsLoading()`, the scene registers a
one-time `POST_RENDER` listener that calls `_showCanvas`. That function
clears the canvas's `visibility` and removes the still. A `shown` flag on
the scene makes this happen once per game. Because the swap happens on
`POST_RENDER`, the two trade places between frames.

**Keep the progress bar visible.** Hiding the new canvas would also hide the
asset-loading progress bar. `_preloadProjectAssets(scene, onProgressShown)`
passed a callback through to `showLoadingProgress`, which called it right
after first drawing the bar (in its `PROGRESS_DELAY_MS` timer). The scene
passed `() => this.showAfterRender()`. A slow download therefore showed the
bar instead of a frozen frame. The trade-off: after a slow load, pre-update
frames could appear between the bar and the first real frame.

**Stack the canvases (`runner.html`).** `#game-container` became
`position: relative`, and `#game-container canvas` became absolutely
positioned at `0, 0`. In normal flow, the new canvas would sit below the
still, and Phaser would read its input bounds from that offset position.

**Match color schemes (`GameFrame.vue`).** Added `color-scheme: normal` to
the `.canvas` iframe so it matches `runner.html` under every theme.

### Verification

In headless Chromium against the dev server, the screencast recording showed:

- on initial load, the iframe's own `#353b48`, then the game's colours, with
  no white;
- on each restart, the game's colours throughout, with no black frames.

`npx vue-tsc --build --force` passed.

Not covered:

- The progress-bar path, because the default project has no assets.
- Hardware WebGL. Headless Chromium renders WebGL in software.

## Files changed

| File | Change |
| --- | --- |
| `src/api/core.ts` | `pauseAfterFirstFrame()`, `_firstFramePending`, `UserScene.step()` / `showAfterRender()` / `shown`, `_freezeFrame()` / `_showCanvas()` / `_frozenFrame`, a call to `_freezeFrame` in `retireGame`, `canvasStyle: 'visibility: hidden'` in the game config |
| `src/api/moduleRunner.ts` | `STARTED_HELPER`, `pendingLoads`, `scriptsLoading()`, `trackLoad()`, a `loadId` parameter on `compileScript` and the `__sunspriteStarted(id)` prelude call |
| `src/api/assets.ts` | Optional `onProgressShown` / `onShown` callback through `_preloadProjectAssets` → `showLoadingProgress` |
| `src/sandbox/main.ts` | `pauseNewRun()`, with a fallback for API versions without `pauseAfterFirstFrame` |
| `runner.html` | `#game-container` made `position: relative`; canvases absolutely positioned |
| `src/components/GameFrame.vue` | `color-scheme: normal` on the iframe |

`moduleRunner.ts` isn't versioned and is shared with the snapshots, so the
changes there were kept additive. The snapshot copies under
`src/api/versions/1.0/` were not touched.

## Simpler pieces worth keeping in mind

Some of this stands on its own if the full feature isn't revived:

- **`color-scheme: normal` on the iframe** is a one-line fix for a latent
  issue. Any time the game canvas doesn't cover the frame in a dark theme, a
  white backdrop shows. With the original code that's rare, because the
  canvas is visible from boot.
- **`canvasStyle`** is the right hook for anything that has to apply to a
  Phaser canvas before it's on screen. `postBoot` is too late.
- **The first-frame preview on its own** (Part 1) works without Part 2.
  Most of its complexity is `scriptsLoading()`. A version that just runs the
  first `update()` would be a few lines, but projects that import other
  scripts would get a frame that's wrong in a different way.

## Full diff

The diff against `15a7894` (staging) at the time of the revert. It can be
re-applied by saving the block to a file and running `git apply` on it.

<details>
<summary>git diff</summary>

```diff
diff --git a/runner.html b/runner.html
index a6ed967..d1eae85 100644
--- a/runner.html
+++ b/runner.html
@@ -32,13 +32,21 @@
       }
 
       #game-container {
+        position: relative;
         width: 100%;
         height: 100%;
         overflow: hidden;
       }
 
-      canvas {
+      /* Stacked rather than in flow: while a restart's new canvas is still
+         hidden, a still of the old game's last frame stands in for it (see
+         core.ts's _frozenFrame). In flow, the new one would sit below it, and
+         Phaser would read its input bounds from there. */
+      #game-container canvas {
         display: block;
+        position: absolute;
+        top: 0;
+        left: 0;
       }
 
       /* Shown by src/sandbox/audioGate.ts only when the browser won't let the
diff --git a/src/api/assets.ts b/src/api/assets.ts
index f49ab5f..019f3d6 100644
--- a/src/api/assets.ts
+++ b/src/api/assets.ts
@@ -103,8 +103,10 @@ export function _setProjectAssets(assets: readonly ProjectAsset[], runTheme?: Th
  * Anything decoded by an earlier run goes straight into the new Game's caches
  * instead. Phaser holds off create() — and with it the user's script — until
  * the loader is done, so everything is in place by the script's first line.
+ * `onProgressShown` runs if the download takes long enough to put up a
+ * progress bar, as it's first drawn.
  */
-export function _preloadProjectAssets(scene: Phaser.Scene) {
+export function _preloadProjectAssets(scene: Phaser.Scene, onProgressShown?: () => void) {
     const pending: ProjectAsset[] = []
     // Why each pending file failed, if the loader said — see collectLoaded.
     const loadErrors = new Map<string, string>()
@@ -155,7 +157,7 @@ export function _preloadProjectAssets(scene: Phaser.Scene) {
 
     if (pending.length === 0) return
 
-    const hideProgress = showLoadingProgress(scene, new Set(pending.map((asset) => asset.name)))
+    const hideProgress = showLoadingProgress(scene, new Set(pending.map((asset) => asset.name)), onProgressShown)
     scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
         hideProgress()
         collectLoaded(scene, pending, loadErrors)
@@ -282,7 +284,7 @@ const PROGRESS_DELAY_MS = 150
  * the Sunsprite Camera/Screen/Background wrappers are only set up in create().
  * Returns the cleanup.
  */
-function showLoadingProgress(scene: Phaser.Scene, pendingNames: ReadonlySet<string>): () => void {
+function showLoadingProgress(scene: Phaser.Scene, pendingNames: ReadonlySet<string>, onShown?: () => void): () => void {
     let graphics: Phaser.GameObjects.Graphics | undefined
     let label: Phaser.GameObjects.Text | undefined
     const total = pendingNames.size
@@ -331,6 +333,7 @@ function showLoadingProgress(scene: Phaser.Scene, pendingNames: ReadonlySet<stri
             color: '#ffffffb3',
         }).setOrigin(0.5, 1)
         draw()
+        onShown?.()
     }, PROGRESS_DELAY_MS)
 
     // FILE_COMPLETE's first argument is the key; FILE_LOAD_ERROR's is the File.
diff --git a/src/api/core.ts b/src/api/core.ts
index 330004c..c84ca55 100644
--- a/src/api/core.ts
+++ b/src/api/core.ts
@@ -8,7 +8,7 @@ import { _preloadProjectAssets, _setProjectAssets, _sharedAudioContext } from '@
 import { isVector2, Vector2, type Vector2Like } from '@api/Vector2'
 import { Mouse, unwrap } from '@api/types'
 import { atan2, cos, sin, tan, deg2rad, rad2deg, clamp, smoothStep } from '@api/utility'
-import { runEntryModule, locateError, resetLoopGuard } from '@api/moduleRunner'
+import { runEntryModule, locateError, resetLoopGuard, scriptsLoading } from '@api/moduleRunner'
 import { watch, unwatch, clearWatchCards } from '@/sandbox/watch'
 
 import Output from '@/sandbox/output'
@@ -171,6 +171,8 @@ const RETIRE_FADE = 0.015
  * DESTROY event.
  */
 function retireGame(old: Game) {
+	_freezeFrame(old)
+
 	const manager = old.sound as Phaser.Sound.WebAudioSoundManager
 	const context = manager.context
 	// No Web Audio, or no scene has run yet, so there's nothing to fade.
@@ -209,6 +211,59 @@ function retireGame(old: Game) {
 	}, RETIRE_FADE * 2000)
 }
 
+/**
+ * Internal. A still of the last game's final frame, up in its place while the
+ * next one loads. A new game's canvas boots hidden (see runUserCode) and stays
+ * that way while its assets load and its scripts set up, so a restart never
+ * flashes blank, or the game's top-level state before its loops have run.
+ *
+ * A copy on a 2D canvas, not the old WebGL canvas left in the page: a WebGL
+ * canvas only holds its last frame until something presents it again, and
+ * Phaser clears the drawing buffer after every present, so the GL calls in
+ * its own teardown put up a black canvas instead.
+ */
+let _frozenFrame: HTMLCanvasElement | undefined
+
+/**
+ * Internal. Replaces whatever's frozen with a still of `old`'s canvas, if
+ * that's what's on screen; one still hidden leaves the older still up. The
+ * old frame is rendered again first, since a WebGL canvas's drawing buffer is
+ * only readable in the task that drew it.
+ */
+function _freezeFrame(old: Game) {
+	const source = old.canvas
+	if (!old.isRunning || !source?.parentNode || source.style.visibility === 'hidden') return
+
+	const still = document.createElement('canvas')
+	still.width = source.width
+	still.height = source.height
+	still.style.width = `${source.clientWidth}px`
+	still.style.height = `${source.clientHeight}px`
+	try {
+		old.renderer.preRender()
+		old.scene.render(old.renderer)
+		old.renderer.postRender()
+		still.getContext('2d')?.drawImage(source, 0, 0)
+	} catch (e) {
+		// A blank still is no worse than no still
+		console.warn('Could not freeze the last frame:', e)
+	}
+
+	_frozenFrame?.remove()
+	_frozenFrame = still
+	source.before(still)
+}
+
+/**
+ * Internal. Shows a game's canvas in place of the frozen frame, once it has
+ * rendered a frame worth showing, so the two trade places between frames.
+ */
+function _showCanvas(canvas: HTMLCanvasElement) {
+	canvas.style.visibility = ''
+	_frozenFrame?.remove()
+	_frozenFrame = undefined
+}
+
 /** Pause engine processing. Must be manually un-paused using the UI button for now. */
 export function pause() {
 	clock.pause()
@@ -219,9 +274,29 @@ export function pause() {
 export function play() {
 	clock.play()
 	paused = false
+	_firstFramePending = false
 	resumeAudio()
 }
 
+/**
+ * Internal. Pauses a run that's just started, but lets it take its first
+ * frame first, so a project opened paused shows what the game looks like
+ * once its forever() loops and the like have had a go, not only what its
+ * top-level code set up. Silent all the same: the frame runs on a suspended
+ * context, so a sound it starts waits for Play, the same as one started just
+ * before a pause.
+ *
+ * The frame is taken once no script is still loading (see scriptsLoading),
+ * since imports are awaited and frames tick while they come in. Not once the
+ * entry script has finished: a top-level `await wait(1)` never would while
+ * paused, and in a game that's playing, that's the frame its loops would get
+ * first too.
+ */
+export function pauseAfterFirstFrame() {
+	pause()
+	_firstFramePending = true
+}
+
 /**
  * Internal. The host's own volume/mute control (the canvas toolbar's Volume
  * dropdown), applied to the client bus. Host-driven like pause()/play(), so
@@ -255,6 +330,8 @@ export let resizeReactors: { _onResize(): void }[] = []
 export let allTimers: Timer[] = []
 export let _engineLive: boolean = false
 let _crash: boolean = false
+/** Internal. Set by pauseAfterFirstFrame(), until the scene's update() has taken that frame. */
+let _firstFramePending: boolean = false
 let _nextObjectId: number = 0
 let _lastLeftClickTime: number = 0
 let _sessionCount: number = 0
@@ -867,6 +944,8 @@ class UserScene extends Scene {
 	JScode: string
 	/** Real name of the active script JScode came from, see runEntryModule. */
 	entryName: string
+	/** Whether this game's canvas has been shown, or will be once the current frame renders. See _showCanvas. */
+	shown: boolean = false
 
 	constructor(JScode: string, entryName: string) {
 		super('main')
@@ -898,7 +977,9 @@ class UserScene extends Scene {
 		// _lastPauseTime = 0
 
 		// Every image/sound in the project's file tree, under its own file name.
-		_preloadProjectAssets(this)
+		// A download slow enough to put up a progress bar shows it rather than
+		// leaving the last game's frame frozen the whole time.
+		_preloadProjectAssets(this, () => this.showAfterRender())
 
 		// this.load.image('guy', 'assets/guy.png')
 		// this.load.image('boot', 'assets/boot.png')
@@ -1120,11 +1201,12 @@ class UserScene extends Scene {
 		// }
 
 		if (!paused) {
-			_runOnKeyActions()
-			runControls()
-			_runSmooths(clock.deltaMs)
-			_runPropUpdaters()
-			if (background.image) background._update()
+			this.step()
+		} else if (_firstFramePending && !scriptsLoading()) {
+			_firstFramePending = false
+			// The clock only counts frames while it's running
+			clock.frame++
+			this.step()
 		}
 
 		// Runs after actions have had a chance to observe this tick's just-pressed/released
@@ -1133,6 +1215,28 @@ class UserScene extends Scene {
 		// them out one tick before anything ever reads them.
 		_clearKeysJustPressed(clock.frame)
 		_clearKeysJustReleased(clock.frame)
+
+		// Same test as pauseAfterFirstFrame's, after this frame's loops have run,
+		// so the render that follows is the game's first real frame: whether
+		// it's playing, taking that one paused frame, or paused some other way.
+		if (!scriptsLoading()) this.showAfterRender()
+	}
+
+	/** Shows this game's canvas once the frame in progress (or the next one) has rendered. See _showCanvas. */
+	showAfterRender() {
+		if (this.shown) return
+		this.shown = true
+		const canvas = this.game.canvas
+		this.game.events.once(Phaser.Core.Events.POST_RENDER, () => _showCanvas(canvas))
+	}
+
+	/** One frame of the game itself: everything update() holds back while paused. */
+	step() {
+		_runOnKeyActions()
+		runControls()
+		_runSmooths(clock.deltaMs)
+		_runPropUpdaters()
+		if (background.image) background._update()
 	}
 }
 
@@ -1146,6 +1250,7 @@ export async function runUserCode(code: string, entryName: string, theme?: Theme
 	console.group(`%cSunsprite v${VERSION} session ${++_sessionCount}`, `color: ${Colors.HotPink}; font-weight: bold;`)
 
 	_crash = false
+	_firstFramePending = false
 	clearControls()
 	resizeReactors = []
 	allTimers = []
@@ -1236,6 +1341,11 @@ export async function runUserCode(code: string, entryName: string, theme?: Theme
 		audio: {
 			context: _sharedAudioContext()
 		},
+		// Hidden from the moment it's in the page until _showCanvas swaps it in.
+		// Set as the canvas is created, not from postBoot, which only runs once
+		// Phaser's default textures have decoded: the canvas is in the page,
+		// blank and black, for some hundreds of ms before that.
+		canvasStyle: 'visibility: hidden',
 		scene
 	}
 
diff --git a/src/api/moduleRunner.ts b/src/api/moduleRunner.ts
index b67beb0..8c5d3a3 100644
--- a/src/api/moduleRunner.ts
+++ b/src/api/moduleRunner.ts
@@ -35,6 +35,7 @@ const API_GLOBAL = '__sunspriteApi'
 const IMPORT_HELPER = '__sunspriteImport'
 const BLOCK_HELPER = '__sunspriteBlocked'
 const LOOP_GUARD = '__sunspriteLoopGuard'
+const STARTED_HELPER = '__sunspriteStarted'
 
 // How long user code may loop without yielding before loopGuard stops it. Far
 // below the point where the browser offers to kill the page, and far above
@@ -245,6 +246,24 @@ export function resetLoopGuard(): void {
     sliceTripped = false
 }
 
+/**
+ * Ids of the scripts the current run has asked for whose bodies haven't
+ * started running yet: still being fetched from the host, or compiled and
+ * loading as a module. Replaced each run, not cleared, so a script still
+ * loading for the run before can't hold up this one; each run's closures and
+ * STARTED_HELPER only ever touch their own run's set.
+ */
+let pendingLoads = new Set<number>()
+
+/**
+ * Whether the running script is waiting on another script to load, as opposed
+ * to running, finished, or waiting on something of its own — a top-level
+ * `await wait(1)` and the like, which only game time can finish.
+ */
+export function scriptsLoading(): boolean {
+    return pendingLoads.size > 0
+}
+
 /**
  * Builds the per-run module every user script imports its API from.
  *
@@ -266,6 +285,7 @@ function buildApiModuleSource(apiKeys: string[]): string {
     lines.push(`export const ${IMPORT_HELPER} = globalThis.${IMPORT_HELPER};`)
     lines.push(`export const ${BLOCK_HELPER} = globalThis.${BLOCK_HELPER};`)
     lines.push(`export const ${LOOP_GUARD} = globalThis.${LOOP_GUARD};`)
+    lines.push(`export const ${STARTED_HELPER} = globalThis.${STARTED_HELPER};`)
 
     return lines.join('\n')
 }
@@ -281,8 +301,11 @@ function buildApiModuleSource(apiKeys: string[]): string {
  * The trailing `//# sourceURL=` comment gives the compiled Blob module the
  * script's own name in stack traces (`main.js:12:3`) instead of an opaque
  * `blob:...` URL — see locateError below, which depends on it.
+ *
+ * `loadId` is the script's entry in pendingLoads, which the prelude's last
+ * statement takes back out the moment the script's own code starts.
  */
-function compileScript(source: string, label: string, apiKeys: string[], apiUrl: string): string {
+function compileScript(source: string, label: string, apiKeys: string[], apiUrl: string, loadId: number): string {
     checkSyntax(source, label)
 
     // Guarded before transpiling, so it covers .js and .ts alike, and so a
@@ -298,7 +321,7 @@ function compileScript(source: string, label: string, apiKeys: string[], apiUrl:
     if (lineMap) lineMaps.set(label, lineMap)
     else lineMaps.delete(label)
 
-    const imported = [...apiKeys, IMPORT_HELPER, BLOCK_HELPER, LOOP_GUARD]
+    const imported = [...apiKeys, IMPORT_HELPER, BLOCK_HELPER, LOOP_GUARD, STARTED_HELPER]
     const parts = [`import { ${imported.join(', ')} } from ${JSON.stringify(apiUrl)};`]
 
     // An API name always wins over a blocked one: `print` is Sunsprite's, not
@@ -311,6 +334,8 @@ function compileScript(source: string, label: string, apiKeys: string[], apiUrl:
         parts.push(`const ${bindings};`)
     }
 
+    parts.push(`${STARTED_HELPER}(${loadId});`)
+
     return parts.join(' ') + '\n' + rewriteImports(code, label) + `\n//# sourceURL=${label}`
 }
 
@@ -547,6 +572,21 @@ export async function runEntryModule(entryCode: string, api: Record<string, unkn
     const cache = new Map<string, Promise<any>>()
     lineMaps.clear()
 
+    const loads = new Set<number>()
+    pendingLoads = loads
+    let nextLoadId = 0
+
+    /**
+     * Counts `load` as loading until the script it compiles starts running
+     * (STARTED_HELPER, from its prelude) or it fails before getting that far.
+     * Settling also clears it, which is a no-op for one that started.
+     */
+    function trackLoad(load: (loadId: number) => Promise<any>): Promise<any> {
+        const loadId = nextLoadId++
+        loads.add(loadId)
+        return load(loadId).finally(() => loads.delete(loadId))
+    }
+
     function importScript(specifier: string): Promise<any> {
         // An extensionless './helper' names one file per script extension, and
         // the one that actually exists wins — at most one can, since script
@@ -564,18 +604,18 @@ export async function runEntryModule(entryCode: string, api: Record<string, unkn
         // Which candidate actually existed, filled in below as soon as one does.
         let resolvedName: string | undefined
 
-        const loadFirstExisting = async (): Promise<any> => {
+        const loadFirstExisting = async (loadId: number): Promise<any> => {
             for (const name of candidates) {
                 const content = await resolveScriptContent(name)
                 if (content === undefined) continue
                 resolvedName = name
-                return runAsModule(compileScript(content, name, apiKeys, apiUrl))
+                return runAsModule(compileScript(content, name, apiKeys, apiUrl, loadId))
             }
             const names = candidates.map((name) => `"${name}"`).join(' or ')
             throw new Error(`Cannot resolve import "${specifier}": no script named ${names} in this project`)
         }
 
-        const promise = loadFirstExisting()
+        const promise = trackLoad(loadFirstExisting)
 
         // Registered synchronously, before anything awaits: a script imported
         // twice must not start two copies of itself in the gap.
@@ -598,10 +638,12 @@ export async function runEntryModule(entryCode: string, api: Record<string, unkn
     ;(globalThis as any)[IMPORT_HELPER] = importScript
     ;(globalThis as any)[BLOCK_HELPER] = blockedGlobal
     ;(globalThis as any)[LOOP_GUARD] = loopGuard
+    ;(globalThis as any)[STARTED_HELPER] = (loadId: number) => { loads.delete(loadId) }
     resetLoopGuard()
 
     try {
-        await runAsModule(compileScript(entryCode, entryName, apiKeys, apiUrl))
+        // async, so a syntax error thrown while compiling still clears the entry's load
+        await trackLoad(async (loadId) => runAsModule(compileScript(entryCode, entryName, apiKeys, apiUrl, loadId)))
     } finally {
         URL.revokeObjectURL(apiUrl)
     }
diff --git a/src/components/GameFrame.vue b/src/components/GameFrame.vue
index c171292..dca2992 100644
--- a/src/components/GameFrame.vue
+++ b/src/components/GameFrame.vue
@@ -69,6 +69,12 @@ onBeforeUnmount(() => {
   height: 100%;
   border: 0;
   background-color: #353b48;
+  /* Matches runner.html, which declares no scheme of its own. A dark theme
+     puts `color-scheme: dark` on the body, and a frame whose scheme differs
+     from its document's gets an opaque backdrop from the browser — white
+     here — over this background, wherever the game's canvas isn't covering
+     it (as while a new one loads; see core.ts's _showCanvas). */
+  color-scheme: normal;
   /* A drag-selection gesture on the host page can still highlight an iframe
      as a whole (a browser quirk with replaced elements), even though the
      sandboxed document inside it already blocks selection on its own
diff --git a/src/sandbox/main.ts b/src/sandbox/main.ts
index 9eda1b4..345abdd 100644
--- a/src/sandbox/main.ts
+++ b/src/sandbox/main.ts
@@ -90,6 +90,16 @@ function releaseHeld() {
     return released
 }
 
+/**
+ * Pauses a run that's just started, after the first frame its loops get (see
+ * core's pauseAfterFirstFrame), so the canvas shows the game as it'll look.
+ * A snapshot version that predates that pauses straight away instead.
+ */
+function pauseNewRun() {
+    if (core.pauseAfterFirstFrame) core.pauseAfterFirstFrame()
+    else core.pause()
+}
+
 function handleMessage(message: HostMessage) {
     switch (message.type) {
         case 'run': {
@@ -102,7 +112,7 @@ function handleMessage(message: HostMessage) {
                 // for; Play gets held instead, if it needs to be.
                 releaseHeld()
                 run()
-                core.pause()
+                pauseNewRun()
                 applyPauseSeq(message.pauseSeq)
             } else {
                 startWhenAudible(run, true)
@@ -123,8 +133,12 @@ function handleMessage(message: HostMessage) {
                 // Pausing needs no sound. A run still held starts now, paused
                 // on its first frame like any other paused run.
                 const released = releaseHeld()
-                if (released?.isRun) released.start()
-                core.pause()
+                if (released?.isRun) {
+                    released.start()
+                    pauseNewRun()
+                } else {
+                    core.pause()
+                }
                 applyPauseSeq(message.seq)
             } else if (!held) {
                 // seq applied once the hold settles; see `held` above
```

</details>
