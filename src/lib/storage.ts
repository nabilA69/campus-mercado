import "server-only";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Storage abstraction so uploads work both locally (disk) and in production.
//   STORAGE_DRIVER=local        -> writes to /public/uploads (dev, or a host with a persistent volume)
//   STORAGE_DRIVER=vercel-blob  -> Vercel Blob (recommended on Vercel; auto-configured via BLOB_READ_WRITE_TOKEN)
//   STORAGE_DRIVER=s3           -> any S3-compatible bucket (Cloudflare R2, AWS S3, Backblaze B2, MinIO)
// Serverless hosts (e.g. Vercel) have an ephemeral filesystem, so they MUST use vercel-blob or s3.

const DRIVER = process.env.STORAGE_DRIVER || "local";

export type UploadFolder = "ids" | "listings" | "ads";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export function isAllowedImage(type: string): boolean {
  return ALLOWED.includes(type);
}

function extFor(type: string): string {
  return type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
}

/** Save an uploaded image and return the URL to store in the DB. */
export async function saveImage(
  file: File,
  folder: UploadFolder,
): Promise<string> {
  const bytes = Buffer.from(await file.arrayBuffer());
  return saveImageBytes(bytes, file.type, folder);
}

/** Save raw image bytes (when you've already read the file) and return the URL. */
export async function saveImageBytes(
  bytes: Buffer,
  contentType: string,
  folder: UploadFolder,
): Promise<string> {
  const key = `${folder}/${randomUUID()}.${extFor(contentType)}`;
  if (DRIVER === "vercel-blob") return saveToVercelBlob(key, bytes, contentType);
  if (DRIVER === "s3") return saveToS3(key, bytes, contentType);
  return saveToLocal(key, bytes);
}

async function saveToVercelBlob(
  key: string,
  bytes: Buffer,
  contentType: string,
): Promise<string> {
  const { put } = await import("@vercel/blob");
  // Only pass `token` if it's explicitly set; otherwise let the SDK resolve
  // credentials itself (on Vercel a connected Blob store is auto-authenticated).
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const { url } = await put(key, bytes, {
    access: "public",
    contentType,
    addRandomSuffix: false,
    ...(token ? { token } : {}),
  });
  return url;
}

async function saveToLocal(key: string, bytes: Buffer): Promise<string> {
  const full = path.join(process.cwd(), "public", "uploads", key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);
  return `/uploads/${key}`;
}

let s3client: import("@aws-sdk/client-s3").S3Client | undefined;

async function saveToS3(
  key: string,
  bytes: Buffer,
  contentType: string,
): Promise<string> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  s3client ??= new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    },
  });

  await s3client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: bytes,
      ContentType: contentType,
    }),
  );

  const base = (process.env.S3_PUBLIC_URL || "").replace(/\/$/, "");
  return `${base}/${key}`;
}
