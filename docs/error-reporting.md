# Verbose error reporting: file + line location

## What this is

When user code throws or fails to compile, the Output panel now shows the
message *and* an `at script:line` tag naming exactly where it happened.
Clicking that tag (or just having it happen while the file is already open)
highlights and scrolls to the line in the editor, and marks the file in
FileTree. Editing the offending line clears both highlights. This covers not
just the script's initial synchronous run, but errors from `forever()`,
`onKeyPress()`, mouse handlers, and other callbacks that fire later — and
syntax errors, which browsers normally report with no location at all.

None of this existed before — user code errors landed in Output as a bare
`err.toString()`, and most of the callback-driven error paths didn't reach
Output at all; they just died silently in the sandbox iframe's own (never
opened) devtools console.

## Why this was hard

Two platform limitations drove most of the design:

1. **A `SyntaxError` from a failed dynamic `import()` carries no line/column
   info.** Not "hard to get" — genuinely absent from the error object. The
   only way to get a location for a compile error is to catch it before the
   browser does, with our own parser.
2. **A runtime error's stack trace names whatever URL the script loaded
   from** — for these compiled-to-Blob-URL scripts, that's an opaque
   `blob:http://localhost/...` unless the script itself tells the engine
   what to call it (`//# sourceURL=`).

## Architecture / data flow

```
user code throws
  → core.ts (sandbox) catches it, calls locateError() (moduleRunner.ts)
  → Output.runtimeError(message, location)      [src/sandbox/output.ts]
  → postMessage({ type: 'output', kind: 'error', text, location })
  → hostBridge.ts receives it, calls Output.render(...)
  → src/assets/api/output.ts renders the message + clickable location tag
  → src/views/EditorView.vue's onErrorLocation/onJumpToError handlers
      → CodeEditor.vue: highlight + scroll to the line
      → fileStore.erroredScriptName: highlight the file in FileTree
```

Everything to the left of `postMessage` runs inside the sandboxed iframe
(`src/sandbox/`, `src/assets/api/core.ts`, `src/assets/api/moduleRunner.ts`);
everything to the right runs in the host app. The two sides share no memory —
see the comment block at the top of `src/sandbox/protocol.ts`.

## Key mechanisms, file by file

### `src/assets/api/moduleRunner.ts` — where a location comes from

- **`compileScript()`** appends `//# sourceURL=<name>` to every compiled
  script. This is what makes a thrown error's stack trace say `main.js:12`
  instead of `blob:http://localhost:5173/3f8a...`. It also prepends exactly
  one prelude line (API import + blocked-globals shim), so line numbers in
  the compiled module are always the user's own line + 1.
- **`locateError(error)`** recovers `{ script, line }` from a thrown error.
  Checks a `__sunspriteLocation` property first (see `withLocation()`, used
  by the two checks below for errors *we* synthesized), then falls back to
  regex-parsing `error.stack` for the first frame that looks like a bare
  filename (no `://`, not `blob:` — i.e. one of our own compiled scripts,
  not V8 internals or a Phaser frame) and undoes the prelude-line offset.
- **`checkSyntax()`** runs `ts.transpileModule()` against the user's
  *original* source (before any rewriting) before every compile, so a real
  syntax error gets a location from TypeScript's own parser instead of
  reaching the browser's location-less one. Runs on every script, every run
  — cheap, since it's a single-file syntactic pass.
- **`checkGrammarRestrictions()`** — TypeScript's parser is more permissive
  than the actual JS grammar for a handful of constructs (a stray
  `#privateField` outside a class, `continue`/`break` outside a loop, `with`,
  duplicate function params, `delete` of a bare identifier, `const` with no
  initializer, redeclaring `let`, `yield` outside a generator, top-level
  `return`, `new.target` outside a function) — TS accepts them syntactically
  and only flags them from a full *semantic* pass (the binder). This runs a
  full `ts.Program` with `checkJs: true`, but filters its diagnostics down to
  `GRAMMAR_RESTRICTION_CODES`, a hand-verified allowlist. This is the
  dangerous part to touch — see "Extending the grammar-restriction list"
  below before adding to it.
- **`runEntryModule(entryCode, api, entryName)`** — `entryName` is the real
  name of whichever script is being run as the entry point. This used to be
  hardcoded to `'main.js'`, which was wrong whenever a script other than
  literally `main.js` was the active file being run directly (e.g. opening
  an imported helper script and clicking Restart) — the error would report
  the wrong file, with a correct line number, since the offset math didn't
  care about the label. `entryName` is `fileStore.activeFileName`, threaded
  all the way from `CodeEditor.vue` through the postMessage protocol.

### `src/assets/api/core.ts` — catching errors that happen later

The only error handling that existed before was one `try`/`catch` around the
script's initial synchronous execution in `UserScene.create()`. Everything
that fires later from Phaser's own update loop or event emitter —
`forever()`, `repeat()`, `repeatUntil()`/`repeatWhile()`, `after()`,
`every()`, `when()`, `onKeyPress/Hold/Release`, mouse input — had nothing
wrapping it at all.

- **`runUserCallback(fn, fallback)`** — try/catch wrapper for a callback we
  invoke ourselves (the `_run*` functions). Reports via `reportUserError()`
  and returns `fallback` on error, so a broken predicate (`repeatUntil`'s
  `condition()`, etc.) degrades toward whatever's safest for its caller
  rather than crash-looping every frame forever. See the fallback-choice
  comments at each `_run*` call site — e.g. `repeatUntil`'s condition
  defaults to `true` (self-heals to "done, clean me up") on error;
  `repeatWhile`'s and `when()`'s default to `false` ("stop").
- **`wrapUserCallback(fn)`** — same idea, but for a callback handed directly
  to Phaser's own event emitter (mouse input via `scene.input.on(...)`)
  instead of one we call ourselves. The *wrapped* function must be what gets
  stored for `.off()` later, since Phaser removes listeners by reference.
- **`toDisplayError(e)`** — normalizes a non-`Error` throw (`throw "oops"`,
  `throw {code: 1}`) into a real `Error` with a readable message
  (`JSON.stringify` for objects) instead of the default `[object Object]`.
  There's still no location for these — genuinely nothing to recover one
  from — this only fixes the message.
- **`reportUserError(e)`** — the single funnel every error path above goes
  through: normalize, `Output.runtimeError(message, locateError(err))`,
  `console.error`.
- **`window.addEventListener('error' | 'unhandledrejection', ...)`** in
  `setup()` — last line of defense for anything that still escapes all of
  the above (a promise the user's own code never awaited or caught). This
  was a dead, commented-out sketch before; it's real now.

### `src/sandbox/protocol.ts`, `src/sandbox/output.ts`, `src/sandbox/hostBridge.ts`

- `OutputLocation { script: string, line: number }` — the wire type, added
  to the sandbox→host `'output'` message.
- `'run'` (host→sandbox) now carries `entryName` alongside `code`.
- Sandbox-side `output.ts` adds `runtimeError(message, location?)`,
  deliberately **separate** from the existing `error(...args: Printable[])`
  — that one is the public `Output.error()` API user scripts call directly
  (varargs, no location), and is aliased 1:1 to it in `core.ts`
  (`UserOutput.error: Output.error`). Do not merge these; a location
  parameter on the public varargs function would silently break any user
  script passing a second string argument.

### `src/assets/api/output.ts` (host) — rendering

- `errorMsg()` renders the message as `el.textContent`, then (if a location
  came through) appends a separate `<span class="output-error-location">`
  inline on the **same line** (a text node, not `<br>`), containing
  `at script:line` with `data-jump-script`/`data-jump-line` attributes.
- `.output-msg` needs both `white-space: pre-wrap` *and* `min-width: 0` to
  actually wrap long messages ([OutputPane.vue](../src/components/OutputPane.vue)) — it's a `<pre>` inside a flex row, and a flex
  item's default `min-width: auto` ignores wrap opportunities for `pre`
  content, so without the `min-width: 0` override it silently overflows into
  a horizontal scrollbar instead of wrapping, no matter what `white-space`
  is set to.
- Two callback registrations, both fed by `errorMsg()`:
  - `onJumpToError(handler)` — fired only when the user clicks the location
    span (delegated click listener registered once per output item in
    `init()`).
  - `onErrorLocation(handler)` — fired for **every** located error
    automatically, not just clicked ones. This is what makes the editor
    highlight appear immediately without requiring a click, as long as the
    errored script happens to already be the active one.

### `src/components/CodeEditor.vue` — editor highlight

- `revealErrorLine(script, line)` ensures the target script's Monaco model
  exists, applies a decoration, and reveals/centers it *if* that script is
  already attached to the live editor. If it's a different file, the reveal
  is deferred (`pendingReveal`) until `handleMount` next attaches that
  model — which happens because `EditorView.vue`'s click handler also
  switches the active file first.
- **Two real bugs were found and fixed while building this, both worth
  knowing about if editor state ever misbehaves again:**
  - `editorInstance` was a plain `ref()`. Vue wraps any object assigned to a
    plain `ref` in a deep reactive Proxy, and Monaco's internals are heavily
    identity-sensitive (private/WeakMap-keyed state) — calling a method
    *through* that proxy runs it with `this` bound to the proxy, not the
    real editor, which silently broke `revealLineInCenter()` (a no-op) and
    `getModel()` (stopped being `===` to the model actually attached via
    `setModel()`). Fixed by using `shallowRef` instead — never store a
    Monaco/CodeMirror/etc. editor instance in a plain `ref`.
  - `refreshDiagnostics()`'s `model.setValue(model.getValue())` (forces a
    fresh TS-worker diagnostics pass) is a full content replace that
    silently drops any decorations on the model, including the error
    highlight. Fixed by re-applying the decoration right after that call
    (`reapplyErrorDecoration()`).
- **Edit clears the highlight**: `applyErrorDecoration()` attaches a
  `model.onDidChangeContent` listener. It reads the decoration's own *live*
  range via `model.getDecorationRange(id)` (not the line number it was
  created at — that shifts as earlier lines are edited) and calls
  `clearErrorDecoration()` if any change's range overlaps it. It skips
  `event.isFlush` (Monaco's flag for a `setValue()`-driven reset) so
  `refreshDiagnostics`'s internal refresh doesn't falsely count as "the user
  edited this line."
- `clearErrorDecoration()` is the single full reset: Monaco decoration, the
  edit-watcher, `pendingReveal`, and `fileStore.clearErroredScript()` (so the
  editor and FileTree highlights always clear together). Called at the start
  of every run and whenever the offending line is edited.

### `src/stores/fileStore.ts` + `src/components/FileTree.vue` — FileTree highlight

- `fileStore.erroredScriptName` — name of the script whose error is
  currently shown, if any. Set from `EditorView.vue`'s `onErrorLocation`
  handler, cleared by `CodeEditor.vue`'s `clearErrorDecoration()`.
- `FileTree.vue`'s `itemStateClass(item)` returns `'item-state-error'`
  (highest priority) or `'item-state-dirty'`, applied to both the label
  `<span>` and the leading `<UIcon>` — so an errored or unsaved file's name
  *and* icon change color, not just the dirty asterisk. The asterisk itself
  now inherits `color` from that wrapping span instead of hardcoding
  warning, so it follows whichever state wins if a file is both dirty and
  the one that just errored.

### `src/views/EditorView.vue` — wiring it together

- `Output.onJumpToError((script, line) => { loadScript(script);
  editor.value.revealErrorLine(script, line) })` — the click handler.
- `Output.onErrorLocation((script, line) => { editor.value?.revealErrorLine(script, line); fileStore.setErroredScript(script) })`
  — the automatic (no click needed) path.
- `loadScript()` (used by both the click handler and FileTree's own
  `@select-script`) also syncs `treeSelectionStore.current`, so FileTree's
  selected row follows the active file even when the switch was triggered
  by something other than clicking the tree itself. Keyed by `{ id, label }`
  when a real script record exists — FileTree's `:get-key="item.id ??
  item.label"` means a plain `{ label }` object won't select a real project
  script row that has a real `id`.

## Files touched

| File | What changed |
|---|---|
| `src/assets/api/moduleRunner.ts` | `//# sourceURL=`, `locateError`, `checkSyntax`, `checkGrammarRestrictions`, `entryName` param |
| `src/assets/api/core.ts` | `runUserCallback`/`wrapUserCallback`/`toDisplayError`/`reportUserError`, wrapped every `_run*` callback site + mouse registration, global `error`/`unhandledrejection` listeners, `entryName` threaded into `UserScene`/`runUserCode` |
| `src/assets/api/output.ts` (host) | `errorMsg`/`render` take a location, clickable inline tag, `onJumpToError`/`onErrorLocation` |
| `src/sandbox/protocol.ts` | `OutputLocation` type, `location` on `'output'`, `entryName` on `'run'` |
| `src/sandbox/output.ts` (sandbox) | `runtimeError()`, `send()` takes a location |
| `src/sandbox/hostBridge.ts` | threads `location`/`entryName` through `runUserCode()`/`queuedRun` |
| `src/sandbox/main.ts` | passes `entryName` through to `runUserCode()` |
| `src/components/CodeEditor.vue` | `revealErrorLine`, decoration + edit-watcher, `shallowRef` fix, `reapplyErrorDecoration` fix, `entryName` in `runActiveUserCode` |
| `src/components/OutputPane.vue` | `.output-error-location` styling, `.output-msg` wrap fix |
| `src/components/FileTree.vue` | `itemStateClass`, error/dirty coloring on name + icon |
| `src/stores/fileStore.ts` | `erroredScriptName` + `setErroredScript`/`clearErroredScript` |
| `src/views/EditorView.vue` | `onJumpToError`/`onErrorLocation` wiring, tree-selection sync in `loadScript` |

*(A Ctrl+S save shortcut was added to `CodeEditor.vue` in the same session but is unrelated to error reporting — not covered here.)*

## Extending this later

**Adding a grammar-restriction code to `checkGrammarRestrictions`**: don't
just add a code because TS reports it. Verify, for the exact construct:
1. It's a genuine compile-time `SyntaxError` in real V8 (test in Node with a
   `.mjs` file, or a browser).
2. It **cannot** also be reached via a "cannot find name"-style diagnostic
   (2304, 2584, 2792, ...) — those are the ones every ordinary Sunsprite
   script trips on for `Sprite`/`forever`/`print`/etc., since this isolated
   single-file check has no ambient types. This is why `arguments`/`eval`
   reassignment restrictions were deliberately **not** added — TS only
   flags them via "cannot find name," indistinguishable from a normal
   script using the real API.

   Verification method used during development: run
   `program.getSemanticDiagnostics()` against both the suspect construct
   *and* a realistic multi-feature script using real API globals
   (`Sprite`, `forever`, `print`, imports, a real class with a real private
   field), confirm the new code fires only for the former.

**Wiring a new per-frame/deferred callback registry** in `core.ts`: route
its invocation through `runUserCallback()` (or `wrapUserCallback()` if it's
handed to Phaser's own event system rather than called from our own loop).
Pick a `fallback` for anything whose return value affects control flow —
default toward whatever de-escalates rather than repeats (e.g. "stop"/"done"
rather than "keep going").

## Known gaps (not bugs — accepted tradeoffs)

- **Non-`Error` throws never get a location.** `throw "x"` has no stack to
  recover a location from. This is a platform limitation, not something to
  "fix" — the message is at least readable now (see `toDisplayError`).
- **The remaining long tail of TS-permissive/V8-strict grammar constructs**
  not yet in `GRAMMAR_RESTRICTION_CODES` still surface as a location-less
  `SyntaxError`. A more general fix was considered — load the entry script
  via an injected `<script type="module">` element and listen for
  `window.onerror`, since a *classic* module script's parse failure does
  fire with real `lineno`/`colno`, unlike a rejected `import()` promise —
  but this needs real validation (does it actually fire reliably for a
  module script specifically, across browsers?) and is a bigger
  architectural change than the current per-diagnostic-code allowlist. Not
  implemented; flagged here for whoever picks it up next.
- **FileTree-specific changes** (tree-selection sync, error/dirty coloring)
  were code-reviewed and type-checked, but not verified in a live signed-in
  project — `FileTree.vue` only renders in project mode, which needs real
  Supabase auth. Only guest mode was exercised end-to-end.

## Testing notes

Verified throughout via Playwright driven against the Vite dev server in
guest mode — no dedicated test suite exists for this yet. One recurring
gotcha worth recording: **use clipboard paste (`Control+V` after
`navigator.clipboard.writeText(...)`), not `page.keyboard.type()`**, to get
code into Monaco. Typing key-by-key (and even `page.keyboard.insertText()`
in some cases) triggers Monaco's bracket auto-closing, which silently
duplicates closing braces in nested code (e.g. a class with a method) and
produces a corrupted script that doesn't match what you asked to type. A
real paste is inserted verbatim.
