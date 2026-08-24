# Guest sandbox: editable file tree at `/sandbox`

## What this is

A new route, `/sandbox`, reachable without signing in and linked from the
navbar (a dedicated "Sandbox" button) and the new landing page's hero. It
renders the exact same `EditorView.vue` a real project uses — full file tree,
multiple scripts, folders, text files, drag-and-drop reordering, rename,
delete — but as a **faux-project that persists to `localStorage` instead of
Supabase**, and with **no image uploads** (there's no object storage to put
them in).

Before this, "guest mode" was a single hardcoded `main.js`, edited in place,
saved to one flat `localStorage` key. There was no tree UI for it at all —
`FileTree.vue` only ever rendered when a real project was loaded.

Landing page (`/`) and general navbar changes (a per-page center title, the
Docs button's dual toggle-panel/navigate-to-`/docs` behavior) shipped
alongside this in the same pass but aren't the subject of this doc — this one
is about the sandbox page itself and what it took to get it working.

## Why this was hard

Two unrelated problems, one architectural and one infrastructural:

1. **Guest mode had no real file data to build a tree from.** `fileStore.ts`
   only ever populated `scripts`/`folders`/`textFiles` for a loaded cloud
   project (`projectId` set); guest mode read/wrote one raw `localStorage`
   entry per filename with no folders, no IDs, no multi-file support, and
   `FileTree.vue` never rendered outside project mode at all — it had a
   vestigial, mostly-commented-out static `guestItems` array that was never
   actually reachable in the mounted app. Building this properly meant
   retrofitting a second, localStorage-backed persistence path onto every
   folder/script/text-file CRUD function, without duplicating the tree UI or
   its interaction logic (drag-and-drop, rename-in-place, context menus).
2. **A routing collision that only running the app revealed.** The route
   `/sandbox` and the pre-existing static file `sandbox.html` (the opaque-
   origin iframe document that actually *runs* user code — see
   `src/sandbox/`) share a name. See its own section below — this is the
   part most worth understanding before touching either the router or
   `src/sandbox/` again.

## Architecture: how a guest edit reaches `localStorage`

```
FileTree.vue action (create/rename/delete/move a folder, script, or text file)
  → fileStore.ts's CRUD function (createScript, renameFolder, deleteTextFile, moveScript, ...)
      fileStore.projectId set?
        → write through to Supabase, then update the reactive scripts/folders/textFiles array
      fileStore.projectId null (guest sandbox)?
        → update the reactive array directly, then persistGuestProject()
            → localStorage.setItem('sunsprite-sandbox-project', JSON.stringify({ folders, scripts, textFiles }))
  → childNodes()/nextPosition()/scriptsUnderFolder() etc. read those same
    reactive arrays regardless of mode — no branching needed there
  → FileTree.vue's `items` computed (fileStore.childNodes(null) → buildNode)
    re-renders from whichever arrays are currently populated
```

Every CRUD function in `fileStore.ts` now has this exact shape: mutate the
in-memory array unconditionally, then branch only on *where the write is
persisted*. `childNodes`, `nextPosition`, `folderAndDescendantIds`,
`scriptsUnderFolder`, `textFilesUnderFolder` were already mode-agnostic
before this change — they just read the arrays — so once guest mode started
populating real records into them, the entire tree-building/ordering/
descendant-walking logic worked for free.

**Images stay Supabase-only.** `uploadImage()` still throws `'No active
project'` when `projectId` is null — that single guard is the real
enforcement point. `FileTree.vue`'s `folderMenuItems()` only pushes an
"Upload file" entry when `fileStore.projectId` is set, so the guest UI never
even offers the action, but the store-level guard is what actually matters if
any other call site is ever added.

## Key mechanisms, file by file

### `src/stores/fileStore.ts`

- **`GUEST_PROJECT_STORAGE_KEY = 'sunsprite-sandbox-project'`** — one JSON
  blob (`{ folders, scripts, textFiles }`, no `images`) instead of the old
  one-key-per-filename scheme.
- **`generateId()`** — `crypto.randomUUID()`. Guest records need stable,
  unique IDs too (`FileTree.vue` keys everything by `.id`), and there's no
  database to generate one.
- **`persistGuestProject()`** — serializes the three live arrays back to
  `localStorage`. Called at the end of every guest-mode mutation.
- **`loadGuestProject()`** — the guest equivalent of `loadProject(id)`.
  Reads the stored blob if present; if not (or it fails to parse), seeds a
  fresh project the *same way `loadProject` seeds a brand-new cloud one* — one
  `main.js` in a `scripts` folder. Before reseeding from scratch, it checks
  for a pre-existing `localStorage['main.js']` in the **old** flat format
  (`{ fileName, content, saveTime }`) and, if found, carries that content into
  the new `main.js` record and deletes the old key — a returning guest's
  in-progress work isn't silently discarded by this upgrade.
- Every other CRUD function (`createFolder`, `renameFolder`, `deleteFolder`,
  `moveFolder`, `moveScript`, `createScript`, `renameScript`, `deleteScript`,
  `createTextFile`, `renameTextFile`, `deleteTextFile`, `moveTextFile`) picked
  up the `if (projectId.value) { …supabase… } else { …persistGuestProject… }`
  branch described above. `getLocalCode`/`getTimeSaved`/`saveCode` were
  simplified to just read/write `scripts`/`textFiles` unconditionally — no
  more separate guest-only `getSaveData` path except inside
  `loadGuestProject`'s one-time legacy read.

### `src/components/FileTree.vue`

- The static `guestItems` array (and the `imageLeaf` helper and
  `gameAssets` imports it alone used) is gone. `items` is now always
  `fileStore.childNodes(null).map(buildNode)`.
- Every `v-if="fileStore.projectId"` / `:disabled="!fileStore.projectId"`
  gate that used to hide editing entirely in guest mode is gone (the add
  button, both context menus, the per-row actions column) **except**
  `folderMenuItems()`, which still conditionally omits "Upload file". The
  folder-expand state (`expandedFolderIds`) was also switched from
  conditionally-controlled (project mode only, guest mode left uncontrolled)
  to always-controlled, now that guest mode has real dynamic folders of its
  own to track.
- Drag-and-drop reordering was **not** specifically built for the sandbox —
  it just started working there once rows carried a real `.kind`/`.id` again
  (the old static `guestItems` rows never set `.kind`, which is what had
  `isDraggable()` silently opting them out before). Worth knowing if the
  sandbox's drag-and-drop ever needs debugging — it's the same code path as
  project mode, not a separate implementation.

### `src/views/EditorView.vue`

- `if (!props.projectId) fileStore.loadGuestProject()` runs **synchronously
  in `<script setup>`**, not inside `onMounted`. This matters: Vue mounts
  children before a parent's own `onMounted` fires, and `CodeEditor.vue` (a
  child) calls `ensureModel('main.js')` from its own `onMounted` — which
  needs `fileStore.scripts` to already contain a `main.js` record, or it
  falls back to nothing and a returning guest's real saved work never shows
  up. Project mode doesn't need the same treatment because
  `ProjectEditorView.vue` already `await`s `fileStore.loadProject(id)` before
  `EditorView` is mounted at all, so its data is populated strictly earlier
  in the sequence, not by lucky timing.
- The file-tree pane's `v-if="projectId"` is gone — it renders in both
  modes now.
- The "correct `activeFileName` if it doesn't match a real script anymore"
  logic in `onMounted` (previously project-only, for a renamed `main.js`) now
  runs for guest mode too, since guest scripts are real, renameable records.

### `src/components/CodeEditor.vue` and `src/sandbox/hostBridge.ts`

Both had their own copy of "if this name doesn't resolve to a real file and
we're in guest mode, fall back to placeholder example content instead of
failing" — a crutch from when guest mode had no real files to resolve names
against. Both were simplified to just call `fileStore.getLocalCode(name)`
directly; an unresolvable name is now a genuine error in both modes, exactly
like project mode already behaved.

**This split in two places is the trap to remember.** `CodeEditor.vue`'s
`ensureModel()` resolves content for the *editor* (Monaco models,
diagnostics). `hostBridge.ts`'s `resolveScript()` resolves content for the
*actual running game* — it answers `'script-request'` messages posted from
inside the sandboxed iframe (`src/sandbox/moduleRunner.ts`'s
`resolveScriptContent`) over `postMessage`, since only the host has the file
store. Fixing the fallback in only one of these would have made the editor
and the actually-executing game silently disagree about what an unresolved
import means — caught here by deliberately re-checking both, not by any
automated tooling. Any future change to how script content resolves needs
the same double-check.

## The `sandbox.html` naming collision

This was found by actually running the app, not by review or type-checking —
worth internalizing as a category of bug static analysis can't catch here.

**Symptom**: clicking the "Sandbox" nav button from elsewhere in the app
worked fine. A **direct** load of `/sandbox` — typing the URL, refreshing the
page while already on it, or following a shared link — rendered a
completely blank page.

**Root cause**: `sandbox.html` already existed as a literal file at the
project root — a second Vite build entry point (see `vite.config.ts`), the
document that actually boots inside the `<iframe sandbox="allow-scripts">`
where user code runs (`src/sandbox/main.ts`). A bare path with no extension
(`/sandbox`) is standard-resolved by a static file server to a same-named
`.html` file if one exists — confirmed directly on Vite's dev server, and
inferred (with high confidence, from `public/404.html`'s own comment
explaining *why* it exists) to also be true on GitHub Pages in production:
that file's SPA-redirect trick only ever triggers on a genuine 404, and a
request that resolves straight to a real file never reaches it.

```
Client-side nav (router.push('/sandbox') from inside the already-loaded SPA)
  → no new HTTP request for '/sandbox' at all — vue-router just swaps
    components in memory → works

Direct load (typed URL / refresh / shared link)
  → real HTTP GET /sandbox
  → static file resolution finds sandbox.html on disk, serves it as-is (200)
  → index.html / vue-router never load at all
  → blank page: sandbox.html is the *iframe* document — it expects a host
    to talk to it over postMessage and has nothing to render on its own
```

**Fix chosen**: renamed the file, not the route — `sandbox.html` →
`runner.html` (`git mv`, so it reads as a rename in history), which keeps the
user-facing page at exactly `/sandbox` as intended. Updated:

- `vite.config.ts` — the `build.rollupOptions.input` entry (and its key,
  `sandbox` → `runner`, for consistency)
- `src/sandbox/hostBridge.ts`'s `sandboxUrl()` — the one place that actually
  builds the iframe's `src` URL
- Five comments elsewhere that named the file by its old filename
  (`hostBridge.ts`, `protocol.ts`, `channel.ts`, `main.ts`, and the "not to be
  confused with…" comment on the NavBar's Sandbox button)

Nothing about the actual isolation — the `allow-scripts` sandbox attribute,
the opaque-origin/postMessage protocol in `src/sandbox/protocol.ts`, origin
checks in `channel.ts` — changed at all. This was purely a filename/URL
string, not a security boundary.

## Considerations for working with this later

- **Don't reintroduce this collision.** Never name a Vue Router path after a
  file that exists (or plausibly could exist) at the project root. If a
  future route wants a name that collides with a real static asset, rename
  the asset — that direction was chosen deliberately here to keep the
  user-facing URL stable, and there's no reason to expect that trade-off to
  flip for a different collision later.
- **Any new fileStore CRUD function needs the same dual-mode branch.** The
  pattern is consistent throughout: mutate the reactive array unconditionally,
  branch only on `projectId` for *where* it's persisted
  (Supabase vs. `persistGuestProject()`). Forgetting the guest branch means
  the action silently no-ops for `localStorage` (nothing throws — the
  in-memory array still updates, so it *looks* like it worked until the next
  reload).
- **The `localStorage` schema has no version tag.** `loadGuestProject`
  handles exactly one migration — the old pre-file-tree flat format for
  `main.js` — via a try/catch around `JSON.parse` that reseeds from scratch
  on any failure. A future schema change (e.g. adding a field to
  `ScriptRecord`) has no migration path of its own; old guest data would just
  be missing that field (`undefined`) rather than erroring, since nothing
  here validates shape beyond "does it parse."
- **No `localStorage` quota handling.** `persistGuestProject()`'s
  `localStorage.setItem` isn't wrapped in a try/catch — matches this
  codebase's existing risk tolerance for the same call elsewhere, not a new
  gap introduced here. Script/text-file content would need to be enormous
  before this realistically matters.
- **The Supabase-backed (real project) side of every dual-mode function was
  code-reviewed and type-checked, but not exercised live this session** — no
  credentials were set up, and only guest mode is reachable without signing
  in. Same caveat as `docs/error-reporting.md` and `docs/default-script.md`
  before it.

## Files touched

| File | What changed |
|---|---|
| `src/views/LandingView.vue` (new) | Hero with title/tagline + links to Sandbox/Docs/Projects-or-Sign-In |
| `src/router/index.ts` | `/` → `LandingView`; added `/sandbox` (lazy-loaded `EditorView`, no `projectId`) |
| `src/components/NavBar.vue` | Sandbox nav button (hidden while already on `/sandbox`), per-page center title, Docs button's toggle-panel/navigate-to-`/docs` split |
| `src/stores/fileStore.ts` | Dual-mode (Supabase/localStorage) CRUD throughout; `loadGuestProject`, `persistGuestProject`, `generateId`, `GUEST_PROJECT_STORAGE_KEY` |
| `src/components/FileTree.vue` | Removed static `guestItems`; tree, rename, delete, drag-and-drop, and context menus now unconditional; "Upload file" gated on `projectId` |
| `src/views/EditorView.vue` | Synchronous `loadGuestProject()` call in `<script setup>`; file-tree pane no longer conditional; active-file correction generalized to both modes |
| `src/components/CodeEditor.vue` | Removed the guest-mode example-code fallback in `ensureModel` |
| `src/sandbox/hostBridge.ts` | Removed the duplicate example-code fallback in `resolveScript`; `sandboxUrl()` now points at `runner.html` |
| `sandbox.html` → `runner.html` | Renamed to resolve the `/sandbox` route collision |
| `vite.config.ts` | Build entry renamed to match (`sandbox` → `runner`) |
| `src/sandbox/protocol.ts`, `src/sandbox/channel.ts`, `src/sandbox/main.ts` | Comment-only: updated references to the old `sandbox.html` filename |

## Testing notes

No dedicated test suite exists for this. Verified with Playwright driven
against the Vite dev server, set up ad hoc for this session (no `chromium-cli`
or other browser tool was available in this environment — installed
`playwright` directly into the scratchpad directory and drove it with plain
Node scripts).

**The collision above means direct `page.goto('http://localhost:5173/sandbox')`
does not exercise the real route** — it hits the same static-file collision a
real browser would, and "testing" it that way would have silently validated
the *iframe document*, not the sandbox page. Client-side navigation (starting
at `/` and clicking the Sandbox nav button, exactly like a real user would
from anywhere else in the app) is what actually reaches the SPA route, and is
what the fix was re-verified against — both a direct `goto('/sandbox')` on a
clean tab and a plain reload while already there, post-fix, now render
correctly.

Confirmed end-to-end: fresh-seed content, create/rename/delete for all three
node kinds, drag-and-drop reorder, "Upload file" absent from every menu in
guest mode, the exact `localStorage` shape written, persistence across
navigating away and back, and the legacy `main.js` migration (seeded the old
flat format by hand, confirmed the new script's content came from it and the
old key was removed). Zero console errors across all of it.
