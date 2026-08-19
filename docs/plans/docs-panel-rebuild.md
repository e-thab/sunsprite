# Docs panel rebuild: routed, breadcrumbed, category-nested docs

## Context

The current docs panel (`DocsPanel.vue` + `DocsSectionItem.vue` + `docsContent.ts`) is a small hand-authored tree: 5 top-level categories, ~16 leaf entries total, shown only inside a dockable pane in the editor. It covers a fraction of the real, documentable surface — `apiLib.ts`/`core.ts`/`mixins.ts` define roughly 50-60 individually-documentable API members (shared trait mixins, global functions, classes), and there's no documentation at all yet for the app's own UI/panels.

The goal is to rebuild this into something closer to a real docs site (Godot's docs were the requested functional reference): every doc node — category or entry — is independently routable and viewable outside the panel, categories get real landing pages, navigation uses a breadcrumb, tree nodes support click-to-navigate separately from click-to-expand, and search is rebuilt to work over the larger, routed tree. All 5 existing categories are preserved; the "Sunsprite API" category grows real subcategories for the parts of the API that exist today but aren't documented yet, and a new "UI Features" category is added as a content shell for docs the user will write themselves.

**Stack correction worth knowing going in**: despite "Nuxt UI," this is a Vue 3 + Vite SPA using `vue-router` (`^5.0.3`), not the Nuxt framework — no file-based routing, no `pages/`, no `nuxt.config`. `@nuxt/ui@4.10.0` is a standalone component library here (Vite + Vue plugins in `vite.config.ts`/`src/main.ts`). "Route to its own page" means adding routes to `src/router/index.ts`; "Nuxt UI Breadcrumb" means importing `UBreadcrumb` from `@nuxt/ui`, confirmed working standalone (its `to` prop resolves through `@nuxt/ui`'s own vue-router override, not a Nuxt-only code path — verified by reading the shipped component source).

## Decisions locked in with the user

1. **Panel stays URL-independent.** The docs panel keeps its own local navigation state (a ref, not `route.params`). An "Open full page" button opens the real `/docs/...` URL **in a new browser tab** (a plain link with `target="_blank"` via `resolveHref()`, not a `router.push` — the editor tab is never navigated away from). No query-param sync. This avoids entangling docs navigation with `EditorView.vue`'s existing splitpanes width-restore logic (`onDocsPaneAdd`/`onDocsPaneRemove`, keyed off `docsStore.isOpen`) and its `beforeRouteLeave` unsaved-changes guard — both currently treat the docs pane as opaque UI state, not a route.
2. **Content depth: small fully-written slice, real short stubs everywhere else.** See §6 for the exact list. Nothing is a placeholder/lorem-ipsum stub — every stub entry gets a real, accurate one-line description adapted from the existing JSDoc in `apiLib.ts`/`core.ts`/`utility.ts` — but most entries don't get full param tables or worked examples in this pass.
3. **UI Features gets a structural template only, no drafted content.** Build the category, its routing/rendering support, and exactly one example entry with placeholder copy demonstrating the shape. The user will write the real entries themselves by copying that pattern.

**First implementation step**: copy this plan document into the repo at `docs/plans/docs-panel-rebuild.md` (no existing `docs/`-at-root or `plans/` convention was found in this repo, so this is a new, sensibly-named location — adjust if a different spot is preferred) so it's kept for reference alongside the code it describes.

> **Superseded in part (docs content is now SFCs).** §1's `DocBody`/`ProseBody`/`ApiMemberBody` shapes are gone: a docs page is a Vue SFC under `src/assets/docs/content/`, its place in the tree comes from where the file sits, and its `meta` export supplies title/icon/summary (sibling order is one list in the parent folder's `index.vue`). Pages compose the blocks in `src/components/docs/content/` (DocSignature, DocParams, DocMethods, DocExample, …). Everything else here — routing, breadcrumb, tree behaviour, search, the panel/full-page split — still describes the code as built.

## 1. Content data model

New file `src/assets/docs/docsTypes.ts`, replacing the single flat `DocSection` interface in `docsContent.ts`:

```ts
export type DocRef = { path: string; label?: string }

export type DocCategoryNode = {
  kind: 'category'
  slug: string            // URL segment, unique among siblings
  title: string
  icon?: string            // tabler:*
  summary: string          // one-liner: search results, breadcrumb tooltip, parent's child-list card
  intro?: string           // landing-page paragraph(s)
  children: DocNode[]
}

export type DocEntryNode = {
  kind: 'entry'
  slug: string
  title: string
  icon?: string
  summary: string
  body: DocBody
}

export type DocNode = DocCategoryNode | DocEntryNode

export type ProseBody = {
  kind: 'prose'
  paragraphs: string[]
  related?: DocRef[]
}

export type ApiMemberBody = {
  kind: 'api-member'
  memberKind: 'trait' | 'class' | 'function' | 'namespace' | 'property' | 'enum'
  signature?: string
  description: string
  params?: { name: string; type: string; description: string; optional?: boolean }[]
  returns?: { type: string; description: string }
  properties?: { name: string; type: string; description: string }[]   // own only, not inherited
  methods?: { name: string; signature: string; description: string }[] // own only, not inherited
  mixins?: DocRef[]        // shared-trait composition, see below
  example?: string
  related?: DocRef[]
}

export type DocBody = ProseBody | ApiMemberBody
```

Why two tiers: tree/routing fields (`slug`, `children`) are orthogonal to how content renders. Forcing API members into a flat `content: string` loses the structured params/returns/properties tables that are the entire point of the rebuild; forcing prose entries (Getting Started, Tutorials, Challenges, Tips, UI Features) to carry unused `params`/`signature` fields is dead weight. `DocsBody.vue` (§3) dispatches on `body.kind`.

### Shared trait mixins — verified composition, not assumed

Read directly from `mixins.ts`/`GameObject.ts`/`Sprite.ts`/`Line.ts`/`HLine.ts`/`Rectangle.ts`/`Circle.ts`/`Label.ts`/`VLine.ts` — the composition is **not uniform**, so don't hand-wave it:

| Class | Composes |
|---|---|
| `Sprite`, `Rectangle`, `Circle`, `Label` | extend `GameObject`, which composes all 6: `Sizable`, `Positionable`, `Rotatable`, `Viewable`, `Interactable`, `Timeable` — plus `GameObject`'s own directly-declared members (`touching()`, `left`/`right`/`top`/`bottom`/`topLeft`/`topCenter`/`topRight`/`leftCenter`/`rightCenter`/`bottomLeft`/`bottomCenter`/`bottomRight`) |
| `Line` | `Rotatable`, `Viewable`, `Timeable` directly (no `Positionable`/`Sizable`/`Interactable`, no `GameObject`) |
| `HLine`, `VLine` | `Viewable`, `Timeable` directly (confirmed by reading both files — not "viewable only") |

Mechanism (Godot's inheritance-chain click-through, adapted for composition): each trait — the 6 mixins plus `GameObject` itself as a 7th composite — becomes its own `DocEntryNode` (`body.memberKind: 'trait'`) under `api/traits`. `GameObject`'s own body lists `mixins: [Sizable, Positionable, Rotatable, Viewable, Interactable, Timeable]` (nested reuse of the same mechanism). Each class links only to what it directly composes: `Sprite.mixins = [{path: 'api/traits/game-object'}]`; `Line.mixins = [rotatable, viewable, timeable]`; `HLine.mixins = [viewable, timeable]`. `DocsBody.vue` renders these as a "Composed From" section of linked cards — never inlining the trait's members, matching Godot's non-duplicated inheritance chain.

### Derived index (new, computed once)

`src/assets/docs/docsIndex.ts` walks `docsTree` once at module load: `nodesByPath: Map<string, DocNode>` (path = slugs joined with `/`), `ancestorsOf(path): DocNode[]`, and flattened `searchEntries: { node, path, breadcrumbLabel }[]`. This is the single resolution point routing, breadcrumb, and search all consume. Cheap to compute eagerly — content is static and small (~150 nodes at full scope).

## 2. Routing

Add to `src/router/index.ts`, **before** the existing `/:pathMatch(.*)*` 404 route (order matters — first match wins, and `/docs/search` must be registered above the docs catch-all or it swallows `search` as a path segment):

```ts
{
  path: '/docs/search',
  name: 'docs-search',
  component: () => import('../views/DocsSearchResultsView.vue'),
},
{
  path: '/docs/:pathMatch(.*)*',
  name: 'docs',
  component: () => import('../views/DocsView.vue'),
},
```

One catch-all handles both the bare `/docs` landing page (empty `pathMatch`) and arbitrary depth — the same repeatable-param pattern the router's own 404 route already uses. `DocsView.vue` joins `route.params.pathMatch`, resolves it via `docsIndex.nodesByPath`, and renders a category landing or entry body; an unresolvable path renders `ErrorView.vue` (already a generic, prop-driven 404 — `ProjectEditorView.vue` reuses it the same way for missing projects, so this is established precedent).

Per decision #1, the panel does **not** route through this — see §3's shared navigation contract for how the panel and the standalone page share rendering without sharing URL state.

## 3. Component architecture

New folder `src/components/docs/` (matches the existing `src/components/icons/` precedent).

**Shared navigation contract** — the mechanism that lets one set of rendering components serve both the panel and the standalone page, replacing `docsExpandState.ts`:

```ts
// src/assets/docs/docsNavigation.ts
export interface DocsNavigationContext {
  currentPath: Ref<string>
  navigate: (path: string) => void
  resolveHref: (path: string) => string   // real /docs/... URL, for open-in-new-tab
  isExpanded: (path: string) => boolean
  toggleExpanded: (path: string) => void
}
export const docsNavigationKey: InjectionKey<DocsNavigationContext> = Symbol('docsNavigation')
```

`DocsPanel.vue` provides an implementation backed by a local ref (`navigate` mutates it; `isExpanded` auto-derives from the current path's ancestor chain, merged with manual toggles — the same "seed from state, then user-controlled" pattern `FileTree.vue` already uses for folder expand state). `DocsView.vue` provides an implementation backed by `route.params`/`router.push`. Every component below consumes this one contract and doesn't know which shell it's in.

**New:**

- **`DocsBreadcrumb.vue`** — wraps `UBreadcrumb`. Confirmed API: `items: BreadcrumbItem[]` (`label`, `icon`, plus `LinkProps` fields including `to`), last item auto-marked active. Built from `docsIndex.ancestorsOf(currentPath)`; each item gets `to: resolveHref(path)` (so right-click/open-in-new-tab always works) with the click intercepted to call the injected `navigate()` instead when inside the panel.
- **`DocsOpenFullPageButton`** (small piece of `DocsPanel.vue`, not necessarily its own file) — a `UButton`/`ULink` rendered with `to: resolveHref(currentPath)` and `target="_blank"`, so it opens a real new tab at the standalone URL rather than calling `router.push` — the editor/panel stays exactly where it was.
- **`DocsTree.vue`** — replaces `DocsSectionItem.vue`. Built on `UTree`, for consistency with `FileTree.vue`/`AssetLibrary.vue` (both already solve the exact "expand-caret vs. select-to-navigate" split-target problem this needs). Reuse `FileTree.vue`'s proven technique directly: `onSelect: (e) => e.preventDefault()` on category rows so the row's native click toggles expand without navigating, with an `item-label` slot rendering an independently-clickable `@click.stop` region that calls `navigate()`; leaf rows just call `navigate()` on select. Controlled `expanded` bound to the injected `isExpanded`/`toggleExpanded` (only the active branch stays open, matching Godot). `item-leading` slot reuses today's exact `tabler:chevron-down`/`tabler:chevron-right` treatment from `DocsSectionItem.vue` so the visual language doesn't change even though the underlying widget does.
- **`DocsBody.vue`** — entry renderer, `v-if` on `body.kind`: `prose` → paragraphs + optional related-links row; `api-member` → signature block, description, Params/Returns/Properties/Methods tables, "Composed From" trait links, example block. One file (not two) since both branches share the same header; split later only if a branch grows unwieldy.
- **`DocsCategoryLanding.vue`** — category page: header (title + `intro`) + children listed as cards (icon/title/summary), each navigating via the injected context. Mirrors Godot's "category = intro + list of children, always a real route."
- **`DocsToc.vue`** — right-side "on this page" TOC, standalone-page only (no room in the compact panel), rendered only past a minimum section count. This directly fills the gap the Godot research flagged (their theme has no on-page TOC). **Verification note**: check whether `@nuxt/ui`'s `ContentToc` component's types pull in `@nuxt/content`'s `TocLink` type (that package isn't installed here) — if `type-check` complains, define a local structurally-equivalent heading type instead of importing it, rather than adding `@nuxt/content` as a dependency.
- **`DocsSearchModal.vue`** / **`DocsSearchResultsList.vue`** — see §4.
- **`src/views/DocsView.vue`** — standalone routed shell: tree (full, unconstrained) + breadcrumb + landing-or-body content + TOC.
- **`src/views/DocsSearchResultsView.vue`** — `/docs/search` fallback page, §4.

**Modified:**

- **`DocsPanel.vue`** — keeps its `.panel-wrapper`/`.panel-bar` header and search-input shell exactly as-is. Below that: `DocsBreadcrumb` (compact) + `DocsTree` for browsing + a content region below driven by the panel's local `currentPath`, rendering the same `DocsCategoryLanding`/`DocsBody` components the standalone page uses — this is what makes "viewable outside the panel" true without duplicating rendering logic. An "Open full page" link/button sits near the breadcrumb, `target="_blank"` per decision #1 — it opens a new tab, it never navigates the editor tab away.

**Deleted:** `DocsSectionItem.vue` (→ `DocsTree.vue`), `docsExpandState.ts` (→ `docsNavigation.ts`).

## 4. Search rebuild

Keep the hand-rolled matcher in `docsSearch.ts` (tokenize/word-match/Levenshtein-≤1) — at the target scale (~150 nodes) it's still trivially fast per keystroke; no indexing structure is actually needed. What changes is the shape it runs over: today it recursively re-walks `DocSection[]` on every keystroke against a flat `content?` field; the rebuild runs over `docsIndex.searchEntries` (computed once) and adds a `searchableText(node)` step that flattens whatever's in `body` (prose paragraphs, or api-member description+params+signature+summary) into one haystack string.

Two entry points sharing the same matching core:
- `filterTree(query)` — same pruned-subtree shape as today's `filterDocsSections`, feeds `DocsTree`'s in-panel live filter (unchanged UX).
- `searchDocs(query): DocSearchResult[]` — new flat ranked list (`{ node, path, breadcrumbLabel }`) for the command palette and results page.

**Search UI**: `UCommandPalette` directly (not `@nuxt/ui`'s heavier `ContentSearch` wrapper, which assumes a Nuxt-Content-flavored composable that doesn't fit here). Feed `searchDocs()` into `CommandPaletteGroup[]` (grouped by top-level category) with **`ignoreFilter: true`** — `UCommandPalette`'s documented bring-your-own-filtering escape hatch — so this gets Nuxt-UI-conventional modal/keyboard-nav search while keeping the existing matcher and adding **zero new dependencies** (confirmed: `@nuxt/ui` bundles Fuse.js for its own default filtering, but it's internal to `@nuxt/ui`'s own `node_modules`, not hoisted into this project — irrelevant either way since `ignoreFilter` bypasses it).

New `src/stores/docsSearchStore.ts` (isOpen/open/close/toggle, mirrors `docsStore.ts` exactly) drives `DocsSearchModal.vue` (`UModal` + `UCommandPalette`), mounted once at `App.vue` root next to the existing `SignInModal`/`SignUpModal`, so it's reachable app-wide. Register `Cmd/Ctrl+K` via `@nuxt/ui`'s `defineShortcuts` composable (confirmed available standalone) plus a NavBar trigger button.

`src/views/DocsSearchResultsView.vue` at `/docs/search?q=...` reuses `searchDocs()`'s output through a shared `DocsSearchResultsList.vue` presentational component (used by both the modal and this page) — the Godot-style deep-linkable fallback, giving every search a shareable URL.

## 5. Migration — zero content loss

Every existing leaf's `content` string becomes the seed for its new `body` (prose → `paragraphs: [content]`; api-member → `description: content`), not discarded. The two compound entries in the current tree — `'keyPressed() / onKeyPress()'` and `'print() / warn()'` — split into individually-routable members (§6), with their existing blurb reused as seed text for each split.

Before/after shape sketch:

```
BEFORE                                  AFTER
Getting Started (leaf)              →   entry, prose            (migrated verbatim)
Sunsprite API                       →   category
  Classes (7 leaves)                      Classes (7 entries)     — api-member, full mixins per §1
  Functions (9 leaves, 2 compound)        Traits (7 NEW)          — api-member trait/composite
                                           Functions (split into subcategories, §6)
                                           Globals (NEW)          — Mouse, Screen, Timer, keysPressed
                                           Colors (NEW)           — enum
Tutorials (5 leaves)                 →  category, unchanged
Challenges (leaf)                    →  entry, prose (migrated verbatim)
Tips (leaf)                          →  entry, prose (migrated verbatim)
                                      →  UI Features (NEW top-level category, template only, §6)
```

## 6. Content scope for this pass

**Fully written now** (proves every structural pattern end-to-end — full mixin composition, partial composition, minimal composition, a full function subcategory):

- Trait: `Positionable`
- Trait: `GameObject` (the composite — proves nested mixin-of-mixins linking)
- Class: `Sprite` (full: links only to `GameObject`)
- Class: `Line` (partial: 3 direct trait links, no `GameObject`)
- Class: `HLine` (minimal: 2 direct trait links)
- Function subcategory "Game Loop & Timing", complete: `forever`, `repeat`, `repeatUntil`, `repeatWhile`, `after`, `every`, `when`
- A representative slice of `Random`: `range`, `float`, `coinFlip`, `choice`, `color` (covers the shape variety — numeric range, float, bool, array-pick, string-building — without doing all 14 members)

That's ~17 newly-authored full entries, plus the 8 already-existing leaves (Getting Started, 5 Tutorials, Challenges, Tips) carried over as-is with zero new writing — consistent with the "slice fully written" scope picked over "write everything."

**Real short-description stubs** (routable, searchable, breadcrumbed, linked from "Composed From" where relevant — just not full param tables/examples yet): remaining traits (`Sizable`, `Rotatable`, `Viewable`, `Interactable`, `Timeable`), remaining classes (`Rectangle`, `Circle`, `VLine`, `Label`, stub `Vector2`), remaining `Random` members (`roll`, `char`, `letter`, `radians`, `degrees`, `position`/`pos`, `x`, `y`), Math functions (`deg2rad`, `rad2deg`, `sin`, `cos`, `tan`, `atan2`, `clamp`), Input functions (`keyPressed`, `keyJustPressed`, `keyJustReleased`, `onKeyPress`, `onKeyRelease`, `onKeyHold`, `onMouse` — split out of today's 2 compound entries), Output functions (`print`, `warn`, `error`, `clearOutput` — split out of today's compound entry), Globals (`Mouse`, `Screen`, `Timer`, `keysPressed` — member lists already confirmed from `apiLib.ts`), `Colors` enum. Descriptions adapted directly from the real JSDoc already in `apiLib.ts`/`core.ts`/`utility.ts` (hand-authored, not generated — no JSDoc-parsing build step, consistent with this project's hand-rolled-over-tooling bias).

**UI Features category** (per decision #3): create the category node and exactly **one** example entry (e.g. "Docs Panel", since it's the most topical) with a `ProseBody` containing clearly-marked placeholder paragraphs the user will replace. No other entries invented on the user's behalf — they'll add siblings by copying this one file's shape, the same "scales by copy-and-fill" pattern the API content files use.

## 7. File-level plan

**New:**

| File | Responsibility |
|---|---|
| `src/assets/docs/docsTypes.ts` | `DocNode`/`DocCategoryNode`/`DocEntryNode`/`DocBody` union (§1) |
| `src/assets/docs/docsIndex.ts` | `nodesByPath`, `ancestorsOf()`, flattened `searchEntries` (§1) |
| `src/assets/docs/docsNavigation.ts` | `docsNavigationKey` injection contract (§3), replaces `docsExpandState.ts` |
| `src/assets/docs/docsSearch.ts` | Rewritten in place: same matching core, adapted shape + `filterTree()`/`searchDocs()` (§4) |
| `src/assets/docs/content/gettingStarted.ts`, `tutorials.ts`, `challenges.ts`, `tips.ts` | Migrated verbatim from today's `docsSections` |
| `src/assets/docs/content/api/traits.ts`, `classes.ts`, `functions/gameLoop.ts`, `functions/random.ts`, `functions/input.ts`, `functions/output.ts`, `functions/math.ts`, `globals.ts`, `colors.ts`, `index.ts` | API category content (§6). **Pattern, not enumerated**: each member is one object literal in the relevant array; every additional member later follows the identical shape — scales by copy-and-fill |
| `src/assets/docs/content/ui/index.ts` | New UI Features category: the category node + one placeholder example entry (§6) |
| `src/components/docs/DocsBreadcrumb.vue`, `DocsTree.vue`, `DocsBody.vue`, `DocsCategoryLanding.vue`, `DocsToc.vue`, `DocsSearchModal.vue`, `DocsSearchResultsList.vue` | §3, §4 |
| `src/views/DocsView.vue` | Standalone routed full-page shell (§2, §3) |
| `src/views/DocsSearchResultsView.vue` | `/docs/search` fallback page (§4) |
| `src/stores/docsSearchStore.ts` | Search modal open/close state, mirrors `docsStore.ts` |

**Modified:**

| File | Change |
|---|---|
| `src/assets/docs/docsContent.ts` | Rewritten as a thin barrel composing the `content/` modules into `docsTree: DocNode[]` — import path preserved |
| `src/router/index.ts` | Add `docs-search` and `docs` routes (§2), above the 404 catch-all |
| `src/components/DocsPanel.vue` | Reworked to breadcrumb + tree/content split + "open full page" (§3) |
| `src/components/NavBar.vue` | Add a search-docs trigger button, register `Cmd/Ctrl+K` |
| `src/App.vue` | Mount `<DocsSearchModal />` at root, alongside existing `<SignInModal />`/`<SignUpModal />` |

**Deleted:** `src/components/DocsSectionItem.vue`, `src/assets/docs/docsExpandState.ts`.

## 8. Visual/styling — stay consistent with existing conventions

- `DocsPanel.vue`'s `.panel-wrapper`/`.panel-bar` header is untouched — same convention as `FileTree.vue`/`AssetLibrary.vue`/`OutputPane.vue`.
- Breadcrumb: inactive crumbs `--theme-text-toned`, current crumb `--theme-text-highlighted` (matches `DocsSectionItem.vue`'s existing color choices today).
- Standalone `DocsView.vue`: content column at a constrained readable width over `--theme-bg-elevated` (matches `ProjectsView.vue`'s full-page convention); aside/TOC use `--theme-bg`/`--theme-border`.
- Tree carets in `DocsTree.vue` reuse the exact `tabler:chevron-down`/`tabler:chevron-right` + `--theme-text-toned` treatment from today's component, via `UTree`'s `item-leading` slot (same override technique `FileTree.vue` uses for folder icons).
- Category cards: hover in `--theme-bg-accented` (matches the splitter-hover convention already in `EditorView.vue`).
- Signature/example blocks: monospace, `--theme-bg` background (recessed relative to `--theme-bg-elevated` content).
- Icons: Tabler throughout (`tabler:book-filled` root, `tabler:folder-filled` categories, `tabler:function` Functions, `tabler:palette-filled` Colors — matching NavBar's existing Docs/Theme button icons).
- Everything through `--theme-*`/`--ui-*` variables, never hardcoded colors, per `base.css`.

## 9. Verification

No test suite exists (`package.json` scripts: `dev`/`build`/`build-only`/`preview`/`type-check` only). Verify manually:

1. `npm run type-check` clean — run this right after first wiring up `UBreadcrumb`/`DocsToc`, per the `@nuxt/content` type risk noted in §3.
2. `npm run dev`, load `/`, confirm the app boots and the NavBar "Docs" button still opens the panel.
3. Panel: breadcrumb shows root, tree shows all top-level categories.
4. Click a category's **caret only** — children toggle, breadcrumb/content unchanged (proves caret ≠ navigate).
5. Click a category's **label** — breadcrumb updates, content shows the landing page (intro + children), tree auto-expands that branch.
6. Drill into Classes → Sprite — breadcrumb shows full ancestry, content shows properties/"Composed From" → GameObject; click through GameObject → confirm it shows its own 6 trait links (proves nested mixin linking).
7. Click a middle breadcrumb segment — jumps back up correctly.
8. Click "Open full page" from Sprite — a **new tab** opens at `/docs/api/classes/sprite` rendering the same content via `DocsView` (proves shared-component reuse across shells); the original editor tab/panel is untouched.
9. Type `/docs/api/traits/positionable` directly into the address bar (cold load, no prior panel state) — resolves correctly (proves standalone viewability).
10. Navigate to `/docs/does/not/exist` — clean 404 via `ErrorView.vue`.
11. Browser Back/Forward from the standalone page behaves sanely.
12. In-panel fuzzy search (e.g. "sprit", "forver") — tree filters live across the larger tree, same behavior as today.
13. Cmd/Ctrl+K from outside the panel (panel closed, or from `/projects`) — modal opens, grouped results appear, selecting one navigates and closes the modal.
14. Visit `/docs/search?q=sprite` directly — results match the modal.
15. Toggle the app's theme — all new docs surfaces re-theme correctly (no hardcoded colors).
