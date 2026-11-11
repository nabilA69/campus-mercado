import "server-only";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { processImage, MAX_UPLOAD_BYTES } from "@/lib/images";

// Storage abstraction so uploads work both locally (disk) and in production.
//   STORAGE_DRIVER=local        -> writes to /public/uploads (dev, or a host with a persistent volume)
//   STORAGE_DRIVER=vercel-blob  -> Vercel Blob (recommended on Vercel; auto-configured via BLOB_READ_WRITE_TOKEN)
//   STORAGE_DRIVER=s3           -> any S3-compatible bucket (Cloudflare R2, AWS S3, Backblaze B2, MinIO)
// Serverless hosts (e.g. Vercel) have an ephemeral filesystem, so they MUST use vercel-blob or s3.

const DRIVER = process.env.STORAGE_DRIVER || "local";

export type UploadFolder = "ids" | "listings" | "ads";

/** Thrown when storage is misconfigured or the upload fails, so callers can show
 *  a real message instead of crashing the request with a 500. */
export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StorageError";
  }
}

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

/**
 * Save raw image bytes (when you've already read the file) and return the URL.
 * Everything is resized and re-encoded on the way through — see processImage.
 */
export async function saveImageBytes(
  bytes: Buffer,
  contentType: string,
  folder: UploadFolder,
): Promise<string> {
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new StorageError("imageTooLarge");
  }

  let out: Buffer = bytes;
  let outType = contentType;
  try {
    const processed = await processImage(bytes, folder);
    out = processed.bytes;
    outType = processed.contentType;
  } catch {
    // isAllowedImage only trusts the client-declared MIME type. If the decoder
    // cannot read the bytes, this is not the image it claims to be, so refuse
    // it rather than storing an unknown file under an image name.
    throw new StorageError("imageUnreadable");
  }

  const key = `${folder}/${randomUUID()}.${extFor(outType)}`;
  if (DRIVER === "vercel-blob") return saveToVercelBlob(key, out, outType);
  if (DRIVER === "s3") return saveToS3(key, out, outType);
  return saveToLocal(key, out);
}

async function saveToVercelBlob(
  key: string,
  bytes: Buffer,
  contentType: string,
): Promise<string> {
  // Two ways to authenticate, and the modern one needs no secret of ours:
  //   OIDC            a store connected in the dashboard sets BLOB_STORE_ID and
  //                   the SDK signs requests itself. Vercel recommends this and
  //                   suggests revoking the standalone token.
  //   explicit token  BLOB_READ_WRITE_TOKEN, for running outside Vercel.
  // Demanding the token outright used to reject a perfectly working OIDC setup,
  // so only pass it when it exists and let the SDK fall back to OIDC.
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token && !process.env.BLOB_STORE_ID) {
    throw new StorageError(
      "No Vercel Blob credentials. Connect a Blob store to this project (Vercel > Storage), which sets BLOB_STORE_ID, or set BLOB_READ_WRITE_TOKEN to run outside Vercel. Redeploy after either.",
    );
  }

  try {
    const { put } = await import("@vercel/blob");
    const { url } = await put(key, bytes, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      ...(token ? { token } : {}),
    });
    return url;
  } catch (err) {
    if (err instanceof StorageError) throw err;
    throw new StorageError(`Vercel Blob upload failed: ${String(err)}`);
  }
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

/** Error codes a StorageError may carry, for callers to turn into a message. */
const STORAGE_CODES = ["imageTooLarge", "imageUnreadable"] as const;

/**
 * Turn a thrown upload error into a translation key. Anything we did not raise
 * deliberately is reported as the generic "storage is down" message, since the
 * real cause (a missing bucket, a network blip) is not the user's to act on.
 */
export function uploadErrorKey(err: unknown): string {
  if (
    err instanceof StorageError &&
    (STORAGE_CODES as readonly string[]).includes(err.message)
  ) {
    return err.message;
  }
  return "storageUnavailable";
}
