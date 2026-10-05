import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Helper to check if R2 credentials are present
export function isR2Configured(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_R2_ACCOUNT_ID &&
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
    process.env.CLOUDFLARE_R2_BUCKET_NAME
  );
}

// Create S3 Client configured for Cloudflare R2
export function getR2Client(): S3Client {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing Cloudflare R2 environment variables. Please check .env file.");
  }

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
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim();
  if (!bucket) {
    throw new Error("CLOUDFLARE_R2_BUCKET_NAME is not configured.");
  }

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
  const publicBaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim() || "";
  let publicUrl = "";

  if (publicBaseUrl) {
    publicUrl = `${publicBaseUrl.replace(/\/+$/, "")}/${key}`;
  } else {
    // Default R2 dev public URL fallback format
    publicUrl = `https://${bucket}.r2.cloudflarestorage.com/${key}`;
  }

  return {
    success: true,
    url: publicUrl,
    key,
    sizeBytes: fileBuffer.length,
  };
}
