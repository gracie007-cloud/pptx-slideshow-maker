/**
 * Storage abstraction: GCS in production, local filesystem in development.
 */

import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

const USE_GCS = process.env.GCS_BUCKET && process.env.NODE_ENV === "production";
const BUCKET = process.env.GCS_BUCKET ?? "slideshow-uploads";
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "apps/web/public/uploads");

// ─── Types ───────────────────────────────────────────────────

export interface StorageFile {
  /** Public-accessible URL */
  url: string;
  /** Storage path (GCS object name or local relative path) */
  path: string;
}

// ─── GCS helpers (loaded lazily so local dev doesn't need credentials) ───

async function getGCSBucket() {
  const { Storage } = await import("@google-cloud/storage");
  const storage = new Storage({ projectId: process.env.GCP_PROJECT });
  return storage.bucket(BUCKET);
}

// ─── Upload ──────────────────────────────────────────────────

export async function uploadFile(
  buffer: Buffer,
  destPath: string,
  contentType: string
): Promise<StorageFile> {
  if (USE_GCS) {
    const bucket = await getGCSBucket();
    const file = bucket.file(destPath);
    await file.save(buffer, { contentType, resumable: false });
    await file.makePublic();
    return {
      url: `https://storage.googleapis.com/${BUCKET}/${destPath}`,
      path: destPath,
    };
  }

  // Local fallback
  const localPath = path.join(LOCAL_UPLOADS_DIR, destPath);
  await mkdir(path.dirname(localPath), { recursive: true });
  await writeFile(localPath, buffer);
  return {
    url: `/uploads/${destPath}`,
    path: destPath,
  };
}

// ─── Delete ──────────────────────────────────────────────────

export async function deleteFile(storagePath: string): Promise<void> {
  if (USE_GCS) {
    const bucket = await getGCSBucket();
    await bucket.file(storagePath).delete({ ignoreNotFound: true });
    return;
  }

  const localPath = path.join(LOCAL_UPLOADS_DIR, storagePath);
  await unlink(localPath).catch(() => {});
}

// ─── Signed URL for pipeline-to-GCS writes ───────────────────

export async function getSignedUploadUrl(
  destPath: string,
  contentType: string,
  expiresMs = 15 * 60 * 1000
): Promise<string> {
  if (!USE_GCS) {
    return `/api/mock-upload?path=${encodeURIComponent(destPath)}`;
  }

  const bucket = await getGCSBucket();
  const [url] = await bucket.file(destPath).getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + expiresMs,
    contentType,
  });
  return url;
}

// ─── Public URL helper ───────────────────────────────────────

export function getPublicUrl(storagePath: string): string {
  if (USE_GCS) {
    return `https://storage.googleapis.com/${BUCKET}/${storagePath}`;
  }
  return `/uploads/${storagePath}`;
}
