import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { createClient } from "@supabase/supabase-js";
import { deleteObject, headObject, publicUrlFor } from "../_shared/r2.ts";
import { ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE, MAX_PROJECT_SIZE } from "../_shared/uploadLimits.ts";

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
      .select("id")
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

    const { data: existingImages, error: sumError } = await ctx.supabase
      .from("images")
      .select("size")
      .eq("project_id", projectId);
    if (sumError) {
      await deleteObject(objectKey);
      return Response.json({ error: sumError.message }, { status: 500 });
    }

    const currentTotal = (existingImages ?? []).reduce((sum, row) => sum + row.size, 0);
    if (currentTotal + head.size > MAX_PROJECT_SIZE) {
      await deleteObject(objectKey);
      return Response.json(
        { error: "This project has reached its 100MB image storage limit" },
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
