import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { publicUrlFor, signPutUrl } from "../_shared/r2.ts";
import { ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE, MAX_PROJECT_SIZE } from "../_shared/uploadLimits.ts";

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
      .select("id")
      .eq("id", projectId)
      .maybeSingle();
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    const { data: existingImages, error: sumError } = await ctx.supabase
      .from("images")
      .select("size")
      .eq("project_id", projectId);
    if (sumError) {
      return Response.json({ error: sumError.message }, { status: 500 });
    }

    const currentTotal = (existingImages ?? []).reduce((sum, row) => sum + row.size, 0);
    if (currentTotal + size > MAX_PROJECT_SIZE) {
      return Response.json(
        { error: "This project has reached its 100MB image storage limit" },
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
