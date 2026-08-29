# API declaration codegen + version snapshots

## Context

Sunsprite's scripting API exists as several independently hand-maintained copies of the same information, and they'd already drifted apart before this work started:

- **Real runtime source** — the 6 mixins (`src/assets/api/mixins/*.ts`) each kept a private `propDescription` object of plain-English text that only their own generated doc-strings referenced; the real getters/setters themselves mostly carried no JSDoc. The 7 concrete classes (`Sprite`/`Rectangle`/`Circle`/`Label`/`Line`/`HLine`/`VLine`) each declare a bare, undocumented `*Props` type.
- **Editor-only ambient declarations** — `src/assets/api/apiLib.ts` (953 lines) hand-assembles the `apiModel`/`apiLib` strings that `CodeEditor.vue` feeds to Monaco via `addExtraLib`. It duplicates every description above with its own separate, independently hand-written copy.
- **`src/assets/api/api.d.ts`** — an orphaned stub whose own comment says apiLib's content "should be moved into here," never acted on.

Confirmed drift, not hypothetical: `mixins/Interactable.ts`'s real `onClick` JSDoc disagreed with the separate `propDescription.onClick` text for the same method. `HLine`/`VLine` both really extend `Timeable`, but apiLib.ts's hand-picked interpolation list for them omitted `${timeableApi}` — `age`/`ageMs` were silently absent from their declared surface. `apiLib.ts` declared `MouseInputAction` twice with two different underlying event lists. `apiLib.ts`'s `Camera` declaration used invalid syntax and referenced an unresolvable `Phaser.Math.Vector2`. The real `cursor` setter accepts `Cursor | string`; the hand-written declaration silently flattened this to `cursor: Cursor`.

We proved the fix mechanically in conversation before writing any of this: using the `typescript` package (already a dependency — `moduleRunner.ts` already does `import * as ts from 'typescript'`) to parse real source with `ts.createSourceFile` and pull real JSDoc via `ts.getJSDocCommentsAndTags`, reproducing exactly the hand-written doc strings then kept in the mixins. This effort formalizes and extends that proof of concept into a real tool, plus a mechanism to freeze permanent, versioned snapshots of its output.

**This pass is declarations/tooling only.** Not touched: `CodeEditor.vue`'s placeholder version dropdown, any project-level version-selection persistence, the runtime `api` object in `core.ts`, the Core/Utilities/Camera/Vector2 sections of apiLib.ts (bug-fixed only, not derived), and docs-content versioning (facts recorded below for later, not acted on).

## Decisions locked in with the user

1. **Codegen scope**: the 6 mixins + the 7 concrete classes. Not GameObject's own members (see below); not Core/Utilities/Camera/Vector2.
2. **Known bugs found during research get fixed now**, not preserved faithfully — freezing a known bug into a permanent version snapshot is worse than fixing it before one exists.
3. **Script runtime**: `tsx` as a new devDependency. It transpiles only (esbuild) — it does not type-check. Real type-checking comes from adding `scripts/**/*` to `tsconfig.node.json`'s `include` so `vue-tsc --build` covers it too.
4. **`GameObject.ts`'s 13 boundary members are deferred entirely**, on the user's explicit call. Verified during planning: they're not merely undocumented, they're fully commented out in real source — several setters (e.g. `left`) have no logic even sketched in comment form, and `_initMixins` is marked `// WIP` right above them. Bringing them into the generated declarations would mean implementing new public API surface, not documenting existing code. Left untouched, on its own terms, for later.
5. **No `declare global` in generated or snapshotted output.** If either used `declare global { class Sprite {...} }`, every additional permanent version snapshot would collide the moment a second one exists — unlike interfaces, class declarations don't merge across ambient contexts. So the "current" generated file is a plain `.ts` module exporting **string constants** (same style as today's `positionablePropsTypeDef`), and snapshot files use real, module-scoped `export type`/`export declare class` syntax — safe to accumulate indefinitely.

## Progress log

Several of the planned "small mechanical fixes" turned out to already be done by the time implementation started (this file's author was working the same codebase in parallel) — recorded here rather than silently taking credit:
- Already done on arrival: all 6 originally-public no-op stub methods renamed with a leading underscore (`_lookAt`, `_sendToFrontLayer`/`_sendToBackLayer`/`_sendToLayerAbove`/`_sendToLayerBelow`, `_onMouseHold`) — verified zero call sites before trusting the rename was safe.
- Already done on arrival: a real `ScrollAction` type added to `types.ts` (not locally in `Interactable.ts` as originally planned — a fine, arguably better location, matching where `PointerAction`/`MouseInputAction` already live) with correct "horizontal/vertical distance scrolled" wording, and `Interactable.onScroll` repointed to use it instead of the generic `PointerAction`.
- Already done on arrival: apiLib.ts's duplicate `MouseInputAction` renamed to `MouseHoldAction`; `Camera`'s declaration syntax corrected from `=` to `:`.
- Done this pass: `Camera.shake()`'s declared signature corrected to match the real one exactly (`Camera.ts:94` — no `force` param, no unresolvable `Phaser.Math.Vector2`). Added `type Optional<T> = T | undefined | null` to apiLib.ts's hand-written preamble (needed once `Cursor`'s real definition, which references `Optional<T>`, is emitted verbatim instead of hand-inlined).
- One false alarm worth recording: a line reading `\ TODO: jsdoc` looked like corrupted syntax (a bare backslash outside any string) when first read. Verified via `vue-tsc --build --force` (clean) and then a raw grep before assuming it was a bug — it's an ordinary `// TODO: jsdoc` comment; the leading `//` was misread once from the line-numbered display. Left untouched.
- `Positionable.goToMouse()` turned out to be the same shape as the six already-renamed stub methods — its whole body was commented out (`// CHECK PHASER IMPLEMENTATION`, no real logic). Renamed to `_goToMouse()` rather than writing JSDoc for a method that does nothing; zero call sites confirmed first.
- Fixed a real, pre-existing bug while migrating text, not just relocating it: `PositionableProps`' `pos`/`position` doc comments had the alias relationship backwards (`position`'s text said "alias of position", i.e. of itself). The real code's own comment (`// Alias for position: pos`) confirms `pos` is the alias, `position` is primary — swapped to match.
- `Interactable.isInteractive` (no underscore) is genuine internal bookkeeping — every other field in that class doing the same kind of job (`_draggable`, `_cursor`, `_lastLeftClickTime`, `_eventActions`) is already underscore-prefixed; this one was the sole exception, and it was never in the old hand-written `interactableApi` either (confirming it was already being manually excluded, just not via the naming convention the generator relies on). Renamed to `_isInteractive` after confirming its only 4 uses are internal, in `_setInteractive`/`_disableInteractive`.

## Structure

```
scripts/
  api-codegen/
    ast.ts        -- extractDoc() (JSDoc summary + @param tags), isExcluded(),
                      findTypeAlias/findMixinClassExpression/findDefaultExportClass
    extract.ts     -- createProgram(); groups class members into accessor/method/
                      property; renders each to declaration text; resolveComposedMembers()
                      walks a class's real heritage (mixin chain or `extends GameObject`)
                      instead of a hand-maintained interpolation list
    sources.ts      -- declarative list of the 6 mixin files + 7 concrete class files;
                      SET_TYPE_OVERRIDES for the one deliberate Monaco accommodation
                      (Line.pointA/pointB widened to accept `number[]` — see below)
    index.ts        -- generateApiDeclarations(), the one entry point both CLIs call
  generate-api.ts   -- writes src/assets/api/generated/apiDeclarations.generated.ts
                      (gitignored; plain exported string constants, current source only)
  snapshot-api.ts   -- writes src/assets/api/versions/<version>/api.d.ts
                      (committed; real `export type`/`export declare class` syntax,
                      self-contained via imports back to real source — see below)
```

`apiLib.ts` now imports the mixin `*PropsTypeDef`/`positionableApi` and all 7 concrete classes' `*PropsFields`/`*Members` constants from `./generated/apiDeclarations.generated` instead of `./mixins`. Its Core/Utilities/Camera/Vector2 sections, and the "Types" section's non-mixin half (`LibVars`, `Point`/`ArrayPoint`/`PointArg`, `Action`/`Predicate`/`Returnable`/`Printable`/`Optional`, the mouse/key event-map types), stay exactly where they were — hand-written, just bug-fixed. `CodeEditor.vue` needed zero changes: `apiLib` is still just a string, only now partly composed from an import.

The 6 mixins' `propDescription` objects and `*Api`/`*PropsTypeDef` exports are gone — deleted only after the generator was confirmed to reproduce equivalent (and bug-fixed) output. Each mixin file is now just its real `*Props` type (with JSDoc directly on the fields) and its mixin function (with JSDoc directly on the real getters/setters/methods) — one source of truth per description, not two.

**Real bugs the generator itself needed fixing for, found by actually running it (not anticipated in planning):**
- **Import-alias resolution.** `class Sprite extends GameObject` — `GameObject` is a default-imported binding, so `checker.getSymbolAtLocation()` on it returns an *alias* symbol whose `.declarations` points at the import clause, not the class. Needed `checker.getAliasedSymbol()` first. Without this fix, Sprite/Rectangle/Circle/Label's generated members silently contained only their own extra prop and nothing inherited — wrong, but not a crash, so it required actually reading the output to catch.
- **Intersection-type Props fields.** The 6 mixins' `*Props` types are plain type literals (`{ x?: number, ... }`), but every concrete class's is an intersection (`GameObjectProps & { src?: string }`). The field extractor only handled the plain case; concrete classes' own Props fields came out empty until it was taught to find the intersection's last member.
- **Untyped getters inferred as `any`.** Several real getters (`Sprite.src`, `Rectangle.color`, `Circle.color`/`radius`) have no explicit return-type annotation — TS infers it. `.getText()` on an absent type node isn't an option; needed `checker.getSignatureFromDeclaration()` + `getReturnTypeOfSignature()` as a fallback whenever there's no explicit annotation to read verbatim.
- **Double-braced snapshot output.** An early version of `snapshot-api.ts` tried to re-derive a type's body by regex-stripping the mixins' already-wrapped `declare type X = {...}` string. Fragile by construction — fixed by exposing the raw, unwrapped field-line array from the extractor instead of re-parsing pre-wrapped text.
- **Snapshot files had dangling type references.** `Cursor`, `Point`, `PointArg`, `Returnable`, `MouseInputAction`, `PointerAction`, `ScrollAction` are used throughout the generated declarations but weren't defined or imported in the snapshot file itself. This didn't surface as a `vue-tsc --build` error — `@vue/tsconfig`'s base config sets `skipLibCheck: true` project-wide, which skips deep-checking `.d.ts` file contents entirely. Verified this was a real gap (not a false alarm) by type-checking the snapshot standalone with a throwaway `skipLibCheck: false` tsconfig, which failed until the fix landed. Fixed by exporting `Cursor` from `Interactable.ts` (previously module-private) and adding `import type` lines to the snapshot for all 7 names, resolved back to their real source files. **Lesson for future snapshots**: this project's `skipLibCheck: true` means a `.d.ts` file can silently ship with broken internal references and nothing here will catch it automatically — if the generator changes what it references, re-verify standalone resolution the same way, don't trust a clean `vue-tsc --build` alone.

**One deliberate divergence from real source, kept narrow and explicit** (`sources.ts`'s `SET_TYPE_OVERRIDES`): `Line.pointA`/`pointB`'s real setter accepts `Returnable<PointArg>`, but the declared (editor-facing) type is widened to `Returnable<PointArg | number[]>`. This isn't a bug — it's a pre-existing, deliberate accommodation (see the comment that was already in apiLib.ts) for Monaco inferring a plain array literal like `[1, 2]` as `number[]` rather than the precise tuple `ArrayPoint`. A fully mechanical extraction would have silently dropped this and reintroduced the false-positive editor error it exists to prevent. If this class of override ever needs a second entry, keep it in that same table with the same kind of comment — don't let real source silently diverge from what's declared without a paper trail.

**Freshly surfaced, not previously declared anywhere**: running composition-resolution for real (rather than the old hand-picked `${gameObjectApi}`/`${viewableApi}` interpolation lists) means `HLine`/`VLine` now correctly include `age`/`ageMs` (the bug that motivated deriving composition in the first place), and `Positionable.screenX`/`screenY`, `Line.length`/`setPoints()` are declared for the first time.

## What this pass does and does not cover

**Covers**: JSDoc-derived declaration generation for the 6 mixins and 7 concrete classes; a `versions/<label>/api.d.ts` snapshot mechanism triggered by an npm script; the bug fixes listed above.

**Does not cover** (see Context): the version dropdown, project-level version persistence, runtime `api`-object versioning, Core/Utilities/Camera/Vector2 derivation, GameObject's own members, docs-content versioning.

## Considerations for future work

**Core/Utilities/Camera derivation**: these live across `core.ts`/`types.ts`/`Random.ts`/`utility.ts`/`Colors.ts`/`@/sandbox/output`/`@/sandbox/watch`, currently unannotated. The same extraction mechanism built here would apply once JSDoc is added there.

**Dropdown/persistence/runtime versioning**: `CodeEditor.vue`'s version dropdown (`exampleVersionItems`) is a hardcoded placeholder; no DB column exists for project-level version selection; `core.ts`'s real `api` object is unversioned at runtime. A project-level version needs to live next to `projects.slug` in Supabase (same shape: set once at creation, user-changeable via this exact dropdown thereafter), and switching it needs to swap both the Monaco extra-libs (dispose/re-add) and the `api` object handed to `runEntryModule`.

**Docs-content versioning** — captured, not designed: `src/assets/docs/docsContent.ts` builds its entire tree from the filesystem via `import.meta.glob`, folder structure = doc structure, "no manifest to keep in sync" by design. `DocPageMeta` (`docsTypes.ts`) is exactly `{title, icon?, summary, order?}` — no version field exists anywhere. Content under `content/api/**` is 100% hand-typed prose with zero imports from mixins/apiLib (confirmed by grep). It's already independently stale — `content/api/traits/interactable.vue` has prose only, no `<DocProperties>`/`<DocMethods>` at all, unlike sibling trait pages. A docs-versioning effort would be starting from nothing — no field, no convention, no partial scaffolding to build on.

## Verification results

1. **Baseline**: `vue-tsc --build --force` was clean before any change in this pass (re-confirmed multiple times during planning — corrected an earlier, unverified guess that `api.d.ts`'s odd `type Point = Point` line was "very likely already an error"; it wasn't).
2. **Generated output inspected directly**, not just trusted: read the full `generated/apiDeclarations.generated.ts` after each fix, and the full `versions/1.0.0/api.d.ts` snapshot, line by line — this is how the 5 bugs listed above were actually caught (none were anticipated in planning).
3. **`vue-tsc --build --force` clean** after every step (mixin/class JSDoc migration, generator wiring, superseded-export deletion, snapshot creation) — re-run repeatedly throughout, not just once at the end.
4. **Snapshot self-containment verified for real**, not assumed from a clean `vue-tsc` run: type-checked `versions/1.0.0/api.d.ts` standalone with a throwaway tsconfig setting `skipLibCheck: false` (matching this project's real `target`/`moduleResolution`/path aliases) — clean, confirming the file genuinely resolves on its own terms, not just under this project's lenient default.
5. **Collision safety proven, not just argued**: cut a second, throwaway snapshot (`1.0.0-test`) alongside `1.0.0` and re-ran `vue-tsc --build --force` with both present — clean, confirming multiple permanent snapshots really can coexist under `src/**/*` without the `declare global` collision the design was built to avoid. Deleted the throwaway afterward; only `1.0.0` remains.
6. **`apiLib.ts` verified at runtime, not just at the type level**: imported and actually evaluated it via `tsx` (both `apiModel` and `apiLib` are real runtime string-building code, not just types), then scanned the ~44,000-character output for tell-tale breakage — zero double-braces, zero unresolved `${...}` placeholders, and the 2 literal occurrences of the word "undefined" both checked and confirmed legitimate (`Optional<T>`'s own definition, and `Sprite.src`'s real `string | undefined | null` setter type).
7. **Fresh-clone scenario actually simulated**: deleted `generated/` outright and ran `pnpm run type-check` — the new `pretype-check` hook regenerated it automatically before `vue-tsc` ran, clean. Without this hook (added during this pass, beyond the original ask, once it became clear it wasn't optional) the project would fail to build for anyone after a fresh clone or in CI, since `generated/` is gitignored.
8. **Not yet done**: manual browser check of Monaco autocomplete/hover in the running editor — left for the user's own go-ahead, per this project's established norm of not starting browser verification unprompted.
