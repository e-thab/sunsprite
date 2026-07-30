import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { publicUrlFor, signPutUrl } from "../_shared/r2.ts";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "image/webp",
]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PROJECT_SIZE = 100 * 1024 * 1024;

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    const { projectId, fileName, contentType, size } = await req.json();

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
