export const ALLOWED_CONTENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
]);
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// The one source of truth for a project's total storage cap — combined
// scripts + text_files content (real bytes) + images' own stored `size`
// column, enforced server-side in r2-sign-upload/r2-confirm-upload (see
// their own inline totals there) and mirrored client-side by
// src/stores/projectStore.ts, which re-exports this exact value as
// PROJECT_STORAGE_QUOTA_BYTES rather than keeping its own separate number.
// Previously 100MB and images-only here — a project's *scripts/text* were
// never counted against it at all, while the client-side display already
// (incorrectly, relative to what was actually enforced) folded them in.
// 10MB now, and it means the same thing everywhere.
export const MAX_PROJECT_SIZE = 10 * 1024 * 1024;

// Same idea, one tier up — every project a single account owns, combined.
// Enforced alongside MAX_PROJECT_SIZE in the same two edge functions (a
// project under its own 10MB cap can still be rejected here if the
// account's other projects are already using most of this), and mirrored
// client-side by ProjectsView.vue's own account-wide progress bar, summed
// from the same per-project figures fetchStorageUsage() already pulls.
export const MAX_ACCOUNT_SIZE = 25 * 1024 * 1024;
