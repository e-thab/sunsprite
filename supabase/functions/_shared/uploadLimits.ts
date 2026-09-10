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

// Backstop one tier above MAX_PROJECT_SIZE/MAX_ACCOUNT_SIZE: those cap what a
// single account can use, but say nothing about the platform-wide total
// across every account, which is what actually determines whether this
// project stays inside Supabase's free 500MB database / Cloudflare R2's free
// 10GB storage tier or starts incurring real charges. Checked in
// enforce_storage_quota() (GLOBAL_DB_SIZE) and r2-sign-upload/
// r2-confirm-upload (GLOBAL_R2_SIZE) against public.storage_totals — a
// snapshot refreshed every 5 minutes by pg_cron (see
// supabase/migrations/20260902120000_enforce_global_storage_quota.sql for why
// a cached snapshot, not a live count, and the mirrored global_db_cap/
// global_r2_cap constants there — plpgsql can't import this file, so that
// migration hand-keeps its own copy of these two numbers). Both 90% of the
// real ceiling, leaving headroom for staleness between refreshes.
export const GLOBAL_DB_SIZE = 0.9 * 500 * 1024 * 1024;
export const GLOBAL_R2_SIZE = 0.9 * 10 * 1024 * 1024 * 1024;
