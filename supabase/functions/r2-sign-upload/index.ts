import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { publicUrlFor, signPutUrl } from "../_shared/r2.ts";
import { ALLOWED_CONTENT_TYPES, MAX_ACCOUNT_SIZE, MAX_FILE_SIZE, MAX_PROJECT_SIZE } from "../_shared/uploadLimits.ts";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    const { projectId, fileName, contentType, size } = await req.json();

    // contentType/size here are just what the client claims pre-upload, so
    // this is a fast fail for the common case — not a security boundary.
    // r2-confirm-upload re-checks both against the real uploaded object
    // (via a HEAD request) before the images row is ever created.
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return Response.json({ error: "Unsupported file type" }, { status: 400 });
    }
    if (typeof size !== "number" || size <= 0 || size > MAX_FILE_SIZE) {
      return Response.json({ error: "File is too large (max 10MB)" }, { status: 400 });
    }

    const { data: project } = await ctx.supabase
      .from("projects")
      .select("id, owner_id")
      .eq("id", projectId)
      .maybeSingle();
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    // Every project this same owner has, not just this one — needed for the
    // account-wide check below. Derived from project.owner_id rather than a
    // separate "current user" lookup, since that's already the one thing
    // this query above establishes; every other check in this file follows
    // the same existing pattern of trusting ctx.supabase's own RLS scoping
    // rather than threading a user id through by hand.
    const { data: ownedProjects, error: ownedProjectsError } = await ctx.supabase
      .from("projects")
      .select("id")
      .eq("owner_id", project.owner_id);
    if (ownedProjectsError) {
      return Response.json({ error: ownedProjectsError.message }, { status: 500 });
    }
    const ownedProjectIds = (ownedProjects ?? []).map((p) => p.id);

    // One query across every owned project, not one query per project — the
    // per-project total (this project only) and the account-wide total
    // (every owned project) are both just different sums over the same rows,
    // so there's no reason to fetch them twice. Combined bytes throughout:
    // scripts + text_files content (real, via TextEncoder — matching how the
    // client itself measures them, see projectStore.ts's fetchStorageUsage)
    // plus images' own stored size column.
    const [scriptsRes, textFilesRes, imagesRes] = await Promise.all([
      ctx.supabase.from("scripts").select("project_id, content").in("project_id", ownedProjectIds),
      ctx.supabase.from("text_files").select("project_id, content").in("project_id", ownedProjectIds),
      ctx.supabase.from("images").select("project_id, size").in("project_id", ownedProjectIds),
    ]);
    if (scriptsRes.error) {
      return Response.json({ error: scriptsRes.error.message }, { status: 500 });
    }
    if (textFilesRes.error) {
      return Response.json({ error: textFilesRes.error.message }, { status: 500 });
    }
    if (imagesRes.error) {
      return Response.json({ error: imagesRes.error.message }, { status: 500 });
    }

    const encoder = new TextEncoder();
    let projectTotal = 0;
    let accountTotal = 0;
    for (const row of [...(scriptsRes.data ?? []), ...(textFilesRes.data ?? [])]) {
      const bytes = encoder.encode(row.content).length;
      accountTotal += bytes;
      if (row.project_id === projectId) projectTotal += bytes;
    }
    for (const row of imagesRes.data ?? []) {
      accountTotal += row.size;
      if (row.project_id === projectId) projectTotal += row.size;
    }

    if (projectTotal + size > MAX_PROJECT_SIZE) {
      return Response.json(
        { error: `This project has reached its ${MAX_PROJECT_SIZE / (1024 * 1024)}MB storage limit` },
        { status: 400 },
      );
    }
    if (accountTotal + size > MAX_ACCOUNT_SIZE) {
      return Response.json(
        { error: `Your account has reached its ${MAX_ACCOUNT_SIZE / (1024 * 1024)}MB storage limit across all projects` },
        { status: 400 },
      );
    }

    const objectKey = `${projectId}/${crypto.randomUUID()}-${sanitizeFileName(fileName)}`;
    const uploadUrl = await signPutUrl(objectKey, contentType);

    return Response.json({
      uploadUrl,
      objectKey,
      publicUrl: publicUrlFor(objectKey),
    });
  }),
};
