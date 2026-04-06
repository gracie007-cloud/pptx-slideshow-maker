/**
 * Storage abstraction: GCS in production, local filesystem in development.
 * Slide images are served via /api/media/[...path] proxy (no public bucket needed).
 */

import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

export const USE_GCS =
  !!process.env.GCS_BUCKET && process.env.NODE_ENV === "production";
const BUCKET = process.env.GCS_BUCKET ?? "slideshow-uploads";
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

// ─── Types ───────────────────────────────────────────────────

export interface StorageFile {
  /** URL to fetch the file (proxy URL or local URL) */
  url: string;
  /** GCS object name or local relative path (stored in DB) */
  path: string;
}

// ─── GCS client (lazy loaded) ────────────────────────────────

let _bucket: any = null;
async function getGCSBucket() {
  if (_bucket) return _bucket;
  // Dynamic import to avoid build-time module resolution issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gcsModule = await (Function('return import("@google-cloud/storage")')() as Promise<any>);
  const Storage = gcsModule.Storage;
  const storage = new Storage({ projectId: process.env.GCP_PROJECT });
  _bucket = storage.bucket(BUCKET);
  return _bucket;
}

// ─── Upload ──────────────────────────────────────────────────

export async function uploadFile(
  buffer: Buffer,
  destPath: string,
  contentType: string
): Promise<StorageFile> {
  if (USE_GCS) {
    const bucket = await getGCSBucket();
    await bucket.file(destPath).save(buffer, { contentType, resumable: false });
    return {
      url: `/api/media/${destPath}`,
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

// ─── Download (for proxy route) ───────────────────────────────

export async function downloadFile(storagePath: string): Promise<Buffer> {
  if (USE_GCS) {
    const bucket = await getGCSBucket();
    const [data] = await bucket.file(storagePath).download();
    return data;
  }

  const { readFile } = await import("fs/promises");
  return readFile(path.join(LOCAL_UPLOADS_DIR, storagePath));
}

// ─── Delete ──────────────────────────────────────────────────

export async function deleteFile(storagePath: string): Promise<void> {
  if (USE_GCS) {
    const bucket = await getGCSBucket();
    await bucket.file(storagePath).delete({ ignoreNotFound: true });
    return;
  }

  const { unlink: rm } = await import("fs/promises");
  const localPath = path.join(LOCAL_UPLOADS_DIR, storagePath);
  await rm(localPath).catch(() => {});
}

// ─── Public URL helper ───────────────────────────────────────

export function getMediaUrl(storagePath: string): string {
  if (USE_GCS) {
    return `/api/media/${storagePath}`;
  }
  return `/uploads/${storagePath}`;
}
