# `/edit` + `/play` routes and project visibility

## What this is

Three related changes, shipped together because the access-control logic only
makes sense as one design:

1. The per-project editor moved from `/projects/:slug` to `/edit/:slug` (old
   links redirect rather than break).
2. A new `/play/:slug` route: a fullscreen, editor-free player for a single
   project's game — no file tree, no code panel, no nav bar.
3. Projects gained a public/private flag (`is_public`, default `false`,
   toggled from a switch on the My Projects page). Private is unchanged from
   today's behavior (owner-only, period). Public means: the play route works
   for anyone, signed in or not; the edit route is still owner-only.

## Why this needed two layers of access control, not just RLS

This is the one idea worth understanding before touching any of this code.

Before this change, every table's RLS policy was the same shape: `to
authenticated using (owner_id = auth.uid())` (or the same check through a
parent project for scripts/folders/images/text_files). One policy, one rule,
done — reading a row and being allowed to edit it were the same permission.

Making a project's *play* route public breaks that equivalence. The play
route needs `scripts`/`folders`/`images`/`text_files` to be **readable** by
someone who isn't the owner — that's the whole feature. But the edit route
must **not** become editable, or even viewable-in-the-editor, by that same
non-owner. RLS operates on rows, not on *why* you're reading them — it
cannot tell "reading in order to render a running game" apart from "reading
in order to populate Monaco." So:

- **RLS** now grants read access to a public project's rows to anyone
  (`to public`, gated on `projects.is_public`), additively — the existing
  owner-only policies are untouched, RLS just OR's the two together.
- **The edit route enforces ownership itself**, on top of whatever RLS
  already let it read (`ProjectEditorView.vue` — see below). This is the one
  check that actually implements "edit stays owner-only even when public."
  It is not optional, redundant, or defense-in-depth — without it, any
  signed-in user could open `/edit/:slug` for someone else's public project
  and see (though not successfully write to, since the *write* policies
  never changed) their code in a real editor session.
- **The play route needs no equivalent check.** RLS alone already produces
  the right outcome: a private project's row simply doesn't resolve for
  anyone but the owner (same as a nonexistent slug), and a public project's
  row resolves for everyone. There's nothing narrower that "allowed to play"
  needs beyond "allowed to read."

Access matrix, for reference:

| | `/edit/:slug` | `/play/:slug` |
|---|---|---|
| Owner, private | ✅ | ✅ |
| Owner, public | ✅ | ✅ |
| Guest, private | ❌ (RLS: no row) | ❌ (RLS: no row) |
| Guest, public | ❌ (`requiresAuth` bounces to sign-in) | ✅ |
| Other signed-in user, private | ❌ (RLS: no row) | ❌ (RLS: no row) |
| Other signed-in user, public | ❌ (app-level owner check) | ✅ |

## Key mechanisms, file by file

### `supabase/migrations/20260821173708_add_project_visibility.sql`

- `projects.is_public boolean not null default false`.
- Five new **additive** SELECT policies, one per table (`projects`,
  `scripts`, `folders`, `images`, `text_files`), each `to public` (every
  Postgres role — not just Supabase's `anon`/`authenticated`) gated on
  `is_public` (checked directly on `projects`, or via an `exists` against the
  parent project for the other four). These sit alongside the original
  owner-only policies, not replacing them — RLS OR's every matching
  permissive policy for a table together.
- `grant select on ... to anon` for all five tables. The Data API rejects a
  request before RLS is even evaluated if the role has no table-level grant
  at all — these tables had only ever granted `authenticated`, so a guest
  got a hard permission error, not just an RLS-empty result, without this.
- **All five tables needed this, not just `scripts`/`text_files`.** The
  actually-running game only ever resolves script content through
  `fileStore.getLocalCode()`, which only touches `scripts`/`text_files`. But
  `PlayView.vue` (below) reuses `fileStore.loadProject()` wholesale, which
  unconditionally queries all four child tables in parallel and **throws** if
  any individual query errors (`if (folderError) throw folderError`, etc. —
  `fileStore.ts` lines ~427-430). Skipping `folders`/`images` grants would
  have made every guest's play-page load throw on the very first render,
  100% of the time — not an edge case. This was caught by reading
  `loadProject`'s actual error handling directly rather than trusting a
  first-pass research summary that (incorrectly) said errors weren't
  checked per-query; worth remembering if this table's query logic ever
  changes again; assume errors are checked until you've re-read the code that
  says otherwise.
- Write policies (insert/update/delete) were not touched anywhere. Public
  vs. private only ever changes what's *readable*.

### `src/router/index.ts`

- `/projects/:slug` (`name: 'project'`) became `/edit/:slug` (`name: 'edit'`),
  same `component`/`meta: { requiresAuth: true }`/`props: true` as before.
- The old path was kept as its own route entry, `redirect: (to) =>
  '/edit/' + to.params.slug` — for anything already bookmarked or shared.
- `/play/:slug` (`name: 'play'`) is new, points at `PlayView.vue`, and
  **deliberately has no `meta.requiresAuth`** — that's what lets a guest
  reach it at all. Its own access control is entirely RLS (see above), not a
  router guard.

### `src/views/ProjectEditorView.vue` — the load-bearing check

`load(slug)` now selects `owner_id` alongside `id`/`name`, and immediately
after the existing "no row → not-found" check, adds:

```ts
await authStore.ready
if (data.owner_id !== authStore.user?.id) {
  status.value = 'not-found'
  return
}
```

Reusing the existing `'not-found'` status (and its existing ErrorView
message, "This project doesn't exist, or you don't have access to it.") is
deliberate — it doesn't distinguish "doesn't exist" from "exists but isn't
yours" to someone probing slugs. `await authStore.ready` is technically
redundant with the router's own `beforeEach` guard (which already awaits it
for any `requiresAuth` route before this component ever mounts), but it's
cheap (already-resolved promise) and keeps the dependency visible locally
instead of relying on guard-ordering knowledge living only in
`router/index.ts`.

**If this check is ever removed or weakened, the entire "edit stays
owner-only" half of the feature silently stops being true for public
projects** — nothing else in the stack enforces it. This is the one place to
double check after any refactor of this view.

### `src/views/PlayView.vue` — new

Mirrors `ProjectEditorView.vue`'s slug-resolution shape (same `load()` /
`status: 'loading' | 'ready' | 'not-found' | 'error'` pattern, same
`ErrorView` reuse) but differs in three deliberate ways:

- **No ownership check** — see the access-matrix reasoning above; RLS alone
  is already correct here.
- **Reuses `fileStore.loadProject(id)` as-is** rather than a new, narrower
  read-only loader that queries only `scripts`/`text_files`. This was a
  deliberate call, not an oversight: `docs/sandbox-page.md` already flags
  script-resolution logic existing in two places as "the trap to remember"
  for this codebase (host-side editor resolution vs. sandbox-side run
  resolution silently drifting apart). A second, hand-rolled project loader
  would be the same trap again. The accepted cost: `loadProject` also fetches
  `folders`/`images` that a play session never renders, and its "seed a
  default `main.js`" fallback (fires only when a project has *zero* scripts
  and folders) would attempt a write under a guest's read-only `anon` grant
  and surface as an error page instead of a clean "not found" — judged
  acceptable since the app enforces "a project always has at least one
  script" elsewhere, so a real project should never actually be empty.
- **Runs the game itself.** There's no `CodeEditor` instance to delegate to
  here, so `runGame()` calls `runUserCode(fileStore.getLocalCode('main.js')
  ?? '', 'main.js', themeStore.current)` directly (the same three arguments
  `CodeEditor.vue`'s `runNamedScript()` passes) and is invoked both from
  `onMounted` and from the `watch(() => props.slug, ...)` handler — so unlike
  the edit route (where `EditorView`'s own `onMounted`-driven run does *not*
  re-fire if `ProjectEditorView` reuses the same mounted instance across a
  slug change), navigating directly between two `/play/:slug` URLs correctly
  restarts the new project's game. This is a pre-existing characteristic of
  the edit route, not something touched here — just don't assume the two
  routes behave identically on a slug change.

NavBar hiding needed **zero changes to `App.vue`**: `NavBar.vue` already
self-hides via `v-if="!fsStore.fullscreen"` (`fsStore` = the existing
`useFullscreenStore` singleton, originally built for `EditorView.vue`'s
in-app "maximize the canvas pane" toggle). `PlayView.vue` sets
`fullscreenStore.fullscreen = true` in `onMounted` and back to `false` in
`onUnmounted`. **That reset matters** — it's a global singleton shared with
every other route; forgetting it would leave the nav bar hidden after
navigating away from a play page to anywhere else in the app. Its own
`@fullscreen` handler (from `PhaserCanvas.vue`'s toolbar button) just calls
`fullscreenStore.toggle()` + `resizeStage()` — on this route that button
now means "show/hide the site nav on top of the player" rather than its
original "collapse the editor's side panes" meaning, since there are no
side panes here to collapse. Same store, different effective behavior per
route — worth knowing if that button's behavior ever seems to "do nothing."

### `src/stores/projectStore.ts`

- `ProjectRecord` gained `isPublic: boolean`; `fetchProjects()` and
  `createProject()` both select `is_public` and map it in.
- New `setPublic(id, isPublic)`, structurally identical to the existing
  `renameProject(id, name)`: update in Supabase, then patch the matching
  entry in the local `projects` ref on success. No optimistic update before
  the round-trip — same as `renameProject`.

### `src/views/ProjectsView.vue`

- The two `router.push`/`UButton` links that pointed at `/projects/${slug}`
  now point at `/edit/${slug}`.
- Each row gained a `USwitch` bound with explicit `:model-value` /
  `@update:model-value` (not `v-model`) so a failed `setPublic()` call can
  report through the same `errorMessage` pattern `onRename`/`onDelete`
  already use, rather than the switch silently flipping back with no
  explanation.
- Each row also gained a Play button (`:to="/play/${slug}"`,
  `target="_blank"`) — opens in a new tab deliberately, so toggling
  visibility and clicking Play don't navigate the My Projects list away.

### `src/components/NavBar.vue`

Two more `/projects/${slug}` → `/edit/${slug}` link updates (project
creation's post-create redirect, and the "recent projects" dropdown). No
other NavBar changes — its `/projects` (the *list*) links were already
correct and untouched.

### `src/assets/utils/database.types.ts`

Hand-patched (`is_public: boolean` / `is_public?: boolean` added to
`projects`' `Row`/`Insert`/`Update`) rather than regenerated, since this
environment has the Supabase CLI but no Docker for a local stack to generate
against. **Run a real `supabase gen types typescript --linked` over this
once it's convenient** — the hand edit was done carefully to match the
generator's exact style, but it's not the authoritative source of truth
until it's actually been regenerated.

## Files touched

| File | What changed |
|---|---|
| `supabase/migrations/20260821173708_add_project_visibility.sql` | New — `is_public` column, 5 additive public-read RLS policies, 5 `anon` select grants |
| `src/router/index.ts` | `/projects/:slug` → `/edit/:slug` (+ redirect for the old path), new `/play/:slug` |
| `src/views/ProjectEditorView.vue` | Selects `owner_id`, adds the app-level ownership check |
| `src/views/PlayView.vue` | New — fullscreen player, no ownership check needed, reuses `loadProject` |
| `src/stores/projectStore.ts` | `ProjectRecord.isPublic`, `fetchProjects`/`createProject` updated, new `setPublic()` |
| `src/views/ProjectsView.vue` | Route links, visibility `USwitch`, Play button |
| `src/components/NavBar.vue` | Route links (project creation redirect, recent-projects dropdown) |
| `src/views/EditorView.vue` | One stale comment referencing the old `/projects/:slug` path |
| `src/assets/utils/database.types.ts` | Hand-patched `is_public` on the `projects` table types |

## Considerations for working with this later

- **Any new project-scoped table needs the same public-read policy if a
  running game should be able to read it while played by a guest.** Copy the
  shape from the migration above: `to public using (exists (select 1 from
  projects where projects.id = <table>.project_id and projects.is_public))`,
  plus a matching `grant select on <table> to anon`. Forgetting either half
  reproduces exactly the failure class described above — silent for the
  owner (who still has their original policy), broken specifically for
  guests on public projects.
- **The ownership check in `ProjectEditorView.vue` is the only thing
  standing between "public project" and "publicly editable project."** Don't
  assume RLS has this covered — by design, it deliberately doesn't, so that
  the play route can work. If `ProjectEditorView.vue` is ever refactored
  (e.g., merged into `EditorView.vue`, or the loading sequence changed),
  carry this check with it.
- **`fullscreenStore.fullscreen` now has two unrelated meanings** depending
  on route — "maximize the canvas pane" in the editor, "show/hide the site
  nav" on the play page. A third consumer would need to pick one of these
  interpretations or the store needs to actually be split; don't assume it
  only ever means one thing.
- **`PlayView.vue` deliberately does not have its own narrow data loader.**
  If `fileStore.loadProject()` grows new side effects in the future (new
  tables, new write-on-load behavior beyond the existing empty-project seed),
  reconsider whether those side effects are still acceptable for a
  guest-triggered read path — they inherit into the play route automatically
  since it's the same function.
- **Regenerate `database.types.ts` for real** (`supabase gen types
  typescript --linked`) once there's a working way to do that in this
  environment — the current `is_public` entries are a careful hand-match,
  not a guarantee.

## Testing this feature

- `vue-tsc --build` passes clean on all of the above.
- The migration has been pushed to the live linked Supabase project
  (`supabase db push`, confirmed by the user).
- **Live browser verification was attempted but not yet completed.** A
  Playwright-driven pass (dev server + a throwaway sign-up per test account)
  hit two real Supabase Auth gotchas worth remembering for next time:
  - **`@example.com` addresses are rejected outright** (`400
    email_address_invalid`) — Supabase's signup validation blocklists RFC
    2606 reserved domains. Use a domain with real MX records instead (e.g.
    `mailinator.com`) for throwaway test accounts.
  - **The project's default/shared auth email service has a low send-rate
    limit** — a small handful of signups in quick succession triggered `429
    over_email_send_rate_limit` and blocked every subsequent signup attempt
    in the same session, even with a valid domain. This project has no
    custom SMTP configured, so it's on Supabase's shared low-volume test
    sender. Signing **in** doesn't send email and isn't affected — only
    **signing up** is rate-limited this way.
  - Plan going forward: create one persistent test account (`test`/`test`,
    once the rate limit window clears) and reuse it for sign-in across
    future test runs, rather than signing up a fresh throwaway account every
    time.
  - The full test plan (owner create → toggle public → guest plays → guest
    blocked from edit → signed-in non-owner blocked from edit on a public
    project → toggle back private → guest re-blocked from play → old route
    redirect → cleanup) is written up as a Playwright script; nothing in it
    ran far enough to produce a real pass or fail before the rate limit hit,
    so none of those checks should be treated as verified yet.

## Known characteristics, not gaps

- **"Public" means the underlying data is readable through the same API
  that powers the play route, not merely unlinked-but-hidden.** Anyone with
  API access (not just the polished Play UI) can read a public project's
  `scripts`/`text_files` content once it's public. This is inherent to what
  "anyone can play it" requires, not an oversight.
- **Image bytes were already fetchable by anyone who has (or guesses) the
  R2 object key, private project or not** — this predates this change
  entirely. The R2 bucket's CORS policy is origin-based (needed because the
  sandboxed game iframe has an opaque origin), not Supabase-auth-based; only
  the `images` table's *metadata* (which name maps to which key) was ever
  gated by RLS, and that's exactly what this change extends to public
  projects. Worth knowing so "private" isn't assumed to mean
  cryptographically inaccessible for uploaded art specifically — it means
  "not discoverable or linkable through the app or its API."
