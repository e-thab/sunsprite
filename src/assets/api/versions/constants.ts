/**
 * The one API version id that isn't a permanent snapshot. `dev` resolves to the
 * live source under src/assets/api/ (plus src/sandbox/watch.ts) exactly as it
 * stands right now, declarations and runnable code alike — so a change to the
 * API is playable the moment it's saved, without cutting a version for it
 * first. Every other id names a frozen folder beside this file.
 *
 * It's a reserved label, not a directory: scripts/snapshot-api.ts refuses to
 * cut a snapshot under this name, since a versions/dev/ folder would be picked
 * up by ./index.ts's and ./runtime.ts's globs and shadow this entry with a
 * frozen copy of exactly the thing it exists to bypass.
 *
 * Lives in its own dependency-free module rather than in either of those two
 * files because both sides need it, and neither may import the other: index.ts
 * is host-only (it globs every snapshot's Monaco declarations, which the
 * sandbox has no use for) and runtime.ts is sandbox-only (it globs their
 * runnable source, which the host bundle must never pull in). Keeping the id
 * here is what lets hostBridge.ts and sandbox/main.ts agree on it without
 * either one reaching across that split.
 */
export const DEV_VERSION = 'dev'
