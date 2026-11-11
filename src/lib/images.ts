import "server-only";
import type { UploadFolder } from "@/lib/storage";

/** Reject anything larger than this before decoding it, to bound memory. */
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024; // 12 MB

type Profile = { maxEdge: number; quality: number };

/**
 * Per-use limits. Listing and ad images only ever render a few hundred pixels
 * wide, so 1600 is already generous. Carné photos are different: the whole
 * point is reading an eleven-digit number written by hand, so they keep more
 * resolution and a higher quality.
 */
const PROFILES: Record<UploadFolder, Profile> = {
  listings: { maxEdge: 1600, quality: 78 },
  ads: { maxEdge: 1600, quality: 80 },
  ids: { maxEdge: 2000, quality: 90 },
};

export type ProcessedImage = { bytes: Buffer; contentType: string };

/**
 * Shrink an upload to something a phone on Cuban mobile data can actually
 * fetch. A stock camera photo is 3-8 MB; this lands around 100-250 KB.
 *
 * Two things happen for free alongside the resize:
 *   - EXIF is dropped, which takes the GPS coordinates out of photos taken at
 *     home or in a dorm. Students should not be publishing their address.
 *   - Orientation is baked in, so portrait phone photos stop appearing on
 *     their side.
 */
export async function processImage(
  input: Buffer,
  folder: UploadFolder,
): Promise<ProcessedImage> {
  const { maxEdge, quality } = PROFILES[folder];
  const sharp = (await import("sharp")).default;

  const bytes = await sharp(input)
    // Honour the EXIF orientation flag, then discard the metadata with it.
    .rotate()
    .resize({
      width: maxEdge,
      height: maxEdge,
      fit: "inside",
      withoutEnlargement: true, // never upscale a small image into a big file
    })
    .webp({ quality })
    .toBuffer();

  return { bytes, contentType: "image/webp" };
}

/**
 * A carné rendition sized for a vision model.
 *
 * JPEG rather than WebP on purpose: every vision provider accepts JPEG, while
 * WebP support varies, and a verification that fails because of a container
 * format would be indistinguishable from a student holding up the wrong card.
 *
 * 1600px keeps the eleven handwritten digits legible while cutting a stock
 * phone photo from several megabytes to a few hundred kilobytes — base64 adds
 * a third on top, so this is also what keeps the request under provider
 * payload limits.
 */
export async function imageForVision(input: Buffer): Promise<ProcessedImage> {
  const sharp = (await import("sharp")).default;
  const bytes = await sharp(input)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  return { bytes, contentType: "image/jpeg" };
}
