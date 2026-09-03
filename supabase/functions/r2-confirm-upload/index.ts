import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { createClient } from "@supabase/supabase-js";
import { deleteObject, headObject, publicUrlFor } from "../_shared/r2.ts";
import { ALLOWED_CONTENT_TYPES, GLOBAL_R2_SIZE, MAX_ACCOUNT_SIZE, MAX_FILE_SIZE, MAX_PROJECT_SIZE } from "../_shared/uploadLimits.ts";

// images rows are only ever created here, via this service-role client — the
// authenticated role has no insert grant on public.images (see the
// restrict_images_writes migration). That's what makes the checks below a
// real boundary rather than just client-side advice: a raw Data API call
// can no longer create a row with a self-reported size/content_type.
const adminClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    const { projectId, folderId, name, objectKey, position } = await req.json();

    if (typeof objectKey !== "string" || !objectKey) {
      return Response.json({ error: "objectKey is required" }, { status: 400 });
    }

    // The service-role insert below bypasses RLS entirely, so this
    // ownership check (run as the calling user, respecting RLS) is the
    // actual authorization gate for this request.
    const { data: project } = await ctx.supabase
      .from("projects")
      .select("id, owner_id")
      .eq("id", projectId)
      .maybeSingle();
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const head = await headObject(objectKey);
    if (!head) {
      return Response.json({ error: "Uploaded object not found" }, { status: 404 });
    }

    if (!ALLOWED_CONTENT_TYPES.has(head.contentType) || head.size <= 0 || head.size > MAX_FILE_SIZE) {
      await deleteObject(objectKey);
      return Response.json({ error: "Uploaded file failed validation" }, { status: 400 });
    }

    // Every project this same owner has — see r2-sign-upload's identical
    // lookup for why this is derived from project.owner_id rather than a
    // separate "current user" fetch.
    const { data: ownedProjects, error: ownedProjectsError } = await ctx.supabase
      .from("projects")
      .select("id")
      .eq("owner_id", project.owner_id);
    if (ownedProjectsError) {
      await deleteObject(objectKey);
      return Response.json({ error: ownedProjectsError.message }, { status: 500 });
    }
    const ownedProjectIds = (ownedProjects ?? []).map((p) => p.id);

    // Combined total across every owned project — see r2-sign-upload's
    // identical check for why this covers scripts/text_files content too,
    // not just images, and why per-project/account-wide are both derived
    // from one pass over the same rows. Re-checked here (not just trusted
    // from the pre-check in r2-sign-upload) because other files could have
    // been added in between the two calls.
    const [scriptsRes, textFilesRes, imagesRes] = await Promise.all([
      ctx.supabase.from("scripts").select("project_id, content").in("project_id", ownedProjectIds),
      ctx.supabase.from("text_files").select("project_id, content").in("project_id", ownedProjectIds),
      ctx.supabase.from("images").select("project_id, size").in("project_id", ownedProjectIds),
    ]);
    if (scriptsRes.error) {
      await deleteObject(objectKey);
      return Response.json({ error: scriptsRes.error.message }, { status: 500 });
    }
    if (textFilesRes.error) {
      await deleteObject(objectKey);
      return Response.json({ error: textFilesRes.error.message }, { status: 500 });
    }
    if (imagesRes.error) {
      await deleteObject(objectKey);
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

    if (projectTotal + head.size > MAX_PROJECT_SIZE) {
      await deleteObject(objectKey);
      return Response.json(
        { error: `This project has reached its ${MAX_PROJECT_SIZE / (1024 * 1024)}MB storage limit` },
        { status: 400 },
      );
    }
    if (accountTotal + head.size > MAX_ACCOUNT_SIZE) {
      await deleteObject(objectKey);
      return Response.json(
        { error: `Your account has reached its ${MAX_ACCOUNT_SIZE / (1024 * 1024)}MB storage limit across all projects` },
        { status: 400 },
      );
    }

    // Platform-wide backstop, re-checked here for the same reason the
    // project/account totals above are re-checked rather than trusted from
    // r2-sign-upload's pre-check: other uploads could have landed in between
    // the two calls. See GLOBAL_R2_SIZE for why this reads a cached snapshot.
    const { data: totals, error: totalsError } = await ctx.supabase
      .from("storage_totals")
      .select("r2_bytes")
      .eq("id", true)
      .single();
    if (totalsError) {
      await deleteObject(objectKey);
      return Response.json({ error: totalsError.message }, { status: 500 });
    }
    if (totals.r2_bytes + head.size > GLOBAL_R2_SIZE) {
      await deleteObject(objectKey);
      return Response.json(
        { error: "Sunsprite has hit its overall storage limit right now — please try again later" },
        { status: 400 },
      );
    }

    const { data: row, error: insertError } = await adminClient
      .from("images")
      .insert({
        project_id: projectId,
        folder_id: folderId,
        name,
        object_key: objectKey,
        content_type: head.contentType,
        size: head.size,
        position,
      })
      .select("id, name, object_key, content_type, size, folder_id, position")
      .single();

    if (insertError) {
      await deleteObject(objectKey);
      if (insertError.code === "23505") {
        return Response.json({ error: "A file with that name already exists in this project." }, { status: 409 });
      }
      return Response.json({ error: insertError.message }, { status: 500 });
    }

    return Response.json({
      id: row.id,
      name: row.name,
      objectKey: row.object_key,
      publicUrl: publicUrlFor(row.object_key),
      contentType: row.content_type,
      size: row.size,
      folderId: row.folder_id,
      position: row.position,
    });
  }),
};
