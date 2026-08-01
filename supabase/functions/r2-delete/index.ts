import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { deleteObject } from "../_shared/r2.ts";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    const { objectKey } = await req.json();
    if (typeof objectKey !== "string" || !objectKey) {
      return Response.json({ error: "objectKey is required" }, { status: 400 });
    }

    const { data: image } = await ctx.supabase
      .from("images")
      .select("id")
      .eq("object_key", objectKey)
      .maybeSingle();
    if (!image) {
      return Response.json({ error: "Image not found" }, { status: 404 });
    }

    await deleteObject(objectKey);

    return Response.json({ ok: true });
  }),
};
