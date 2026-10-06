import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

// Default Cloudflare R2 Credentials for Kerala Superstore UK
const DEFAULT_R2_ACCOUNT_ID = "0783d20a277aa059701bf958337cc1f8";
const DEFAULT_R2_ACCESS_KEY_ID = "d2339381b4a4a6b1b34bf4748348ad67";
const DEFAULT_R2_SECRET_ACCESS_KEY = "24672e2d8b4852fb6f75d9eac54f66e49a63884c59347182f9874f88b9c0935c";
const DEFAULT_R2_BUCKET_NAME = "kerala-superstore-images";
const DEFAULT_R2_PUBLIC_URL = "https://pub-1224a2c0eeef442090d49ac5a026c2ee.r2.dev";

// Helper to check if R2 credentials are present
export function isR2Configured(): boolean {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || DEFAULT_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || DEFAULT_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || DEFAULT_R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || DEFAULT_R2_BUCKET_NAME;

  return Boolean(accountId && accessKeyId && secretAccessKey && bucketName);
}

// Create S3 Client configured for Cloudflare R2
export function getR2Client(): S3Client {
  const accountId = (process.env.CLOUDFLARE_R2_ACCOUNT_ID || DEFAULT_R2_ACCOUNT_ID).trim();
  const accessKeyId = (process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || DEFAULT_R2_ACCESS_KEY_ID).trim();
  const secretAccessKey = (process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || DEFAULT_R2_SECRET_ACCESS_KEY).trim();

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export interface R2UploadResult {
  success: boolean;
  url: string;
  key: string;
  sizeBytes: number;
}

/**
 * Upload a file Buffer directly to Cloudflare R2 bucket
 */
export async function uploadToR2(
  fileBuffer: Buffer | Uint8Array,
  fileName: string,
  contentType: string = "image/webp",
  folder: string = "products"
): Promise<R2UploadResult> {
  const bucket = (process.env.CLOUDFLARE_R2_BUCKET_NAME || DEFAULT_R2_BUCKET_NAME).trim();
  const client = getR2Client();

  // Clean filename and create clean path
  const sanitizedName = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-");
  
  const timestamp = Date.now();
  const key = `${folder}/${timestamp}-${sanitizedName}`;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable", // 1 year CDN caching
  });

  await client.send(command);

  // Construct public permanent URL
  const publicBaseUrl = (process.env.CLOUDFLARE_R2_PUBLIC_URL || DEFAULT_R2_PUBLIC_URL).trim();
  let publicUrl = "";

  if (publicBaseUrl) {
    publicUrl = `${publicBaseUrl.replace(/\/+$/, "")}/${key}`;
  } else {
    publicUrl = `https://${bucket}.r2.cloudflarestorage.com/${key}`;
  }

  return {
    success: true,
    url: publicUrl,
    key,
    sizeBytes: fileBuffer.length,
  };
}

/**
 * Save JSON configuration directly to Cloudflare R2 (Global persistence across all devices)
 */
export async function saveJsonToR2(key: string, data: any): Promise<boolean> {
  if (!isR2Configured()) return false;
  try {
    const bucket = (process.env.CLOUDFLARE_R2_BUCKET_NAME || DEFAULT_R2_BUCKET_NAME).trim();
    const client = getR2Client();
    const jsonStr = JSON.stringify(data, null, 2);
    
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: Buffer.from(jsonStr, 'utf-8'),
        ContentType: 'application/json',
        CacheControl: 'no-cache, no-store, must-revalidate',
      })
    );
    return true;
  } catch (err) {
    console.error(`Failed to save JSON to R2 (${key}):`, err);
    return false;
  }
}

/**
 * Fetch JSON configuration directly from Cloudflare R2
 */
export async function getJsonFromR2<T = any>(key: string): Promise<T | null> {
  if (!isR2Configured()) return null;
  try {
    const bucket = (process.env.CLOUDFLARE_R2_BUCKET_NAME || DEFAULT_R2_BUCKET_NAME).trim();
    const client = getR2Client();

    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    if (!response.Body) return null;
    const bodyString = await response.Body.transformToString();
    return JSON.parse(bodyString) as T;
  } catch (err: any) {
    // NoSuchKey is normal when initializing for the first time
    if (err.name !== 'NoSuchKey') {
      console.warn(`Could not read ${key} from R2:`, err.message);
    }
    return null;
  }
}

