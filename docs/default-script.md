# Canonical default script: `main.js` + per-script Run

## What this is

`main.js` is now enforced as each project's canonical entry point:

- The game header's **Restart** button (and the initial auto-run when the
  editor loads) always runs `main.js` — previously it ran whichever script
  happened to be the active/open tab, which meant switching to a different
  script and hitting Restart would run *that* script instead, silently.
- `main.js` **can't be deleted** — its "Delete" menu entry is gone from
  FileTree; renaming is still allowed.
- Every script gets its **own "Run this script" button**, next to its name
  in the editor bar, for running just that one script as the entry point
  without disturbing what Restart does.
- The same **"Run"** action is available from FileTree's per-script context
  dropdown, for running a script that isn't even open.
- The Output panel's startup line now names the script: `Running main.js @
  12:07:44.409` instead of the old bare `Running @ 12:07:44.409`.

## The core mechanism

Everything routes through one new function in `CodeEditor.vue`:

```ts
function runNamedScript(name: string) {
	clearErrorDecoration()
	const code = ensureModel(name)?.getValue() ?? ''
	runUserCode(code, name, themeStore.current)
}
```

`ensureModel(name)` loads a script's last-*saved* content if it's never been
opened, or returns its existing (possibly live-edited, unsaved) model if it
has — same rule "running the active file" already followed, just
generalized to an arbitrary name. Critically, this **never touches
`fileStore.activeFileName`** — running a script this way doesn't switch the
editor to it.

Two callers build on top of it:

```ts
function runActiveUserCode() {
	runNamedScript(fileStore.activeFileName)   // the per-script editor-bar button
}
function runMainScript() {
	runNamedScript('main.js')                  // Restart + initial auto-run
}
```

Both are exposed via `defineExpose`, alongside the already-existing
`runNamedScript` itself (used directly by FileTree's context-menu action,
which targets an arbitrary script that may not be active).

### Why this works: `entryName`

This whole feature rides on `entryName`, a parameter threaded through the
run pipeline in an earlier pass (originally to fix error locations
misattributing to the wrong script — see `docs/error-reporting.md`):

```
CodeEditor.vue: runNamedScript(name)
  → runUserCode(code, name, theme)                    [hostBridge.ts]
  → post({ type: 'run', code, entryName: name, theme })
  → sandbox/main.ts: runUserCode(code, entryName, theme)
  → core.ts: runUserCode(code, entryName, theme)
      → Output.printStartMsg(entryName)                ← "Running main.js @ ..."
      → new UserScene(code, entryName)
      → runEntryModule(code, api, entryName)            [moduleRunner.ts]
          → compileScript(code, entryName, ...)          // labels the compiled
                                                           // module with its real name
```

Without `entryName` already threaded all the way through, none of this
would have anywhere to plug in — `runNamedScript` and the startup-message
change are both just *new consumers* of a name that was already flowing
end-to-end.

## Files touched

| File | What changed |
|---|---|
| `src/components/CodeEditor.vue` | `runNamedScript`/`runActiveUserCode`/`runMainScript`, Run button moved into `#file-name` (right of the script name), `defineExpose` |
| `src/components/FileTree.vue` | `MAIN_SCRIPT_NAME` constant, "Run script" added to `itemMenuItems`, "Delete" omitted for `main.js`, `runScript` emit, defensive guard in `deleteScript` |
| `src/views/EditorView.vue` | `runActiveUserCode` → `runMainScript` (bound to Restart + initial run), new `runNamedScript` handler wired to FileTree's `@run-script` |
| `src/sandbox/output.ts` | `printStartMsg(scriptName)` — builds `Running ${scriptName} @ ...` |
| `src/assets/api/core.ts` | `Output.printStartMsg(entryName)` call site |

**Not touched, already correct**: `fileStore.ts`'s `loadProject()` already
auto-creates a `scripts/main.js` for any brand-new (empty) project — the
"every project has a main.js" half of the invariant was already true before
this feature; this work only added the enforcement (can't delete) and the
run-targeting behavior.

## How the pieces fit together

**FileTree's "Run script"**: `itemMenuItems()` pushes a menu entry for
script-kind items that emits `runScript` with the script's name — plain
data, no DOM/component reference — up through `FileTree.vue`'s `defineEmits`
to `EditorView.vue`, which calls `editor.value.runNamedScript(fileName)`.
Same shape as the pre-existing `selectScript` emit `loadScript()` already
handles, just a different verb.

**Blocking delete for `main.js`**: `itemMenuItems()` conditionally omits the
whole `Delete` group (not just disables it) when the item is a script named
`main.js`:

```ts
const groups = [primary]
if (!(item.kind === 'script' && scriptName(item) === MAIN_SCRIPT_NAME)) {
	groups.push([{ label: `Delete ${kindLabel(item)}`, ... }])
}
return groups
```

Omitting the group (rather than pushing an empty array) avoids a dangling
divider with nothing under it. `deleteScript()` also has a defensive
same-name check that shows an alert and bails — belt-and-braces in case
something else ever calls it directly; there's currently only the one path
in (the menu item itself).

**The editor-bar Run button**: lives inside `#file-name` now, immediately
after the script name text, rather than in `.save-group` next to Save.
`#file-name` changed from plain centered text to an `inline-flex` row so
the name and button sit together as one centered unit. Hidden for text
files via `v-if="!fileStore.isTextFile(...)"` — they aren't runnable.

## Known gaps

- **Renaming `main.js` away is still allowed** — only deletion is blocked,
  per what was actually asked. If a project's `main.js` gets renamed,
  Restart/the initial auto-run will silently run an empty script (`ensureModel`
  returns `undefined` for a name with no matching script, and `?? ''` turns
  that into an empty entry point) rather than showing an error. Flagged, not
  fixed — closing this would mean also blocking rename for this one file,
  which wasn't part of the request.
- **Pre-existing projects** that already deleted or renamed away their
  `main.js` before this feature existed aren't retroactively repaired —
  nothing here back-fills missing data.
- **FileTree-specific pieces weren't verified live** — "Run script" in the
  dropdown and the missing "Delete" entry both need signed-in project mode
  (`FileTree.vue` doesn't render in guest mode at all), which wasn't set up
  for the same reason noted in `docs/error-reporting.md`: no real
  credentials, and seeding data into the actual Supabase project felt like
  the wrong call to make unprompted. These are code-reviewed and
  type-checked but not click-tested.

## Testing notes

Verified live in guest mode via Playwright (guest mode has no FileTree, but
exercises the same `CodeEditor.vue` functions FileTree's actions call into):
with a second script imported by `main.js` set as the *active* tab,

- the per-script Run button produced output from only that script, and
- Restart still produced output from `main.js` (which in turn imported and
  ran the other script) —

confirming the two are now genuinely independent of which tab is open. The
startup message was confirmed to read `Running main.js @ <time>`.
