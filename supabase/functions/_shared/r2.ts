import { AwsClient } from "npm:aws4fetch@1.0.20";

const R2_ACCOUNT_ID = Deno.env.get("R2_ACCOUNT_ID")!;
const R2_BUCKET_NAME = Deno.env.get("R2_BUCKET_NAME")!;
const R2_PUBLIC_BASE_URL = Deno.env.get("R2_PUBLIC_BASE_URL")!;

const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const client = new AwsClient({
  accessKeyId: Deno.env.get("R2_ACCESS_KEY_ID")!,
  secretAccessKey: Deno.env.get("R2_SECRET_ACCESS_KEY")!,
});

export function publicUrlFor(objectKey: string): string {
  return `${R2_PUBLIC_BASE_URL}/${objectKey}`;
}

export async function signPutUrl(objectKey: string, contentType: string): Promise<string> {
  const signed = await client.sign(
    new Request(`${endpoint}/${R2_BUCKET_NAME}/${objectKey}?X-Amz-Expires=3600`, {
      method: "PUT",
      headers: { "Content-Type": contentType },
    }),
    { aws: { signQuery: true } },
  );
  return signed.url.toString();
}

export async function headObject(objectKey: string): Promise<{ size: number; contentType: string } | null> {
  const signed = await client.sign(
    new Request(`${endpoint}/${R2_BUCKET_NAME}/${objectKey}`, { method: "HEAD" }),
    { aws: { signQuery: true } },
  );
  const res = await fetch(signed);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Failed to HEAD R2 object: ${res.status} ${await res.text()}`);
  }
  return {
    size: Number(res.headers.get("content-length")),
    contentType: res.headers.get("content-type") ?? "",
  };
}

export async function deleteObject(objectKey: string): Promise<void> {
  const signed = await client.sign(
    new Request(`${endpoint}/${R2_BUCKET_NAME}/${objectKey}`, { method: "DELETE" }),
    { aws: { signQuery: true } },
  );
  const res = await fetch(signed);
  if (!res.ok && res.status !== 404) {
    throw new Error(`Failed to delete R2 object: ${res.status} ${await res.text()}`);
  }
}
